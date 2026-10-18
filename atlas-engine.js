import * as THREE from 'three';
import { frameDelta,wrapCurvePhase,easeInOutCubic } from './frame-clock.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { childNodes, nodeById } from './atlas-data.js';
import { getGalaxyMorphology } from './galaxy-morphology.js';
import { getStarClassification, getPlanetClassification } from './stellar-telemetry.js';

const V = (p) => new THREE.Vector3(p[0],p[1],p[2]);
const PALETTE = {azure:0x49dfff, gold:0xffd5a2, void:0x01040b};
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
function hash(t){let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let x=Math.imul(s^(s>>>15),1|s);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296;};}
function makeGlow(color='#49dfff'){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');const grad=ctx.createRadialGradient(64,64,0,64,64,64);
  grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.1,color);grad.addColorStop(.24,color+'99');grad.addColorStop(.56,color+'22');grad.addColorStop(1,color+'00');
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function lines(points,color,opacity=.6,dashed=false){
  const g=new THREE.BufferGeometry().setFromPoints(points);
  const m=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:3,gapSize:2}):new THREE.LineBasicMaterial({color,transparent:true,opacity});
  const o=new THREE.Line(g,m);if(dashed)o.computeLineDistances();return o;
}
function disposeTree(root){
  root.traverse(obj=>{
    if(obj.geometry?.dispose)obj.geometry.dispose();
    const mats=obj.material?Array.isArray(obj.material)?obj.material:[obj.material]:[];
    for(const mat of mats){for(const key of ['map','alphaMap','emissiveMap'])if(mat[key]?.dispose)mat[key].dispose();mat.dispose?.();}
  });
  root.clear();
}
const sphere = (radius,color,emissive=0x000000) => new THREE.Mesh(new THREE.SphereGeometry(radius,24,16),new THREE.MeshStandardMaterial({color,emissive,roughness:.7,metalness:.12}));
export class AtlasEngine {
  constructor(canvas,labelsRoot,callbacks){
    this.canvas=canvas;this.labelsRoot=labelsRoot;this.callbacks=callbacks;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(PALETTE.void);
    this.scene.fog=new THREE.FogExp2(0x02070d, 0.0012);
    this.camera=new THREE.PerspectiveCamera(48,1,.1,5000);
    this.camera.position.set(0,215,280);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.5;
    this.controls=new OrbitControls(this.camera,canvas);
    this.controls.enableDamping=true;this.controls.dampingFactor=.075;
    this.controls.minDistance=6;this.controls.maxDistance=950;this.controls.maxPolarAngle=Math.PI*.91;
    this.controls.screenSpacePanning=true;
    this.controls.target.set(0,-4,-12);
    this.group=new THREE.Group();this.scene.add(this.group);
    this.bg=new THREE.Group();this.scene.add(this.bg);
    this.scene.add(new THREE.AmbientLight(0x8db9ec,1.2));
    this.sunLight=new THREE.PointLight(0xffe0b8,24,500);this.scene.add(this.sunLight);
    this.pickables=[];this.labelItems=[];this.motionObjects=[];this.routeParticles=[];this.labelNodes=new Map();
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.view={kind:'all',id:null};this.state=null;this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.pointerStart=null;
    this.viewMemory=new Map();
    this.cameraTransition=null;
    this.hoveredId=null;
    this.trackingNodeId=null;
    this.reticle=this.createSelectionReticle();
    this.scene.add(this.reticle);
    canvas.addEventListener('pointerdown',this._down=ev=>{
      if(!ev.isPrimary)return;
      this.pointerStart={id:ev.pointerId,x:ev.clientX,y:ev.clientY};
      this.trackingNodeId=null;
    });
    canvas.addEventListener('pointerup',this._up=ev=>{
      const start=this.pointerStart;this.pointerStart=null;
      if(!start||!ev.isPrimary||start.id!==ev.pointerId||Math.hypot(ev.clientX-start.x,ev.clientY-start.y)>8)return;
      this.pick(ev);
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
    canvas.addEventListener('pointercancel',this._cancel=()=>{this.pointerStart=null;});
    canvas.addEventListener('lostpointercapture',this._cancel);
    canvas.addEventListener('dblclick',this._double=(ev)=>{this.pick(ev,true);});
    this.frame=0;this.last=performance.now();this.elapsed=0;this.paused=false;this.disposed=false;
    this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initBackground();this.resize();
    this.renderer.setAnimationLoop(t=>this.tick(t));
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
    const ring=new THREE.Mesh(new THREE.RingGeometry(1,1.09,36),new THREE.MeshBasicMaterial({color:0x52deff,side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));
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
    return group;
  }
  initBackground(){
    const rnd=rng(1106),p=[],colors=[],sizes=[],alphas=[];
    for(let i=0;i<1900;i++){
      const x=(rnd()-.5)*1450,y=(rnd()-.5)*780,z=(rnd()-.5)*1050;
      if(z < -110)continue; // The area beyond the Siege Wall is deliberately starless.
      p.push(x,y,z);
      const t=rnd();
      const c = t > 0.85 ? new THREE.Color('#ffd29d') : t < 0.25 ? new THREE.Color('#93e6ff') : new THREE.Color('#ffffff');
      colors.push(c.r,c.g,c.b);
      sizes.push(.75+Math.pow(rnd(),3)*2.4);
      alphas.push(.4+rnd()*.55);
    }
    for(let i=0;i<1100;i++){
      const fAngle=rnd()*Math.PI*2;
      const fRadius=340+rnd()*460;
      const fTilt=(rnd()-.5)*260;
      const x=Math.cos(fAngle)*fRadius+(rnd()-.5)*130;
      const y=fTilt+(rnd()-.5)*70;
      const z=Math.sin(fAngle)*fRadius+(rnd()-.5)*130;
      if(z < -110)continue; // Siege Wall black-hole containment lattice: strictly starless
      p.push(x,y,z);
      const c=new THREE.Color('#7ca0c4').lerp(new THREE.Color('#b3c3db'),rnd());
      colors.push(c.r,c.g,c.b);
      sizes.push(1.6+rnd()*1.8);
      alphas.push(.18+rnd()*.22);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    g.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
    g.setAttribute('aAlpha',new THREE.Float32BufferAttribute(alphas,1));
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
        }`,
      fragmentShader: String.raw`
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          float r=length(gl_PointCoord-.5)*2.0;
          if(r>1.0) discard;
          float core=exp(-12.0*r*r);
          float halo=pow(max(0.0,1.0-r),2.5);
          float alpha=(core*.85+halo*.3)*vAlpha;
          gl_FragColor=vec4(vColor,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
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
  setState(state,view=this.view){this.state=state;this.view=view;this.resize();this.rebuild();this.camera.updateMatrixWorld();this.updateLabels();}
  setView(view,smooth=true){
    const prevKey=this.view.kind==='all'?'all':`${this.view.kind}:${this.view.id}`;
    this.viewMemory.set(prevKey,{camera:this.camera.position.clone(),target:this.controls.target.clone()});
    this.view=view;this.rebuild();
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
  transitionEra(durationMs=350){
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
    disposeTree(this.group);this.pickables=[];this.labelItems=[];this.motionObjects=[];this.routeParticles=[];
    if(this.view.kind==='all')this.buildAll();
    if(this.view.kind==='galaxy')this.buildGalaxy();
    if(this.view.kind==='system')this.buildSystem();
  }
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
  /**
   * Stylized volumetric galaxy: the cloudy spiral disc is a single transparent
   * mesh, and its luminous stars live in one GPU particle batch. This is
   * editorial cartography, never a real astrometric reconstruction.
   */
  makeDropStem(parent,pos,gridY=-19,color=0x2f6485,size=1.0,isReference=false){
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
        }`,
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
          if(radius>1.0) discard;
          float angle=atan(q.y,q.x);
          float spiral=pow(max(.0,cos(arms*angle-pitch*radius+phase)*.5+.5),4.5);
          if(bar > 0.0){
            float barDist = abs(q.y) + max(0.0, abs(q.x) - 0.45);
            float barGlow = exp(-barDist * barDist * 32.0) * bar;
            spiral = mix(spiral, 1.0, clamp(barGlow, 0.0, 1.0));
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
        }`,
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
      const warm=r/rad<.23||temperature>.90;
      const violet=!warm&&temperature<.09;
      const color=new THREE.Color(warm?'#ffd9a8':violet?'#c9b8ff':'#63cbfa');
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
        }`,
      fragmentShader: String.raw`
        varying vec3 vColor;
        varying float vLight;
        void main(){
          float r=length(gl_PointCoord-.5)*2.0;
          if(r>1.0) discard;
          float core=exp(-20.0*r*r);
          float halo=pow(1.0-r,3.0);
          float alpha=(core*.78+halo*.22)*vLight;
          gl_FragColor=vec4(vColor*1.1,alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
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
      for(const n of childNodes(s,null,'galaxy')){
        const group=new THREE.Group();group.position.copy(V(n.position));
        const tiltX=((hash(n.id)%19)-9)*.012,tiltZ=((hash(n.id+'z')%19)-9)*.012;
        group.rotation.set(tiltX,0,tiltZ);
        this.group.add(group);
        if(s.layers.grid)this.makeDropStem(this.group,n.position,-19,0x2f6485,n.size,n.status==='reference');
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
        this.addRing(group,12*n.size,n.color,.20,.24);
        const pick=new THREE.Mesh(new THREE.SphereGeometry(13*n.size,12,10),new THREE.MeshBasicMaterial({visible:false}));group.add(pick);this.hitTarget(n,pick);
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
        if(s.layers.grid)this.makeDropStem(this.group,n.position,-19,0x6bbfe8,n.size,true);
        const crystal=new THREE.Mesh(new THREE.IcosahedronGeometry(4*n.size,1),new THREE.MeshStandardMaterial({color:n.color,wireframe:true,transparent:true,opacity:.75,emissive:n.color,emissiveIntensity:1.25}));group.add(crystal);
        this.addGlow(group,13,n.color,.6);this.addRing(group,7,n.color,.55);
        const pick=new THREE.Mesh(new THREE.SphereGeometry(7,10,8),new THREE.MeshBasicMaterial({visible:false}));group.add(pick);this.hitTarget(n,pick);
      }
    }
    if(s.layers.rings&&s.epoch!=='post')this.makeRemnantRings();
    if(s.layers.annotations)this.makeAnnotations(null);
  }
  makeGrid(size,step){for(let x=-size/2;x<=size/2;x+=step)this.group.add(lines([new THREE.Vector3(x,-19,-size/2),new THREE.Vector3(x,-19,size/2)],0x2d6581,.16));
    for(let z=-size/2;z<=size/2;z+=step)this.group.add(lines([new THREE.Vector3(-size/2,-19,z),new THREE.Vector3(size/2,-19,z)],0x2d6581,.16));}
  makeTerritories(){
    for(const n of childNodes(this.state,null,'galaxy')){
      const c=new THREE.Color(n.color);
      const group=new THREE.Group();group.position.copy(V(n.position));this.group.add(group);
      const g=new THREE.CircleGeometry(19*n.size,64);
      const material=new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,transparent:true,opacity:.065,depthWrite:false});
      const sheet=new THREE.Mesh(g,material);sheet.rotation.x=-Math.PI/2;sheet.position.y=-15;group.add(sheet);
      const pts=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;const r=(19+2*Math.sin(a*5+hash(n.id)%5))*n.size;pts.push(new THREE.Vector3(Math.cos(a)*r,-14.5,Math.sin(a)*r));}
      group.add(lines(pts,c,.3,true));
    }
  }
  makeWall(){
    const pts=[];const coords=[[-215,-90],[-170,-94],[-138,-77],[-113,-75],[-85,-82],[-56,-70],[-25,-90],[16,-85],[55,-94],[82,-96],[112,-105],[155,-110],[225,-95]];
    for(const [x,z] of coords){
      const py = 3+Math.sin(x*.06)*4;
      pts.push(new THREE.Vector3(x,py,z));
      this.group.add(lines([new THREE.Vector3(x,py,z),new THREE.Vector3(x,-36,z)],0x1c3852,0.32,true));
    }
    this.group.add(lines(pts,0x8ba6b8,.65));
    const shape=new THREE.Shape();shape.moveTo(-250,-220);shape.lineTo(250,-220);shape.lineTo(250,-95);
    for(let i=coords.length-1;i>=0;i--)shape.lineTo(coords[i][0],coords[i][1]);shape.lineTo(-250,-90);shape.closePath();
    const geom=new THREE.ShapeGeometry(shape);geom.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide,depthWrite:true}));mesh.position.y=-10;this.group.add(mesh);
    const rnd=rng(606);const debris=[];const latticeNodes=[];
    for(let i=0;i<120;i++){
      const seg=rnd()*(coords.length-1);const k=Math.floor(seg);const a=coords[k],b=coords[Math.min(k+1,coords.length-1)],t=seg-k;
      const x=a[0]+(b[0]-a[0])*t, z=a[1]+(b[1]-a[1])*t;
      debris.push(x+(rnd()-.5)*10,(rnd()-.5)*12,z+(rnd()-.5)*9);
      if(i%2===0)latticeNodes.push(x+(rnd()-.5)*4,(rnd()-.5)*8,z+(rnd()-.5)*4);
    }
    const p=new THREE.BufferGeometry();p.setAttribute('position',new THREE.Float32BufferAttribute(debris,3));
    this.group.add(new THREE.Points(p,new THREE.PointsMaterial({color:0x526573,size:.55,transparent:true,opacity:.7})));
    const lp=new THREE.BufferGeometry();lp.setAttribute('position',new THREE.Float32BufferAttribute(latticeNodes,3));
    this.group.add(new THREE.Points(lp,new THREE.PointsMaterial({color:0x38bdf8,size:.65,transparent:true,opacity:.55})));
    const wallLabel={id:'wall-concept',name:'THE SIEGE WALL',status:'reference',label:{show:true,size:19,color:'#d1d6de',family:'display'}};
    const o=new THREE.Object3D();o.position.set(35,10,-103);this.group.add(o);this.labelItems.push({node:wallLabel,obj:o,subtitle:'BLACK-HOLE LATTICE / ABSENCE'});
  }
  makeRoutes(parentId=null){
    for(const r of this.state.routes){
      if((r.kind==='starsilk'&&!this.state.layers.starsilk)||(r.kind==='hookshot'&&!this.state.layers.routes))continue;
      const a=nodeById(this.state,r.from),b=nodeById(this.state,r.to);if(!a||!b||a.parentId!==parentId||b.parentId!==parentId)continue;
      const p=V(a.position),q=V(b.position),m=p.clone().add(q).multiplyScalar(.5);m.y+=9;
      const c=new THREE.QuadraticBezierCurve3(p,m,q);
      const samples=c.getPoints(48);const azure=r.kind==='starsilk';
      this.group.add(lines(samples,azure?0x60ebff:0xb6c8d6,azure?.82:.26,!azure));
      if(azure){
        const halo=new THREE.Mesh(new THREE.TubeGeometry(c,54,.32,5,false),new THREE.MeshBasicMaterial({color:0x0ea5e9,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));this.group.add(halo);
        for(let i=0;i<5;i++){
          const particle=this.addGlow(this.group,3.2,'#78f0ff',.7);
          this.routeParticles.push({obj:particle,curve:c,phase:i/5,speed:.055});
        }
      }
    }
    if(parentId===null&&this.state.layers.starsilk){
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-158,-11,65),new THREE.Vector3(-90,-9,77),new THREE.Vector3(-35,-15,87),new THREE.Vector3(30,-8,72),new THREE.Vector3(95,-10,80),new THREE.Vector3(152,-7,65)]);
      const outerVeil=new THREE.Mesh(new THREE.TubeGeometry(curve,128,2.2,7,false),new THREE.MeshBasicMaterial({color:0x0284c7,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false}));
      const innerCore=new THREE.Mesh(new THREE.TubeGeometry(curve,128,0.95,7,false),new THREE.MeshBasicMaterial({color:0x06b6d4,transparent:true,opacity:.38,blending:THREE.AdditiveBlending,depthWrite:false}));
      this.group.add(outerVeil,innerCore);
      this.group.add(lines(curve.getPoints(128),0xbaf3ff,.78));
      for(let i=0;i<16;i++){
        const particle=this.addGlow(this.group,i%3?2.8:4.5,'#38bdf8',.72);
        this.routeParticles.push({obj:particle,curve,phase:i/16,speed:.042});
      }
    }
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
      const target=new THREE.Mesh(new THREE.SphereGeometry(3.5,12,10),new THREE.MeshBasicMaterial({visible:false}));pg.add(target);this.hitTarget(n,target);
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
    const sunTarget=new THREE.Mesh(new THREE.SphereGeometry(4.2,12,10),new THREE.MeshBasicMaterial({visible:false}));
    center.add(sunTarget);this.hitTarget(sys,sunTarget);
    if(this.labelItems.length)this.labelItems[this.labelItems.length-1].subtitle=starInfo.spectralType;

    if(s.layers.grid)this.makeGrid(120,8);
    const planets=childNodes(s,sys.id,'planet');
    if((s.layers.routes||s.layers.grid)&&planets.length>=3){
      const beltRadius=25.5;
      const beltCount=s.quality==='cinematic'?340:s.quality==='battery'?120:230;
      const beltPts=[];const bRnd=rng(hash(sys.id+'-belt'));
      for(let b=0;b<beltCount;b++){
        const angle=bRnd()*Math.PI*2,dist=beltRadius+(bRnd()-.5)*5.2,y=(bRnd()-.5)*1.4;
        beltPts.push(Math.cos(angle)*dist,y,Math.sin(angle)*dist);
      }
      const beltGeom=new THREE.BufferGeometry();
      beltGeom.setAttribute('position',new THREE.Float32BufferAttribute(beltPts,3));
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
    this.group.add(lines(cometPts,0x38bdf8,0.16,true));
    const cometGroup=new THREE.Group();
    const cometNucleus=sphere(0.42,0xdbeafe,0x60a5fa);
    cometGroup.add(cometNucleus);
    this.group.add(cometGroup);
    this.motionObjects.push({obj:cometGroup,isComet:true,a:cometA,b:cometB,cx:-14,cy:3.2,phase:(hash(sys.id+'comet')%628)/100,speed:0.00008});

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
      const target=new THREE.Mesh(new THREE.SphereGeometry(3,12,8),new THREE.MeshBasicMaterial({visible:false}));group.add(target);this.hitTarget(n,target);
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
    const cam=this.view.kind==='all'?[0,215,280]:this.view.kind==='galaxy'?[0,55,110]:[0,38,82];
    const tgt=this.view.kind==='all'?[0,-4,-12]:[0,0,0];
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
      btn.dataset.status=n.status||'draft';
      btn.dataset.kind=n.kind||'';
      const isRef=n.status==='reference';
      const pipClass=isRef?'pip-canon':(n.kind==='galaxy'?'pip-draft':'pip-aux');
      const badgeText=isRef?(item.subtitle||'SOURCE TOPOLOGY'):(item.subtitle||'');
      btn.innerHTML=`<span class="label-pip ${pipClass}" aria-hidden="true"></span><span class="label-name">${n.name}</span>${badgeText?`<span class="label-badge">${badgeText}</span>`:''}`;
      btn.classList.toggle('selected',state.selected===n.id);
      btn.style.left=x+'px';btn.style.top=y+'px';btn.style.fontSize=font+'px';
      btn.style.color=n.label?.color||'#dff5ff';
      btn.style.fontFamily=n.label?.family==='mono'?'var(--mono)':'var(--display)';
      const alpha=state.selected===n.id?1.0:clamp(1.2-(d/700),0.42,1.0);
      btn.style.opacity=alpha;
      btn.title=item.subtitle?`${n.name} — ${item.subtitle}`:(isRef?`${n.name} — Canonical Source Topology (Immutable · Unauthored Coordinates)`:(n.kind==='galaxy'?`${n.name} — Draft Galaxy (Click to Inspect · Double-Click to Enter · Editable)`:n.name));
    }
    for(const [id,element] of this.labelNodes){if(!live.has(id)){element.remove();this.labelNodes.delete(id);}}
  }
  tick(now){if(this.disposed)return;const elapsed=frameDelta(now,this.last);if(Number.isFinite(now))this.last=now;
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
        const delta=wp.clone().sub(this.controls.target);
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
    }
    this.controls.update();this.renderer.render(this.scene,this.camera);
    if(++this.frame%3===0)this.updateLabels();
  }
  info(){return {drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures};}
  dispose(){this.disposed=true;this.renderer.setAnimationLoop(null);this.resizeObserver.disconnect();this.canvas.removeEventListener('pointerdown',this._down);this.canvas.removeEventListener('pointerup',this._up);this.canvas.removeEventListener('pointermove',this._move);this.canvas.removeEventListener('pointerleave',this._leave);this.canvas.removeEventListener('pointercancel',this._cancel);this.canvas.removeEventListener('lostpointercapture',this._cancel);this.canvas.removeEventListener('dblclick',this._double);this.controls.dispose();this.viewMemory.clear();this.cameraTransition=null;if(this.reticle)disposeTree(this.reticle);disposeTree(this.group);disposeTree(this.bg);this.renderer.dispose();this.renderer.forceContextLoss();this.labelsRoot.replaceChildren();this.labelNodes.clear();}
}
