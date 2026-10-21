import * as THREE from 'three';
import { frameDelta,wrapCurvePhase,easeInOutCubic } from './frame-clock.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {findSystemZoomTarget} from './system-zoom.js';
import { childNodes, nodeById } from './atlas-data.js';
import { getGalaxyMorphology } from './galaxy-morphology.js';
import { getStarClassification, getPlanetClassification } from './stellar-telemetry.js';
import { BRIDGES, isSuppressed } from './visual-suppression.js';
import { dashedLineBatch } from './network-geometry.js';
import { FrameTimingWindow } from './frame-timing.js';
import { provisionalSurveyCells } from './survey-sectors.js';

const V = (p) => new THREE.Vector3(p[0],p[1],p[2]);
const ORNAMENTS={
  'perseus-confluence':[['Glow',52,'#ffd5a2',.48],['Glow',15,'#ffffff',.82],['Starburst',14,'#fffbeb',.8],['Ring',18,'#fde047',.24,0]],
  'centauri-marches':[['Glow',40,'#c084fc',.35],['Starburst',11,'#c084fc',.75],['Ring',16,'#a855f7',.2,0]],
  'halcyon-arm':[['Starburst',11,'#bae6fd',.75],['Ring',16,'#38bdf8',.2,0]],
  'ember-span':[['Glow',42,'#fb923c',.38]],
  'southern-territories':[['Ring',16,null,.18,.35]]
};
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
function hash(t){let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let x=Math.imul(s^(s>>>15),1|s);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296;};}
const _glowTextureCache=new Map();
function makeGlow(color='#49dfff'){
  const key=String(color).toLowerCase();
  if(_glowTextureCache.has(key))return _glowTextureCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');const grad=ctx.createRadialGradient(64,64,0,64,64,64);
  grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.1,color);grad.addColorStop(.24,color+'99');grad.addColorStop(.56,color+'22');grad.addColorStop(1,color+'00');
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  t.userData={isShared:true};
  _glowTextureCache.set(key,t);
  return t;
}
function lines(points,color,opacity=.6,dashed=false){
  const g=new THREE.BufferGeometry().setFromPoints(points);
  g.computeBoundingSphere();
  const m=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:3,gapSize:2}):new THREE.LineBasicMaterial({color,transparent:true,opacity});
  const o=new THREE.Line(g,m);if(dashed)o.computeLineDistances();return o;
}
function disposeTree(root){
  root.traverse(obj=>{
    if(obj.geometry?.dispose&&!obj.geometry.userData?.isShared)obj.geometry.dispose();
    const mats=obj.material?Array.isArray(obj.material)?obj.material:[obj.material]:[];
    for(const mat of mats){
      if(!mat.userData?.isShared){
        for(const key of ['map','alphaMap','emissiveMap'])if(mat[key]?.dispose&&!mat[key].userData?.isShared)mat[key].dispose();
        mat.dispose?.();
      }
    }
  });
  root.clear();
}
const sphere = (radius,color,emissive=0x000000) => new THREE.Mesh(new THREE.SphereGeometry(radius,24,16),new THREE.MeshStandardMaterial({color,emissive,roughness:.7,metalness:.12}));
function makeStarsilkShaderMaterial({colorCore,colorBody,colorGlow,opacity=0.5,speed=2.0,pulseFreq=10.0}){
  return new THREE.ShaderMaterial({
    uniforms:{
      uTime:{value:0},
      uColorCore:{value:new THREE.Color(colorCore)},
      uColorBody:{value:new THREE.Color(colorBody)},
      uColorGlow:{value:new THREE.Color(colorGlow)},
      uOpacity:{value:opacity},
      uSpeed:{value:speed},
      uPulseFreq:{value:pulseFreq}
    },
    vertexShader:String.raw`
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
void main(){
vUv=uv;
vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
vViewPosition=-mvPosition.xyz;
vNormal=normalize(normalMatrix*normal);
gl_Position=projectionMatrix*mvPosition;
}
`,
    fragmentShader:String.raw`
uniform float uTime;
uniform vec3 uColorCore;
uniform vec3 uColorBody;
uniform vec3 uColorGlow;
uniform float uOpacity;
uniform float uSpeed;
uniform float uPulseFreq;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
void main(){
float edgeFade=smoothstep(0.0,0.08,vUv.y)*smoothstep(1.0,0.92,vUv.y);
vec3 viewDir=normalize(vViewPosition);
float fresnel=1.0-abs(dot(vNormal,viewDir));
float coreIntensity=pow(1.0-fresnel,2.5);
float flow=vUv.y*32.0-uTime*uSpeed;
float wave=sin(flow)*0.5+0.5;
float pulse=pow(sin(vUv.y*uPulseFreq-uTime*(uSpeed*0.75))*0.5+0.5,6.0);
vec3 col=mix(uColorGlow,uColorBody,fresnel*0.65+wave*0.35);
col=mix(col,uColorCore,coreIntensity*0.85+pulse*0.6);
float alpha=uOpacity*edgeFade*(0.35+0.45*wave+0.45*pulse+0.25*fresnel);
gl_FragColor=vec4(col,alpha);
}
`,
    transparent:true,
    blending:THREE.AdditiveBlending,
    depthWrite:false,
    side:THREE.DoubleSide
  });
}
export class AtlasEngine {
  constructor(canvas,labelsRoot,callbacks){
    this.canvas=canvas;this.labelsRoot=labelsRoot;this.callbacks=callbacks;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x01040b);
    this.scene.fog=new THREE.FogExp2(0x02070d, 0.0012);
    this.camera=new THREE.PerspectiveCamera(44,1,.1,5000);
    this.camera.position.set(0,195,260);
    try{
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    }catch(err){
      throw new Error('WebGL context creation failed: '+(err?.message||err));
    }
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.5;
    this.controls=new OrbitControls(this.camera,canvas);
    this.controls.enableDamping=true;this.controls.dampingFactor=.075;
    this.controls.zoomToCursor=false; // Dolly toward the focused system, not a drifting screen pixel.
    this.controls.minDistance=6;this.controls.maxDistance=950;this.controls.maxPolarAngle=Math.PI*.91;
    this.controls.screenSpacePanning=true;
    this.controls.target.set(6,-2,-6);
    this.group=new THREE.Group();this.scene.add(this.group);
    this.bg=new THREE.Group();this.scene.add(this.bg);
    this.scene.add(new THREE.AmbientLight(0x8db9ec,1.2));
    this.sunLight=new THREE.PointLight(0xffe0b8,24,500);this.scene.add(this.sunLight);
    this.pickables=[];this.labelItems=[];this.motionObjects=[];this.routeParticles=[];this.animatedShaders=[];this.labelNodes=new Map();
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.view={kind:'all',id:null};this.state=null;this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.pointerStart=null;
    this.viewMemory=new Map();
    this.cameraTransition=null;
    this._lastDollyDistance=null;this._dollyIntentUntil=0;this._activeTouchIds=new Set();
    this._wheelZoom=ev=>{if(ev.deltaY<0)this._dollyIntentUntil=performance.now()+650;};
    this._touchZoomStart=ev=>{if(ev.pointerType==='touch')this._activeTouchIds.add(ev.pointerId);};
    this._touchZoomEnd=ev=>{this._activeTouchIds.delete(ev.pointerId);};
    canvas.addEventListener('wheel',this._wheelZoom,{passive:true});
    // Labels are interactive siblings of the canvas. Forward a wheel gesture
    // from a hovered label to OrbitControls without changing selection/dragging.
    this._labelWheel=ev=>{
      if(!ev.target.closest?.('.world-label'))return;
      const forwarded=new WheelEvent('wheel',{
        bubbles:true,cancelable:true,deltaX:ev.deltaX,deltaY:ev.deltaY,
        deltaZ:ev.deltaZ,deltaMode:ev.deltaMode,clientX:ev.clientX,clientY:ev.clientY,
        ctrlKey:ev.ctrlKey,shiftKey:ev.shiftKey,altKey:ev.altKey,metaKey:ev.metaKey
      });
      if(this.canvas.dispatchEvent(forwarded)||forwarded.defaultPrevented)ev.preventDefault();
    };
    this.labelsRoot.addEventListener('wheel',this._labelWheel,{passive:false});
    canvas.addEventListener('pointerdown',this._touchZoomStart);
    canvas.addEventListener('pointerup',this._touchZoomEnd);
    canvas.addEventListener('pointercancel',this._touchZoomEnd);
    this.hoveredId=null;
    this.trackingNodeId=null;
    this.reticle=this.createSelectionReticle();
    this.scene.add(this.reticle);
    this.lastTapTime=0;
    this.lastTapPos={x:0,y:0};
    this.lastPointerType='mouse';
    canvas.addEventListener('pointerdown',this._down=ev=>{
      if(!ev.isPrimary)return;
      this.lastPointerType=ev.pointerType||'mouse';
      this.pointerStart={id:ev.pointerId,x:ev.clientX,y:ev.clientY,type:ev.pointerType||'mouse'};
      this.trackingNodeId=null;
    });
    canvas.addEventListener('pointerup',this._up=ev=>{
      const start=this.pointerStart;this.pointerStart=null;
      if(!start||!ev.isPrimary||start.id!==ev.pointerId)return;
      const threshold=start.type==='pen'?6:(start.type==='touch'?16:8);
      const dist=Math.hypot(ev.clientX-start.x,ev.clientY-start.y);
      if(dist>threshold)return;
      const now=performance.now();
      const timeSinceLast=now-this.lastTapTime;
      const distFromLast=Math.hypot(ev.clientX-this.lastTapPos.x,ev.clientY-this.lastTapPos.y);
      if((start.type==='touch'||start.type==='pen')&&timeSinceLast>50&&timeSinceLast<360&&distFromLast<28){
        this.lastTapTime=0;
        this.pick(ev,true);
        return;
      }
      this.lastTapTime=now;
      this.lastTapPos={x:ev.clientX,y:ev.clientY};
      this.pick(ev,false);
    });
    canvas.addEventListener('pointermove',this._move=ev=>{
      if(this.pointerStart)return;
      const rect=this.canvas.getBoundingClientRect();
      this.pointer.set(((ev.clientX-rect.left)/rect.width)*2-1,1-((ev.clientY-rect.top)/rect.height)*2);
      this.raycaster.setFromCamera(this.pointer,this.camera);
      const hits=this.raycaster.intersectObjects(this.pickables,false);
      const hitId=hits[0]?.object?.userData?.atlasId;
      this.canvas.style.cursor=hitId?'pointer':'';
      this.setHovered(hitId||null);
    });
    canvas.addEventListener('pointerleave',this._leave=()=>{
      this.canvas.style.cursor='';
      this.setHovered(null);
    });
    canvas.addEventListener('pointercancel',this._cancel=()=>{this.pointerStart=null;this.lastTapTime=0;});
    canvas.addEventListener('lostpointercapture',this._cancel);
    canvas.addEventListener('dblclick',this._double=(ev)=>{this.pick(ev,true);});
    this.frame=0;this.last=performance.now();this.elapsed=0;this.paused=false;this.disposed=false;
    this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.frameStats={lastMs:16.6,avgMs:16.6,maxMs:16.6};
    this.frameCadence=new FrameTimingWindow();
    this._onFrameVisibility=()=>{if(document.hidden)this.frameCadence.suspend();};
    document.addEventListener('visibilitychange',this._onFrameVisibility);
    this._sharedPickMat=new THREE.MeshBasicMaterial({visible:false});
    this._sharedPickMat.userData={isShared:true};
    this._sharedPickGeom=new THREE.SphereGeometry(1,10,8);
    this._sharedPickGeom.userData={isShared:true};
    this.initBackground();this.resize();
    this.renderer.setAnimationLoop(t=>this.tick(t));
  }
  createPickTarget(radius,n,group){
    const mesh=new THREE.Mesh(this._sharedPickGeom,this._sharedPickMat);
    mesh.scale.setScalar(radius);
    if(group)group.add(mesh);
    this.hitTarget(n,mesh);
    return mesh;
  }
  setHovered(id){
    if(this.hoveredId===id)return;
    this.hoveredId=id;
    for(const [nodeId,elem] of this.labelNodes){
      elem.classList.toggle('hovered',nodeId===id);
    }
  }
  createSelectionReticle(){
    const group=new THREE.Group();group.name='selection-reticle';group.visible=false;
    const ringMat=new THREE.MeshBasicMaterial({color:0x52deff,side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false});
    const ring=new THREE.Mesh(new THREE.RingGeometry(1,1.09,36),ringMat);
    ring.rotation.x=-Math.PI/2;group.add(ring);
    const tickGeom=new THREE.ConeGeometry(.14,.35,4);
    const tickMat=new THREE.MeshBasicMaterial({color:0x9ef0ff,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false});
    for(let i=0;i<4;i++){
      const angle=(i*Math.PI)/2;
      const tick=new THREE.Mesh(tickGeom,tickMat);
      tick.position.set(Math.cos(angle)*1.35,0,Math.sin(angle)*1.35);
      tick.rotation.y=-angle-Math.PI/2;
      group.add(tick);
    }
    group.userData={ringMat,tickMat};
    return group;
  }
  initBackground(){
    const rnd=rng(1106),p=[],colors=[],sizes=[],alphas=[];
    const warm=new THREE.Color('#ffd29d'),cool=new THREE.Color('#93e6ff'),white=new THREE.Color('#ffffff');
    for(let i=0;i<1300;i++){
      const x=(rnd()-.5)*1450,y=(rnd()-.5)*780,z=(rnd()-.5)*1050;
      if(z < -110)continue;
      if(x > -30 && z < -72)continue; // Strictly starless in Siege Wall devouring void
      p.push(x,y,z);
      const t=rnd();
      const c=t>.85?warm:t<.25?cool:white;
      colors.push(c.r,c.g,c.b);
      sizes.push(.65+Math.pow(rnd(),3)*1.8);
      alphas.push(.3+rnd()*.45);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    g.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
    g.setAttribute('aAlpha',new THREE.Float32BufferAttribute(alphas,1));
    g.computeBoundingSphere();
    const m=new THREE.ShaderMaterial({
      uniforms:{pixelRatio:{value:this.dpr||1}},
      vertexShader: String.raw`
attribute float aSize;
attribute float aAlpha;
attribute vec3 color;
uniform float pixelRatio;
varying vec3 vColor;
varying float vAlpha;
void main(){
vColor=color;vAlpha=aAlpha;
vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
gl_Position=projectionMatrix*mvPosition;
float distanceScale=320.0/max(40.0,-mvPosition.z);
gl_PointSize=clamp(aSize*distanceScale*pixelRatio,1.2,4.5*pixelRatio);
}
`,
      fragmentShader: String.raw`
varying vec3 vColor;
varying float vAlpha;
void main(){
float r=length(gl_PointCoord-.5)*2.0;
if(r>1.0)discard;
float core=exp(-12.0*r*r);
float halo=pow(max(0.0,1.0-r),2.5);
float alpha=(core*.85+halo*.3)*vAlpha;
gl_FragColor=vec4(vColor,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`,
      transparent:true,blending:THREE.AdditiveBlending,
      depthWrite:false
    });
    const pts=new THREE.Points(g,m);
    pts.name='deep-starfield';
    this.bg.add(pts);
    this.starfieldMaterial=m;
  }
  resize(){const el=this.canvas.parentElement;const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);
    const dimensionsChanged=this.width!==w||this.height!==h;this.width=w;this.height=h;
    if(!dimensionsChanged&&this.dpr===Math.min(window.devicePixelRatio||1,this.state?.quality==='cinematic'?2:this.state?.quality==='battery'?1:1.5))return;
    const dpr=Math.min(window.devicePixelRatio||1,this.state?.quality==='cinematic'?2:this.state?.quality==='battery'?1:1.5);
    if(this.dpr!==dpr){this.dpr=dpr;this.renderer.setPixelRatio(dpr);if(this.starfieldMaterial?.uniforms?.pixelRatio)this.starfieldMaterial.uniforms.pixelRatio.value=dpr;}
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
  }
  setState(state,view=this.view){
    this.state=state;this.view=view;
    this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches||(state&&state.motion===false);
    this.resize();this.rebuild();this.camera.updateMatrixWorld();this.updateLabels();
  }
  setView(view,smooth=true){
    const prevKey=this.view.kind==='all'?'all':`${this.view.kind}:${this.view.id}`;
    this.viewMemory.set(prevKey,{camera:this.camera.position.clone(),target:this.controls.target.clone()});
    this.view=view;this._dollyIntentUntil=0;this.rebuild();
    const nextKey=view.kind==='all'?'all':`${view.kind}:${view.id}`;
    let targetCamera,targetControls;
    if(this.viewMemory.has(nextKey)){
      const saved=this.viewMemory.get(nextKey);
      targetCamera=saved.camera;targetControls=saved.target;
    }else{
      const cam=view.kind==='all'?[0,215,280]:view.kind==='galaxy'?[0,55,110]:[0,38,82];
      const tgt=view.kind==='all'?[0,-4,-12]:[0,0,0];
      targetCamera=new THREE.Vector3(...cam);targetControls=new THREE.Vector3(...tgt);
    }
    if(smooth&&!this.reducedMotion){
      this.transitionCamera(targetCamera,targetControls,650,()=>{
        this.camera.updateMatrixWorld();this.updateLabels();this.callbacks.onViewChanged?.(view);
      });
    }else{
      this.controls.target.copy(targetControls);this.camera.position.copy(targetCamera);this.controls.update();
      this.camera.updateMatrixWorld();this.updateLabels();this.callbacks.onViewChanged?.(view);
    }
    this._lastDollyDistance=this.controls.getDistance();
  }
  transitionCamera(targetCam,targetTarget,durationMs=650,onComplete=null){
    if(this.reducedMotion){
      this.controls.target.copy(targetTarget);this.camera.position.copy(targetCam);
      this.controls.update();this.camera.updateMatrixWorld();this.updateLabels();onComplete?.();return;
    }
    this.cameraTransition={
      startTime:performance.now(),duration:Math.max(100,durationMs),
      startCam:this.camera.position.clone(),endCam:targetCam.clone(),
      startTarget:this.controls.target.clone(),endTarget:targetTarget.clone(),
      onComplete
    };
  }
  syncFog(){
    if(!this.state?.epoch||!this.scene?.fog)return;
    const ep=this.state.epoch;
    this.scene.fog.color.setHex(ep==='war'?0x0c0406:ep==='locking'?0x020812:0x010408);
    this.scene.fog.density=ep==='war'?0.0014:ep==='locking'?0.0013:0.0010;
  }
  transitionEra(durationMs=350){
    this.syncFog();
    if(this.reducedMotion||!this.canvas)return;
    this.canvas.style.transition='opacity 0.12s ease-out';
    this.canvas.style.opacity='0.68';
    setTimeout(()=>{
      if(this.canvas){
        this.canvas.style.transition='opacity 0.22s ease-in';
        this.canvas.style.opacity='1';
      }
    },120);
  }
  rebuild(){if(!this.state)return;
    this.syncFog();
    disposeTree(this.group);this.pickables=[];this.labelItems=[];this.motionObjects=[];this.routeParticles=[];this.animatedShaders=[];
    if(this.view.kind==='all')this.buildAll();
    if(this.view.kind==='galaxy')this.buildGalaxy();
    if(this.view.kind==='system')this.buildSystem();
  }
  hidden(id){return isSuppressed(this.state,id);}
  hitTarget(node,obj){obj.userData.atlasId=node.id;this.pickables.push(obj);this.labelItems.push({node,obj});}
  addGlow(parent,size,color,opacity=.9){
    const m=new THREE.SpriteMaterial({map:makeGlow(color),color:0xffffff,blending:THREE.AdditiveBlending,transparent:true,opacity,depthWrite:false});
    const glow=new THREE.Sprite(m);glow.scale.set(size,size,1);parent.add(glow);return glow;
  }
  addRing(parent,radius,color,opacity=.35,tilt=.2){
    const g=new THREE.RingGeometry(radius,radius+.16,120);
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});
    const mesh=new THREE.Mesh(g,m);mesh.rotation.x=-Math.PI/2+tilt;parent.add(mesh);return mesh;
  }
  addStarburst(parent,size,color='#ffffff',opacity=.75){
    const geom=points=>new THREE.BufferGeometry().setFromPoints(points.map(([x,z])=>new THREE.Vector3(x*size,0,z*size)));
    const material=new THREE.LineBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
    const starburst=new THREE.LineSegments(geom([[-1,0],[1,0],[0,-1],[0,1]]),material);
    parent.add(starburst,new THREE.Line(geom([[0,.35],[.12,0],[0,-.35],[-.12,0],[0,.35]]),material));
    return starburst;
  }
  /**
   * Stylized volumetric galaxy: the cloudy spiral disc is a single transparent
   * mesh, and its luminous stars live in one GPU particle batch. This is
   * editorial cartography, never a real astrometric reconstruction.
   */
  makeDropStem(parent,pos,gridY=-22,color=0x2f6485,size=1.0,isReference=false){
    const [x,y,z]=pos;
    if(Math.abs(y-gridY)<1.2)return;
    const pts=[new THREE.Vector3(x,y,z),new THREE.Vector3(x,gridY,z)];
    const stem=lines(pts,isReference?0x6bbfe8:color,isReference?.45:.28,true);
    parent.add(stem);
    const ringRadius=Math.max(1.0,size*1.6);
    const ringGeom=new THREE.RingGeometry(ringRadius,ringRadius+.16,24);
    ringGeom.rotateX(-Math.PI/2);
    const ringMat=new THREE.MeshBasicMaterial({
      color:isReference?0x6bbfe8:color,
      transparent:true,
      opacity:isReference?.4:.22,
      side:THREE.DoubleSide,
      depthWrite:false
    });
    const ringMesh=new THREE.Mesh(ringGeom,ringMat);
    ringMesh.position.set(x,gridY+.05,z);
    parent.add(ringMesh);
  }
  galaxyDisk(parent,seed,rad,color,morphology=null){
    const arms = morphology ? morphology.arms : 4.0;
    const pitch = morphology ? morphology.pitch : 14.0;
    const bar = morphology ? morphology.barStrength : 0.0;
    const mat=new THREE.ShaderMaterial({
      uniforms:{
        tint:{value:new THREE.Color(color)},
        phase:{value:(hash(seed)%628)/100},
        arms:{value:arms},
        pitch:{value:pitch},
        bar:{value:bar},
      },
      vertexShader: String.raw`
varying vec2 vUv;
void main(){
vUv=uv;
gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}
`,
      fragmentShader: String.raw`
uniform vec3 tint;
uniform float phase;
uniform float arms;
uniform float pitch;
uniform float bar;
varying vec2 vUv;
float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
vec2 q=(vUv-.5)*2.0;
float radius=length(q);
if(radius>1.0)discard;
float angle=atan(q.y,q.x);
float spiral=pow(max(.0,cos(arms*angle-pitch*radius+phase)*.5+.5),4.5);
if(bar > 0.0){
float barDist=abs(q.y)+max(0.0,abs(q.x)- 0.45);
float barGlow=exp(-barDist*barDist*32.0)*bar;
spiral=mix(spiral,1.0,clamp(barGlow,0.0,1.0));
}
float radial=1.0-smoothstep(.32,1.0,radius);
float cloud=noise(floor(q*130.0))+noise(floor(q*48.0))*.45;
float dust=radial*(.17+.78*spiral)*(.52+.42*cloud);
float inner=exp(-radius*radius*23.0);
float blue=exp(-radius*radius*3.0)*.075;
vec3 innerColor=vec3(1.0,.75,.47);
vec3 color=mix(tint,innerColor,clamp(inner*1.9,0.0,1.0));
float alpha=min(.76,dust+inner*.38+blue);
gl_FragColor=vec4(color,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`,
      transparent:true,blending:THREE.AdditiveBlending,
      depthWrite:false,side:THREE.DoubleSide
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(rad*2.18,rad*2.18),mat);
    mesh.rotation.x=-Math.PI/2;
    mesh.position.y=-.4;
    parent.add(mesh);
    const mesh2=new THREE.Mesh(new THREE.PlaneGeometry(rad*2.05,rad*2.05),mat.clone());
    mesh2.material.uniforms.phase.value=((hash(seed+'haze')%628)/100);
    mesh2.rotation.x=-Math.PI/2+.08;
    mesh2.position.y=.35;
    parent.add(mesh2);
  }
  starCloud(parent,seed,count,rad,flatten=.22,spiral=true,arms=4){
    if(!this.state.layers.stars)return;
    const rnd=rng(hash(seed)),p=[],col=[],sizes=[],intensities=[];
    const armCount = Math.max(1, arms);
    const style=['perseus','centauri','ember','halcyon'].find(x=>String(seed).includes(x));
    const color=new THREE.Color();
    for(let i=0;i<count;i++){
      const r=Math.pow(rnd(),.8)*rad;
      const arm=(i%armCount)*(Math.PI*2/armCount);
      const a=spiral?arm+(r/rad)*Math.PI*2.25+(rnd()-.5)*.95:rnd()*Math.PI*2;
      const jitter=Math.max(.22,rad*.045);
      const x=Math.cos(a)*r+(rnd()-.5)*jitter;
      const z=Math.sin(a)*r+(rnd()-.5)*jitter;
      const y=(rnd()-.5)*rad*flatten*(1-r/rad*.75);
      p.push(x,y,z);
      const temperature=rnd();
      if(style==='perseus')color.set(r/rad<.35?'#fff3d6':temperature>.4?'#fde047':'#93c5fd');
      else if(style==='centauri')color.set(temperature>.5?'#c084fc':temperature>.2?'#fde047':'#93c5fd');
      else if(style==='ember')color.set(temperature>.35?'#fb923c':temperature>.1?'#f59e0b':'#fed7aa');
      else if(style==='halcyon')color.set(temperature>.25?'#38bdf8':'#e0f2fe');
      else color.set(r/rad<.23||temperature>.90?'#ffd9a8':temperature<.09?'#c9b8ff':'#63cbfa');
      color.multiplyScalar(.75+rnd()*.5);
      col.push(color.r,color.g,color.b);
      sizes.push(.75+Math.pow(rnd(),4)*1.85);
      intensities.push((r/rad<.25?.78:.54)+rnd()*.32);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    g.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
    g.setAttribute('aLight',new THREE.Float32BufferAttribute(intensities,1));
    g.computeBoundingSphere();
    const m=new THREE.ShaderMaterial({
      uniforms:{pixelRatio:{value:this.dpr||1}},
      vertexShader: String.raw`
attribute float aSize;
attribute float aLight;
attribute vec3 color;
uniform float pixelRatio;
varying vec3 vColor;
varying float vLight;
void main(){
vColor=color;vLight=aLight;
vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
gl_Position=projectionMatrix*mvPosition;
float distanceScale=220.0/max(32.0,-mvPosition.z);
gl_PointSize=clamp(aSize*distanceScale*pixelRatio,1.0,3.8*pixelRatio);
}
`,
      fragmentShader: String.raw`
varying vec3 vColor;
varying float vLight;
void main(){
float r=length(gl_PointCoord-.5)*2.0;
if(r>1.0)discard;
float core=exp(-20.0*r*r);
float halo=pow(1.0-r,3.0);
float alpha=(core*.78+halo*.22)*vLight;
gl_FragColor=vec4(vColor*1.1,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`,
      transparent:true,blending:THREE.AdditiveBlending,
      depthWrite:false
    });
    const pts=new THREE.Points(g,m);
    pts.rotation.y=rnd()*Math.PI;
    parent.add(pts);
    this.motionObjects.push({obj:pts,speed:.000006+rnd()*.000003});
  }
  buildAll(){const s=this.state;
    this.controls.minDistance=45;this.controls.maxDistance=900;
    if(s.layers.territories)this.makeTerritories();
    if(s.layers.grid)this.makeGrid(360,24);
    if(s.layers.wall&&s.epoch!=='war')this.makeWall();
    if(s.layers.galaxies){
      if(!this.hidden('nebula:bed'))this.makeContinentalNebula();
      for(const n of childNodes(s,null,'galaxy')){
        const group=new THREE.Group();group.position.copy(V(n.position));
        const tiltX=((hash(n.id)%19)-9)*.012,tiltZ=((hash(n.id+'z')%19)-9)*.012;
        group.rotation.set(tiltX,0,tiltZ);
        this.group.add(group);
        if(s.layers.grid)this.makeDropStem(this.group,n.position,-22,0x2f6485,n.size,n.status==='reference');
        const level=s.quality==='cinematic'?2000:s.quality==='battery'?420:1150;
        const morph=getGalaxyMorphology(n);
        this.galaxyDisk(group,n.id,n.size*22,n.color,morph);
        this.starCloud(group,n.id,Math.floor(level*n.size),n.size*20,.18,true,morph?morph.arms:4);

        const bulgeGeom=new THREE.SphereGeometry(2.4*n.size,16,12);
        bulgeGeom.scale(1.0,0.42,1.0);
        const bulgeMat=new THREE.MeshBasicMaterial({color:0xffedd5,transparent:true,opacity:0.32,blending:THREE.AdditiveBlending,depthWrite:false});
        group.add(new THREE.Mesh(bulgeGeom,bulgeMat));

        this.addGlow(group,37*n.size,n.color,.44);
        this.addGlow(group,7.5*n.size,'#fff0c9',.7);
        if(!this.hidden('galaxy:ornaments')&&!this.hidden('galaxy:ornament:'+n.id)){
        for(const [kind,size,color,opacity,tilt] of ORNAMENTS[n.id]||[])
          this['add'+kind](group,size*n.size,color||n.color,opacity,tilt);
        this.addRing(group,12*n.size,n.color,.20,.24);
        }
        this.createPickTarget(13*n.size,n,group);
        if(morph){
          const targetItem=this.labelItems[this.labelItems.length-1];
          if(targetItem)targetItem.subtitle=morph.badge;
        }
      }
    }
    if(s.layers.routes||s.layers.starsilk)this.makeRoutes();
    if(s.layers.worldsvault){
      for(const n of childNodes(s,null).filter(n=>n.kind==='landmark')){
        const group=new THREE.Group();group.position.copy(V(n.position));this.group.add(group);
        if(s.layers.grid)this.makeDropStem(this.group,n.position,-22,0x6bbfe8,n.size,true);
        const crystal=new THREE.Mesh(new THREE.IcosahedronGeometry(4*n.size,1),new THREE.MeshStandardMaterial({color:n.color,wireframe:true,transparent:true,opacity:.75,emissive:n.color,emissiveIntensity:1.25}));group.add(crystal);
        this.addGlow(group,13,n.color,.6);this.addRing(group,7,n.color,.55);
        this.addStarburst(group,10*n.size,'#e0f2fe',.85);
        this.addRing(group,9*n.size,'#38bdf8',.3,0);
        this.createPickTarget(7,n,group);
      }
    }
    if(s.layers.rings&&s.epoch!=='post')this.makeRemnantRings();
    if(s.layers.annotations)this.makeAnnotations(null);
  }
  makeContinentalNebula(){
    const s=this.state;
    const count=s.quality==='cinematic'?2200:s.quality==='battery'?550:1300;
    const rnd=rng(909);
    const p=[];const colors=[];const sizes=[];const alphas=[];
    const dustColor=new THREE.Color(),azureDust=new THREE.Color('#38bdf8');
    const spine=[
      [-108,6,-12,'#0284c7',34],
      [-96,-10,42,'#0ea5e9',30],
      [-52,22,-58,'#83bcff',26],
      [-26,2,8,'#d97706',44],
      [12,-3,14,'#38bdf8',34],
      [44,3,20,'#8b5cf6',38],
      [78,-2,10,'#0ea5e9',32],
      [102,7,-8,'#f59e0b',34],
      [128,-14,52,'#0284c7',32],
    ];
    for(let i=0;i<count;i++){
      const hub=spine[Math.floor(rnd()*spine.length)];
      const rad=hub[4]*(0.2+rnd()*0.9);
      const angle=rnd()*Math.PI*2;
      const x=hub[0]+Math.cos(angle)*rad+(rnd()-.5)*12;
      const y=hub[1]+(rnd()-.5)*10*0.35;
      const z=hub[2]+Math.sin(angle)*rad*0.75+(rnd()-.5)*12;
      if(x>-24&&z<-66)continue;
      if(x<-68&&x>-92&&z<-24&&z>-50)continue;
      p.push(x,y,z);
      const baseCol=dustColor.set(hub[3]);
      if(rnd()>.65)baseCol.lerp(azureDust,.5);
      colors.push(baseCol.r,baseCol.g,baseCol.b);
      sizes.push(4.5+rnd()*12.0);
      alphas.push(0.035+rnd()*0.075);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    g.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
    g.setAttribute('aAlpha',new THREE.Float32BufferAttribute(alphas,1));
    g.computeBoundingSphere();
    const m=new THREE.ShaderMaterial({
      uniforms:{pixelRatio:{value:this.dpr||1}},
      vertexShader:String.raw`
attribute float aSize;
attribute float aAlpha;
attribute vec3 color;
uniform float pixelRatio;
varying vec3 vColor;
varying float vAlpha;
void main(){
vColor=color;vAlpha=aAlpha;
vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
gl_Position=projectionMatrix*mvPosition;
float distanceScale=320.0/max(40.0,-mvPosition.z);
gl_PointSize=clamp(aSize*distanceScale*pixelRatio,2.0,30.0*pixelRatio);
}
`,
      fragmentShader:String.raw`
varying vec3 vColor;
varying float vAlpha;
void main(){
float r=length(gl_PointCoord-.5)*2.0;
if(r>1.0)discard;
float halo=pow(max(0.0,1.0-r),2.0);
gl_FragColor=vec4(vColor,halo*vAlpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}
`,
      transparent:true,blending:THREE.AdditiveBlending,
      depthWrite:false
    });
    const dust=new THREE.Points(g,m);
    dust.name='continental-nebula-bed';
    this.group.add(dust);
  }
  makeGrid(size=360,step=24){
    const halfX=180,halfZ=110;
    const gridY=-22;
    for(let x=-halfX;x<=halfX;x+=step){
      this.group.add(lines([new THREE.Vector3(x,gridY,-halfZ),new THREE.Vector3(x,gridY,halfZ)],0x1c445c,.16));
    }
    for(let z=-halfZ;z<=halfZ;z+=step){
      this.group.add(lines([new THREE.Vector3(-halfX,gridY,z),new THREE.Vector3(halfX,gridY,z)],0x1c445c,.16));
    }
    this.makeRimDropStems(gridY);
  }
  makeRimDropStems(gridY=-22){
    const rimPoints = [
      [-128,4,-10],[-118,-4,18],[-104,-12,48],[-72,-10,58],[-36,-8,64],
      [4,-6,62],[42,-5,58],[82,-8,62],[118,-12,56],[142,-15,48],
    ];
    for(const [x,y,z] of rimPoints){
      const pts=[new THREE.Vector3(x,y,z),new THREE.Vector3(x,gridY,z)];
      this.group.add(lines(pts,0x245878,0.28,true));
    }
  }
  makeTerritories(){
    const sites=childNodes(this.state,null,'galaxy');
    const cells=provisionalSurveyCells(sites);
    const layer=new THREE.Group();layer.name='provisional-survey-cells';
    layer.userData={source:'illustrative-proximity',cellCount:cells?.length||0};
    this.group.add(layer);
    if(cells){
      const byId=new Map(sites.map(n=>[n.id,n]));
      for(const cell of cells){
        const color=byId.get(cell.id).color,shape=new THREE.Shape();
        shape.moveTo(cell.points[0][0],-cell.points[0][1]);
        for(const [x,z] of cell.points.slice(1))shape.lineTo(x,-z);
        shape.closePath();
        const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
        const fill=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({
          color,side:THREE.DoubleSide,transparent:true,opacity:.065,depthWrite:false
        }));
        fill.position.y=-15;fill.userData={source:'illustrative-proximity',siteId:cell.id};
        layer.add(fill);
        const edge=cell.points.map(([x,z])=>new THREE.Vector3(x,-14.7,z));
        edge.push(edge[0].clone());
        const border=lines(edge,color,.32,true);border.material.depthWrite=false;
        border.userData={source:'illustrative-proximity',siteId:cell.id};
        layer.add(border);
      }
      return;
    }
    // Ambiguous/oversized galaxy collections retain the former bounded halos,
    // never a partial or invented subset of proximity cells.
    for(const n of sites){
      const group=new THREE.Group();group.position.copy(V(n.position));layer.add(group);
      const g=new THREE.CircleGeometry(19*n.size,64);
      const material=new THREE.MeshBasicMaterial({color:n.color,side:THREE.DoubleSide,transparent:true,opacity:.065,depthWrite:false});
      const sheet=new THREE.Mesh(g,material);sheet.rotation.x=-Math.PI/2;sheet.position.y=-15;group.add(sheet);
      const pts=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;const r=(19+2*Math.sin(a*5+hash(n.id)%5))*n.size;pts.push(new THREE.Vector3(Math.cos(a)*r,-14.5,Math.sin(a)*r));}
      group.add(lines(pts,n.color,.3,true));
    }
  }
  makeWall(){
    const coords=[
      [-25,-68],[-2,-72],[22,-76],[48,-82],[78,-88],[112,-94],[148,-100],[186,-105],[230,-108],[275,-112]
    ];
    const rimPts=[];
    const rnd=rng(707);
    for(let i=0;i<coords.length;i++){
      const [x,z]=coords[i];
      const py=4+Math.sin(i*1.1)*5+rnd()*2;
      rimPts.push(new THREE.Vector3(x,py,z));
    }
    this.group.add(lines(rimPts,0x7397b3,0.72));

    for(let i=0;i<coords.length;i++){
      const p=rimPts[i];
      this.group.add(lines([p,new THREE.Vector3(p.x,-32,p.z)],0x16344d,0.38,true));
    }

    const shape=new THREE.Shape();
    shape.moveTo(-35,-320);
    shape.lineTo(320,-320);
    shape.lineTo(320,-115);
    for(let i=coords.length-1;i>=0;i--){
      shape.lineTo(coords[i][0],coords[i][1]);
    }
    shape.lineTo(-35,-68);
    shape.closePath();
    const geom=new THREE.ShapeGeometry(shape);
    geom.rotateX(-Math.PI/2);
    geom.computeBoundingSphere();
    const blackMat=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide,depthWrite:true});
    const mesh=new THREE.Mesh(geom,blackMat);
    mesh.position.y=-12;
    this.group.add(mesh);

    const curtainGeom=new THREE.PlaneGeometry(380,120);
    curtainGeom.rotateY(-0.15);
    curtainGeom.computeBoundingSphere();
    const curtain=new THREE.Mesh(curtainGeom,blackMat);
    curtain.position.set(130,15,-165);
    this.group.add(curtain);

    const debris=[];
    const latticeNodes=[];
    for(let i=0;i<220;i++){
      const seg=rnd()*(coords.length-1);
      const k=Math.floor(seg);
      const a=coords[k],b=coords[Math.min(k+1,coords.length-1)],t=seg-k;
      const x=a[0]+(b[0]-a[0])*t+(rnd()-.5)*12;
      const py=rnd()*16-6;
      const z=a[1]+(b[1]-a[1])*t+(rnd()-.5)*10;
      debris.push(x,py,z);
      if(i%2===0){
        latticeNodes.push(x+(rnd()-.5)*4,py+(rnd()-.5)*6,z+(rnd()-.5)*4);
      }
    }
    if(!this.hidden('wall:debris')){
      const p=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(debris,3));
      p.computeBoundingSphere();
      this.group.add(new THREE.Points(p,new THREE.PointsMaterial({color:0x475569,size:0.75,transparent:true,opacity:0.75})));
    }
    if(!this.hidden('wall:lattice')){
      const lp=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(latticeNodes,3));
      lp.computeBoundingSphere();
      this.group.add(new THREE.Points(lp,new THREE.PointsMaterial({color:0x38bdf8,size:0.85,transparent:true,opacity:0.65})));
    }

    const wallLabel={id:'wall-concept',name:'THE SIEGE WALL',status:'reference',label:{show:true,size:19,color:'#d1d6de',family:'display'}};
    const o=new THREE.Object3D();
    o.position.set(55,16,-92);
    this.group.add(o);
    this.labelItems.push({node:wallLabel,obj:o,subtitle:'BLACK-HOLE LATTICE / ABSENCE'});
  }
  makeRoutes(parentId=null){
    const selectedId=this.state.selected;
    for(const r of this.state.routes){
      if((r.kind==='starsilk'&&!this.state.layers.starsilk)||(r.kind==='hookshot'&&!this.state.layers.routes))continue;
      const a=nodeById(this.state,r.from),b=nodeById(this.state,r.to);if(!a||!b||a.parentId!==parentId||b.parentId!==parentId)continue;
      const p=V(a.position),q=V(b.position),m=p.clone().add(q).multiplyScalar(.5);m.y+=9;
      const c=new THREE.QuadraticBezierCurve3(p,m,q);
      const samples=c.getPoints(48);
      const azure=r.kind==='starsilk';
      const isIncident=selectedId&&(r.from===selectedId||r.to===selectedId||r.id===selectedId);

      // Loop 47: Dynamic route highlighting for selected corridors
      const lineColor=isIncident?0xfff3c4:(azure?0x60ebff:0x7dd3fc);
      const lineOpacity=isIncident?0.95:(azure?0.85:0.42);
      this.group.add(lines(samples,lineColor,lineOpacity,!azure));

      // Loop 48: Luminous tube halo separating Starsilk from Hookshot corridors
      const haloRadius=azure?(isIncident?0.55:0.35):(isIncident?0.42:0.22);
      const haloColor=isIncident?0xf59e0b:(azure?0x0ea5e9:0x0284c7);
      const haloOpacity=isIncident?0.45:(azure?0.25:0.14);
      if(!this.hidden('routes:halos'))this.group.add(new THREE.Mesh(new THREE.TubeGeometry(c,54,haloRadius,5,false),new THREE.MeshBasicMaterial({color:haloColor,transparent:true,opacity:haloOpacity,blending:THREE.AdditiveBlending,depthWrite:false})));

      if(azure||isIncident){
        const particleCount=isIncident?6:4;
        for(let i=0;i<particleCount;i++){
          const particle=this.addGlow(this.group,isIncident?3.8:3.0,isIncident?'#fde047':'#78f0ff',.75);
          this.routeParticles.push({obj:particle,curve:c,phase:i/particleCount,speed:isIncident?.07:.045});
        }
      }
    }
    if(parentId===null&&this.state.layers.routes&&!this.hidden('network:all')){
      this.makeSecondaryNetwork();
    }
    if(parentId===null&&this.state.layers.starsilk){
      this.makeStarsilkFlow();
    }
  }
  makeSecondaryNetwork(){
    // Loop 41-44: Multi-tier organic geometric triangulation network matching Reference 01 & 03
    const s=this.state;
    const galaxies=childNodes(s,null,'galaxy');
    const galWorldMap=new Map();
    const radialSegments=[],perimeterSegments=[],bridgeSegments=[];

    for(const g of galaxies){
      const gPos=V(g.position);
      const systems=childNodes(s,g.id,'system');
      const sysPositions=[];

      for(let i=0;i<systems.length;i++){
        const sys=systems[i];
        const worldPos=gPos.clone().add(V(sys.position));
        sysPositions.push({sys,worldPos});
        if(this.hidden('network:system:'+sys.id))continue;

        // Loop 43: Radial secondary corridor from galaxy core to child system
        radialSegments.push(gPos,worldPos);

        // Loop 44: Hookshot node beads and major-system concentric navigation rings
        const isMajor=i===0||i===2;
        if(!this.hidden('network:beads')){
        const bead=sphere(isMajor?0.55:0.38,0xffffff,0x38bdf8);
        bead.position.copy(worldPos);
        this.group.add(bead);

        if(isMajor){
          const ringGeom=new THREE.RingGeometry(1.4,1.8,24);
          const ringMat=new THREE.MeshBasicMaterial({color:0x38bdf8,transparent:true,opacity:0.35,side:THREE.DoubleSide});
          const ring=new THREE.Mesh(ringGeom,ringMat);
          ring.position.copy(worldPos);
          ring.rotation.x=Math.PI*0.5;
          this.group.add(ring);
          this.motionObjects.push({obj:ring,speed:0.0003});
        }
        }
      }

      // Intra-galaxy perimeter triangulation loop
      for(let i=0;i<sysPositions.length;i++){
        const next=(i+1)%sysPositions.length;
        if(this.hidden('network:system:'+sysPositions[i].sys.id)||this.hidden('network:system:'+sysPositions[next].sys.id))continue;
        perimeterSegments.push(sysPositions[i].worldPos,sysPositions[next].worldPos);
      }

      galWorldMap.set(g.id,sysPositions);
    }

    // Static topology is now three batched submissions, not one mesh per edge.
    const radialBatch=dashedLineBatch(radialSegments,0x38bdf8,0.25);
    const perimeterBatch=dashedLineBatch(perimeterSegments,0x0284c7,0.18);
    if(radialBatch)this.group.add(radialBatch);
    if(perimeterBatch)this.group.add(perimeterBatch);

    // Inter-galaxy secondary exploratory bridging links
    if(this.hidden('network:bridges'))return;

    for(const [gA,gB,idxA,idxB] of BRIDGES){
      const listA=galWorldMap.get(gA);
      const listB=galWorldMap.get(gB);
      if(!listA||!listB||!listA[idxA]||!listB[idxB])continue;
      if(this.hidden('network:bridge:'+gA+':'+gB)||this.hidden('network:system:'+listA[idxA].sys.id)||this.hidden('network:system:'+listB[idxB].sys.id))continue;

      const pA=listA[idxA].worldPos;
      const pB=listB[idxB].worldPos;
      bridgeSegments.push(pA,pB);

      if(!this.hidden('network:beads')){
        const mid=pA.clone().add(pB).multiplyScalar(0.5);
        const midBead=sphere(0.35,0xffffff,0x60ebff);
        midBead.position.copy(mid);
        this.group.add(midBead);
      }
    }
    const bridgeBatch=dashedLineBatch(bridgeSegments,0x0ea5e9,0.22);
    if(bridgeBatch)this.group.add(bridgeBatch);
  }
  makeStarsilkFlow(){
    const ep=this.state.epoch;
    const isWar=ep==='war';
    const isLocking=ep==='locking';

    // Invariant-respecting chromatic palette
    const colorCore=isWar?0xfffbeb:0xf0fdf4;
    const colorBody=isWar?0xf59e0b:(isLocking?0x06b6d4:0x38bdf8);
    const colorGlow=isWar?0x991b1b:(isLocking?0x0369a1:0x0284c7);

    // Loop 31: Sinuous horizontal spline trajectory across lower-middle archipelago matching References 01–03
    const masterControlPoints=[
      new THREE.Vector3(-192,-12,58),
      new THREE.Vector3(-145,-10,72),
      new THREE.Vector3(-102,-13,84),
      new THREE.Vector3(-55,-15,92),
      new THREE.Vector3(-12,-10,86),
      new THREE.Vector3(32,-8,76),
      new THREE.Vector3(75,-12,82),
      new THREE.Vector3(116,-14,80),
      new THREE.Vector3(155,-11,68),
      new THREE.Vector3(192,-8,52)
    ];
    const masterCurve=new THREE.CatmullRomCurve3(masterControlPoints);

    // Loop 32: Multi-strand braided ribbon geometry with differentiated strand thicknesses and twists
    const SAMPLES=180;
    const points=[[],[],[],[]];
    const up=new THREE.Vector3(0,1,0);
    for(let i=0;i<=SAMPLES;i++){
      const t=i/SAMPLES;
      const p=masterCurve.getPointAt(t);
      const tangent=masterCurve.getTangentAt(t);
      const binormal=new THREE.Vector3().crossVectors(tangent,up).normalize();
      const norm=new THREE.Vector3().crossVectors(binormal,tangent).normalize();

      const widths=[
        Math.sin(t*16)*1.6,
        Math.sin(t*16+Math.PI)*2.2,
        Math.sin(t*32+1.2)*1.4,
        Math.sin(t*10-.5)*3.2+Math.cos(t*26)*.9
      ];
      const heights=[
        Math.cos(t*12)*.8,
        Math.cos(t*16+Math.PI)*1.1,
        Math.sin(t*24)*1.2,
        Math.sin(t*18+.8)*1.4
      ];
      for(let j=0;j<4;j++)points[j].push(p.clone().addScaledVector(binormal,widths[j]).addScaledVector(norm,heights[j]));
    }

    const curves=points.map(pts=>new THREE.CatmullRomCurve3(pts));

    if(!this.hidden('flow:veil')){
      const mat=makeStarsilkShaderMaterial({colorCore,colorBody,colorGlow,opacity:0.16,speed:1.2,pulseFreq:6.0});
      this.animatedShaders.push(mat);
      this.group.add(new THREE.Mesh(new THREE.TubeGeometry(masterCurve,160,3.2,8,false),mat));
    }
    const strands=[
      [.85,7,.65,2.2,12,0xe0f2fe,0xfde68a,.85],
      [.58,6,.48,2.5,14,0x7dd3fc,0xf59e0b,.72],
      [.38,5,.38,2.8,16,0x38bdf8,0xd97706,.60],
      [0,0,0,0,0,0x0284c7,0xb45309,.48]
    ];
    for(let i=0;i<curves.length;i++){
      const [radius,sides,opacity,speed,pulseFreq,azure,amber,lineOpacity]=strands[i];
      if(i<3){
        const mat=makeStarsilkShaderMaterial({colorCore,colorBody,colorGlow,opacity,speed,pulseFreq});
        this.animatedShaders.push(mat);
        this.group.add(new THREE.Mesh(new THREE.TubeGeometry(curves[i],160,radius,sides,false),mat));
      }
      this.group.add(lines(curves[i].getPoints(160),isWar?amber:azure,lineOpacity));
    }

    // Loop 34: Embedded flow nodes at harmonic intersection points
    const nodeIntervals=[0.12,0.26,0.39,0.52,0.65,0.78,0.90];
    for(let k=0;k<nodeIntervals.length;k++){
      if(this.hidden('flow:nodes')||this.hidden('flow:node:'+k))continue;
      const pos=masterCurve.getPointAt(nodeIntervals[k]);
      const nodeGroup=new THREE.Group();
      nodeGroup.position.copy(pos);
      this.group.add(nodeGroup);

      const coreDot=sphere(0.65,0xffffff,colorBody);
      const ringGeom=new THREE.RingGeometry(1.6,2.1,32);
      const ringMat=new THREE.MeshBasicMaterial({color:colorBody,transparent:true,opacity:0.55,side:THREE.DoubleSide});
      const navRing=new THREE.Mesh(ringGeom,ringMat);
      navRing.rotation.x=Math.PI*0.5;
      nodeGroup.add(coreDot,navRing);

      this.motionObjects.push({obj:navRing,speed:0.00035});
    }

    // Traveling energy pulse particles
    for(let c=0;c<curves.length;c++){
      const count=c<2?8:6;
      const targetCurve=curves[c];
      for(let p=0;p<count;p++){
        if(this.hidden('flow:pulses')||this.hidden('flow:pulse:'+c+':'+p))continue;
        const particle=this.addGlow(this.group,p%3?2.8:4.8,isWar?'#fbbf24':'#38bdf8',0.75);
        this.routeParticles.push({
          obj:particle,
          curve:targetCurve,
          phase:p/count+(c*0.12),
          speed:0.038+(c*0.008)
        });
      }
    }

    // Loop 36: Ambient blue glow reflection onto nearby dust clouds and archipelago underbelly
    const reflectionPoints=[
      new THREE.Vector3(-45,-18,88),
      new THREE.Vector3(40,-16,78),
      new THREE.Vector3(120,-18,76)
    ];
    for(const rPos of reflectionPoints){
      const light=new THREE.PointLight(isWar?0xd97706:0x0284c7,2.8,55,2);
      light.position.copy(rPos);
      this.group.add(light);
    }

    // Reference 01 Typography label
    const flowLabel={id:'starsilk-flow-master',name:'STARSILK FLOW',status:'reference',label:{show:true,size:10,color:isWar?'#fcd34d':'#7dd3fc',family:'mono'}};
    const flowObj=new THREE.Object3D();
    flowObj.position.set(-25,-10,88);
    this.group.add(flowObj);
    this.labelItems.push({node:flowLabel,obj:flowObj,subtitle:'THE LIVING WEAVE / SUBSTRATE'});
  }
  makeRemnantRings(){
    const pos=[[-70,-12,48],[63,5,49]];
    for(const [x,y,z] of pos){
      const g=new THREE.Group();g.position.set(x,y,z);this.group.add(g);
      const outerRing=new THREE.Mesh(new THREE.RingGeometry(4.2,5.5,64),new THREE.MeshBasicMaterial({color:0xb91c1c,side:THREE.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));
      outerRing.rotation.x=0.48;
      const core=new THREE.Mesh(new THREE.SphereGeometry(0.75,16,16),new THREE.MeshStandardMaterial({color:0x3b070c,emissive:0x7f1d1d,roughness:.8}));
      const dustRing=new THREE.Mesh(new THREE.RingGeometry(6.0,6.3,48),new THREE.MeshBasicMaterial({color:0xef4444,side:THREE.DoubleSide,transparent:true,opacity:.28,depthWrite:false}));
      dustRing.rotation.x=0.48;
      g.add(outerRing,core,dustRing);
      this.motionObjects.push({obj:g,speed:0.00028});
      const ringLabel={id:'remnant-'+x,name:'BLOOD RING REMNANT',status:'reference',label:{show:true,size:10,color:'#fca5a5',family:'mono'}};
      this.labelItems.push({node:ringLabel,obj:g,subtitle:'YEAR 3 WAR DEBRIS'});
    }
  }
  makeAnnotations(parentId){for(const n of childNodes(this.state,parentId,'annotation')){
    const g=new THREE.Group();g.position.copy(V(n.position));this.group.add(g);
    const o=new THREE.Mesh(new THREE.OctahedronGeometry(1.8),new THREE.MeshBasicMaterial({color:n.color,wireframe:true}));g.add(o);this.hitTarget(n,o);
  }}
  buildGalaxy(){const s=this.state,g=nodeById(s,this.view.id);if(!g)return;
    this.controls.minDistance=12;this.controls.maxDistance=350;
    const morph=getGalaxyMorphology(g);
    this.galaxyDisk(this.group,g.id+'-interior',68,g.color,morph);
    this.starCloud(this.group,g.id+'-interior',s.quality==='cinematic'?8500:s.quality==='battery'?1300:4100,70,.23,true,morph?morph.arms:4);
    this.addGlow(this.group,37,'#fbe6cc',.38);
    this.addGlow(this.group,12,g.color,.7);
    if(s.layers.grid)this.makeGrid(190,12);
    for(const n of childNodes(s,g.id,'system')){
      const pg=new THREE.Group();pg.position.copy(V(n.position));this.group.add(pg);
      if(s.layers.grid)this.makeDropStem(this.group,n.position,-19,0x3d7499,1.0,n.status==='reference');
      this.addGlow(pg,15,n.color,.8);
      const core=sphere(.9,0xffffff,0x4488ff);pg.add(core);
      this.createPickTarget(3.5,n,pg);
      if(s.layers.routes){this.addRing(pg,3.8,n.color,.42);}
    }
    if(s.layers.routes||s.layers.starsilk)this.makeRoutes(g.id);
    if(s.layers.annotations)this.makeAnnotations(g.id);
  }
  buildSystem(){const s=this.state,sys=nodeById(s,this.view.id);if(!sys)return;
    this.controls.minDistance=5;this.controls.maxDistance=280;this.sunLight.position.set(0,0,0);
    const starInfo=getStarClassification(sys);
    const center=new THREE.Group();this.group.add(center);
    const sunColor=starInfo.isBlue?0xa5f3fc:0xffdfae;
    const sunEmissive=starInfo.isBlue?0x38bdf8:0xffb45c;
    const sun=sphere(3.6,sunColor,sunEmissive);center.add(sun);
    this.addGlow(center,26,starInfo.coronaColor,.75);
    this.addGlow(center,12,'#fff0cc',.9);
    this.addRing(center,4.4,starInfo.coronaColor,.38,0);
    this.addRing(center,5.4,starInfo.coronaColor,.22,Math.PI/6);
    this.createPickTarget(4.2,sys,center);
    if(this.labelItems.length)this.labelItems[this.labelItems.length-1].subtitle=starInfo.spectralType;

    if(s.layers.grid)this.makeGrid(120,8);
    const planets=childNodes(s,sys.id,'planet');
    if((s.layers.routes||s.layers.grid)&&planets.length>=3&&!this.hidden('system:asteroids')){
      const beltRadius=25.5;
      const beltCount=s.quality==='cinematic'?340:s.quality==='battery'?120:230;
      const beltPts=[];const bRnd=rng(hash(sys.id+'-belt'));
      for(let b=0;b<beltCount;b++){
        const angle=bRnd()*Math.PI*2,dist=beltRadius+(bRnd()-.5)*5.2,y=(bRnd()-.5)*1.4;
        beltPts.push(Math.cos(angle)*dist,y,Math.sin(angle)*dist);
      }
      const beltGeom=new THREE.BufferGeometry();
      beltGeom.setAttribute('position',new THREE.Float32BufferAttribute(beltPts,3));
      beltGeom.computeBoundingSphere();
      const beltMesh=new THREE.Points(beltGeom,new THREE.PointsMaterial({color:0x8ca2b3,size:.45,transparent:true,opacity:.52,depthWrite:false}));
      this.group.add(beltMesh);
      this.motionObjects.push({obj:beltMesh,speed:.000015});
    }

    const cometA=46,cometB=18;
    const cometPts=[];
    for(let k=0;k<=72;k++){
      const a=k/72*Math.PI*2;
      cometPts.push(new THREE.Vector3(Math.cos(a)*cometA-14,Math.sin(a)*3.2,Math.sin(a)*cometB));
    }
    if(!this.hidden('system:comet')){
    this.group.add(lines(cometPts,0x38bdf8,0.16,true));
    const cometGroup=new THREE.Group();
    const cometNucleus=sphere(0.42,0xdbeafe,0x60a5fa);
    cometGroup.add(cometNucleus);
    this.group.add(cometGroup);
    this.motionObjects.push({obj:cometGroup,isComet:true,a:cometA,b:cometB,cx:-14,cy:3.2,phase:(hash(sys.id+'comet')%628)/100,speed:0.00008});
    }

    for(const [idx,n] of planets.entries()){
      const r=Math.max(7,V(n.position).length());
      const orbit=[];for(let k=0;k<=120;k++){const angle=k/120*Math.PI*2;orbit.push(new THREE.Vector3(Math.cos(angle)*r,0,Math.sin(angle)*r));}
      if(s.layers.routes)this.group.add(lines(orbit,0x5e87b2,.24));
      const group=new THREE.Group();group.position.copy(V(n.position));this.group.add(group);
      const planet=sphere(1.2+n.size,n.color);group.add(planet);

      const atmoGeom=new THREE.SphereGeometry((1.2+n.size)*1.06,20,14);
      const atmoMat=new THREE.MeshBasicMaterial({color:n.color,transparent:true,opacity:0.18,blending:THREE.AdditiveBlending,depthWrite:false});
      group.add(new THREE.Mesh(atmoGeom,atmoMat));

      const pInfo=getPlanetClassification(n,idx);
      if(pInfo?.hasRings){const ring=new THREE.Mesh(new THREE.RingGeometry(2.45,3.55,50),new THREE.MeshBasicMaterial({color:0x87a8bd,side:THREE.DoubleSide,opacity:.4,transparent:true}));ring.rotation.x=-.25;group.add(ring);}
      if(pInfo?.hasMoons){
        const moonRadius=(1.2+n.size)*1.75;
        const moonGroup=new THREE.Group();group.add(moonGroup);
        const moon=sphere(.32+n.size*.1,0xc8d6df,0x05080c);moon.position.set(moonRadius,0,0);
        moonGroup.add(moon);
        const moonOrbitPts=[];for(let m=0;m<=40;m++){const a=m/40*Math.PI*2;moonOrbitPts.push(new THREE.Vector3(Math.cos(a)*moonRadius,0,Math.sin(a)*moonRadius));}
        moonGroup.add(lines(moonOrbitPts,0x67899e,.18));
        this.motionObjects.push({obj:moonGroup,speed:.0009+idx*.0003});
      }
      this.createPickTarget(3,n,group);
      if(pInfo){
        const targetItem=this.labelItems[this.labelItems.length-1];
        if(targetItem)targetItem.subtitle=pInfo.badge;
      }
      this.motionObjects.push({obj:group,orbit:r,phase:Math.atan2(n.position[2],n.position[0]),speed:.00015/(idx+1)});
    }
    if(s.layers.annotations)this.makeAnnotations(sys.id);
  }
  pick(ev,enter=false){const rect=this.canvas.getBoundingClientRect();this.pointer.set(((ev.clientX-rect.left)/rect.width)*2-1,1-((ev.clientY-rect.top)/rect.height)*2);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.pickables,false);if(!hits.length)return;
    hits.sort((a,b)=>a.distance-b.distance);
    const id=hits[0].object.userData.atlasId;if(id)this.callbacks.onSelect?.(id,enter,ev);
  }
  focusOn(node,durationMs=600){const obj=this.labelItems.find(p=>p.node.id===node.id)?.obj;if(!obj)return;
    const p=new THREE.Vector3();obj.getWorldPosition(p);
    const dist=node.kind==='galaxy'?(62*(node.size||1)):node.kind==='system'?26:10;
    const dir=this.camera.position.clone().sub(this.controls.target).normalize();
    if(dir.lengthSq()<0.001)dir.set(0,.6,.8).normalize();
    const newCam=p.clone().add(dir.multiplyScalar(dist));
    this.trackingNodeId=node.id;
    this.transitionCamera(newCam,p,durationMs);
  }
  resetViewCamera(smooth=true){
    const cam=this.view.kind==='all'?[0,195,260]:this.view.kind==='galaxy'?[0,55,110]:[0,38,82];
    const tgt=this.view.kind==='all'?[6,-2,-6]:[0,0,0];
    const targetCamera=new THREE.Vector3(...cam);
    const targetControls=new THREE.Vector3(...tgt);
    this.trackingNodeId=null;
    if(smooth&&!this.reducedMotion){
      this.transitionCamera(targetCamera,targetControls,600,()=>{
        this.camera.updateMatrixWorld();this.updateLabels();
      });
    }else{
      this.controls.target.copy(targetControls);this.camera.position.copy(targetCamera);
      this.controls.update();this.camera.updateMatrixWorld();this.updateLabels();
    }
  }
  updateLabels(){
    const state=this.state;
    if(!state||!state.layers.labels){for(const node of this.labelNodes.values())node.remove();this.labelNodes.clear();return;}
    const candidates=[];const w=this.width,h=this.height;
    const budget=w<640?14:w<1024?22:32;
    // Reuse scratch vectors: projected labels can update 20 times per second.
    const wp=this._labelWorldPos||(this._labelWorldPos=new THREE.Vector3());
    const p=this._labelProjectedPos||(this._labelProjectedPos=new THREE.Vector3());
    for(const item of this.labelItems){const n=item.node;if(n.label?.show===false)continue;
      item.obj.getWorldPosition(wp);p.copy(wp).project(this.camera);
      if(p.z< -1||p.z>1||Math.abs(p.x)>1.06||Math.abs(p.y)>1.06)continue;
      const x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
      candidates.push({n,x,y,item,d:wp.distanceTo(this.camera.position)});
    }
    candidates.sort((a,b)=>{
      const aSel=state.selected===a.n.id?1:0;
      const bSel=state.selected===b.n.id?1:0;
      if(aSel!==bSel)return bSel-aSel;
      const aRef=a.n.status==='reference'?1:0;
      const bRef=b.n.status==='reference'?1:0;
      if(aRef!==bRef)return bRef-aRef;
      return a.d-b.d;
    });
    const used=[],live=new Set();
    for(const {n,x,y,item,d} of candidates.slice(0,budget)){
      const font=clamp((n.label?.size||12)*state.typographyScale,9,42);
      const wd=Math.min(360,n.name.length*font*.68+16),ht=font+18;
      if(used.some(q=>Math.abs(x-q[0])<(wd+q[2])/2&&Math.abs(y-q[1])<(ht+q[3])/2))continue;
      used.push([x,y,wd,ht]);live.add(n.id);
      let btn=this.labelNodes.get(n.id);
      if(!btn){
        btn=document.createElement('button');btn.className='world-label';btn.type='button';btn.dataset.atlasId=n.id;
        btn.addEventListener('click',event=>this.callbacks.onSelect?.(btn.dataset.atlasId,false,event));
        btn.addEventListener('dblclick',()=>this.callbacks.onSelect?.(btn.dataset.atlasId,true));
        this.labelsRoot.append(btn);this.labelNodes.set(n.id,btn);
      }
      const isSelected=state.selected===n.id;
      if(btn._selected!==isSelected){btn._selected=isSelected;btn.classList.toggle('selected',isSelected);}
      if(btn.dataset.status!==(n.status||'draft'))btn.dataset.status=n.status||'draft';
      if(btn.dataset.kind!==(n.kind||''))btn.dataset.kind=n.kind||'';
      const isRef=n.status==='reference';
      const pipClass=isRef?'pip-canon':(n.kind==='galaxy'?'pip-draft':'pip-aux');
      const badgeText=isRef?(item.subtitle||'SOURCE TOPOLOGY'):(item.subtitle||'');
      const contentKey=`${pipClass}|${n.name}|${badgeText}`;
      if(btn._contentKey!==contentKey){
        btn._contentKey=contentKey;
        btn.innerHTML=`<span class="label-pip ${pipClass}" aria-hidden="true"></span><span class="label-name">${n.name}</span>${badgeText?`<span class="label-badge">${badgeText}</span>`:''}`;
      }
      if(btn._lastX===undefined||Math.abs(x-btn._lastX)>=0.25||Math.abs(y-btn._lastY)>=0.25){
        btn._lastX=x;btn._lastY=y;
        btn.style.left=x.toFixed(1)+'px';
        btn.style.top=y.toFixed(1)+'px';
      }
      if(btn._lastFont!==font){btn._lastFont=font;btn.style.fontSize=font+'px';}
      const fontColor=n.label?.color||'#dff5ff';
      if(btn._lastColor!==fontColor){btn._lastColor=fontColor;btn.style.color=fontColor;}
      const fontFamily=n.label?.family==='mono'?'var(--mono)':'var(--display)';
      if(btn._lastFamily!==fontFamily){btn._lastFamily=fontFamily;btn.style.fontFamily=fontFamily;}
      const alpha=isSelected?1.0:clamp(1.2-(d/700),0.42,1.0);
      if(btn._lastAlpha===undefined||Math.abs(alpha-btn._lastAlpha)>=0.02){
        btn._lastAlpha=alpha;
        btn.style.opacity=alpha.toFixed(2);
      }
      const title=item.subtitle?`${n.name} — ${item.subtitle}`:(isRef?`${n.name} — Canonical Source Topology (Immutable · Unauthored Coordinates)`:(n.kind==='galaxy'?`${n.name} — Draft Galaxy (Click to Inspect · Double-Click to Enter · Editable)`:n.name));
      if(btn._lastTitle!==title){btn._lastTitle=title;btn.title=title;}
    }
    for(const [id,element] of this.labelNodes){if(!live.has(id)){element.remove();this.labelNodes.delete(id);}}
  }
  tick(now){if(this.disposed||document.hidden)return;
    const tStart=performance.now();
    const elapsed=frameDelta(now,this.last);if(Number.isFinite(now))this.last=now;
    this.elapsed+=elapsed;
    if(this.cameraTransition){
      const {startTime,duration,startCam,endCam,startTarget,endTarget,onComplete}=this.cameraTransition;
      const progress=Math.min(1,Math.max(0,(performance.now()-startTime)/duration));
      const t=easeInOutCubic(progress);
      this.camera.position.lerpVectors(startCam,endCam,t);
      this.controls.target.lerpVectors(startTarget,endTarget,t);
      this.controls.update();
      if(progress>=1){
        this.cameraTransition=null;
        onComplete?.();
      }
    }
    if(this.trackingNodeId&&!this.cameraTransition){
      const trackItem=this.labelItems.find(item=>item.node.id===this.trackingNodeId);
      if(trackItem?.obj){
        const wp=this._scratchWorldPos||(this._scratchWorldPos=new THREE.Vector3());
        trackItem.obj.getWorldPosition(wp);
        const delta=(this._scratchDelta||(this._scratchDelta=new THREE.Vector3())).copy(wp).sub(this.controls.target);
        this.camera.position.add(delta);
        this.controls.target.copy(wp);
      }else{this.trackingNodeId=null;}
    }
    if(this.state?.selected){
      const selectedItem=this.labelItems.find(item=>item.node.id===this.state.selected);
      if(selectedItem?.obj){
        this.reticle.visible=true;
        const wp=this._scratchWorldPos||(this._scratchWorldPos=new THREE.Vector3());
        selectedItem.obj.getWorldPosition(wp);
        this.reticle.position.copy(wp);
        const baseSize=(selectedItem.node.size||1);
        const isGal=selectedItem.node.kind==='galaxy';
        const scale=baseSize*(this.view.kind==='all'?(isGal?24:3):this.view.kind==='galaxy'?2.4:1.6);
        const pulse=1+Math.sin(this.elapsed*0.003)*0.06;
        this.reticle.scale.set(scale*pulse,scale*pulse,scale*pulse);
        this.reticle.rotation.y+=elapsed*0.0006;
        if(this.reticle.userData?.ringMat){
          const alpha=0.72+Math.sin(this.elapsed*0.004)*0.18;
          this.reticle.userData.ringMat.opacity=alpha;
          if(this.reticle.userData.tickMat)this.reticle.userData.tickMat.opacity=Math.min(1,alpha+0.1);
        }
      }else{this.reticle.visible=false;}
    }else{this.reticle.visible=false;}
    const motion=this.state?.motion&&!this.reducedMotion&&!this.paused;
    if(motion){
      for(const m of this.motionObjects){
        if(m.isComet){
          const a=m.phase+this.elapsed*m.speed;
          m.obj.position.set(Math.cos(a)*m.a+m.cx,Math.sin(a)*m.cy,Math.sin(a)*m.b);
        }else if(m.orbit){
          const a=m.phase+this.elapsed*m.speed;
          m.obj.position.set(Math.cos(a)*m.orbit,0,Math.sin(a)*m.orbit);
        }else m.obj.rotation.y+=elapsed*m.speed;
      }
      for(const p of this.routeParticles){if(p.failed)continue;try{const t=wrapCurvePhase(p.phase+this.elapsed/1000*p.speed);const v=p.curve.getPointAt(t);if(v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z))p.obj.position.copy(v);else p.failed=true;}catch(error){p.failed=true;console.warn('Atlas route particle disabled:',error);}}
      for(const s of this.animatedShaders){if(s.uniforms?.uTime)s.uniforms.uTime.value=this.elapsed*0.001;}
    }
    this.controls.update();
    const dolly=this.controls.getDistance();
    const deliberate=(now<this._dollyIntentUntil||this._activeTouchIds.size>=2);
    const inward=this._lastDollyDistance!==null&&dolly<this._lastDollyDistance-.025;
    this._lastDollyDistance=dolly;
    if(inward&&deliberate&&!this.cameraTransition&&this.view.kind==='galaxy'){
      const projected=this._zoomProjected||(this._zoomProjected=new THREE.Vector3());
      const world=this._zoomWorld||(this._zoomWorld=new THREE.Vector3());
      const candidates=this.labelItems.filter(i=>i.node.kind==='system').map(i=>{
        i.obj.getWorldPosition(world);projected.copy(world).project(this.camera);
        return {id:i.node.id,kind:i.node.kind,distance:world.distanceTo(this.camera.position),screenX:projected.x,screenY:projected.y,visible:projected.z>=-1&&projected.z<=1};
      });
      const id=findSystemZoomTarget({viewKind:this.view.kind,zooming:true,
        blocked:this.callbacks.canDollyEnter?!this.callbacks.canDollyEnter():false,
        candidates,selectedId:this.state?.selected});
      if(id){this._dollyIntentUntil=0;this.callbacks.onDollyEnter?.(id);}
    }
    this.renderer.render(this.scene,this.camera);
    if(++this.frame%3===0)this.updateLabels();
    const tDuration=performance.now()-tStart;
    this.frameStats.lastMs=tDuration;
    this.frameStats.avgMs=this.frameStats.avgMs*0.95+tDuration*0.05;
    if(tDuration>this.frameStats.maxMs)this.frameStats.maxMs=tDuration;
    else this.frameStats.maxMs=Math.max(tDuration,this.frameStats.maxMs*0.999);
    this.frameCadence.record(now,tDuration);
  }
  info(){
    // FPS uses timestamp deltas from the actual renderer loop. The existing
    // callback timings below describe JS/WebGL submission work, NOT display FPS.
    const cadence=this.frameCadence.snapshot();
    return {
      drawCalls:this.renderer.info.render.calls,
      triangles:this.renderer.info.render.triangles,
      geometries:this.renderer.info.memory.geometries,
      textures:this.renderer.info.memory.textures,
      fps:cadence.fps,
      medianFps:cadence.medianFps,
      renderedFrames:this.frame,
      sampleCount:cadence.sampleCount,
      frameP50Ms:cadence.frameP50Ms,
      frameP95Ms:cadence.frameP95Ms,
      frameP99Ms:cadence.frameP99Ms,
      callbackP95Ms:cadence.callbackP95Ms,
      slowFramePct:cadence.slowFramePct,
      resumeCount:cadence.pauseCount,
      callbackLastMs:Number(this.frameStats.lastMs.toFixed(2)),
      callbackAvgMs:Number(this.frameStats.avgMs.toFixed(2)),
      callbackMaxMs:Number(this.frameStats.maxMs.toFixed(2)),
      // Backwards-compatible historical names: these measure callback wall time.
      lastFrameMs:Number(this.frameStats.lastMs.toFixed(2)),
      avgFrameMs:Number(this.frameStats.avgMs.toFixed(2)),
      maxFrameMs:Number(this.frameStats.maxMs.toFixed(2))
    };
  }
  dispose(){
    this.disposed=true;
    this.renderer.setAnimationLoop(null);
    document.removeEventListener('visibilitychange',this._onFrameVisibility);
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('wheel',this._wheelZoom);
    this.labelsRoot.removeEventListener('wheel',this._labelWheel);
    this.canvas.removeEventListener('pointerdown',this._touchZoomStart);
    this.canvas.removeEventListener('pointerup',this._touchZoomEnd);
    this.canvas.removeEventListener('pointercancel',this._touchZoomEnd);
    this._activeTouchIds.clear();
    this.canvas.removeEventListener('pointerdown',this._down);
    this.canvas.removeEventListener('pointerup',this._up);
    this.canvas.removeEventListener('pointermove',this._move);
    this.canvas.removeEventListener('pointerleave',this._leave);
    this.canvas.removeEventListener('pointercancel',this._cancel);
    this.canvas.removeEventListener('lostpointercapture',this._cancel);
    this.canvas.removeEventListener('dblclick',this._double);
    this.controls.dispose();
    this.viewMemory.clear();
    this.cameraTransition=null;
    if(this._sharedPickGeom)this._sharedPickGeom.dispose();
    if(this._sharedPickMat)this._sharedPickMat.dispose();
    for(const tex of _glowTextureCache.values()){tex.dispose?.();}
    _glowTextureCache.clear();
    if(this.reticle)disposeTree(this.reticle);
    disposeTree(this.group);
    disposeTree(this.bg);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.labelsRoot.replaceChildren();
    this.labelNodes.clear();
  }
}
