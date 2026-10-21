import * as THREE from 'three';
import {deleteObject,deleteObjects,planDeletionBatch} from './deletion-engine.js';
import {eligibleGroup,translatedGroup,regionFromGroup,validatePolygon,regionReport,strategicAnalysis,pointInPolygon,polygonCentroid,polygonBounds,strategicPosture,convexHull,MAX_REGIONS,MAX_VERTICES} from './strategic-model.js';

/**
 * Phase 4: one bounded 3D editorial inspector. Main.js alone owns state/Undo;
 * AtlasEngine alone owns the WebGL loop. All transform/shape previews are transient.
 */
export class StrategicStudio {
  constructor({canvas,atlas,panel,labelsRoot,getState,getView,onChange,onMessage}) {
    Object.assign(this,{canvas,atlas,panel,labelsRoot,getState,getView,onChange,onMessage});
    this.engine=null;this.mode='group';this.opened=false;this.groupIds=[];this.regionId=null;
    this.regionRenderKey=null;this.regionRebuilds=0;
    this.gesture=null;this.dragVertices=null;this.drawing=false;this.drawingPoints=[];this.pointer=null;
    this.$=id=>panel.querySelector('#'+id);
    this.selectHandle=document.createElement('button');this.selectHandle.id='strategyGroupHandle';
    this.selectHandle.className='strategy-group-handle';this.selectHandle.type='button';this.selectHandle.setAttribute('aria-label','Drag selected draft objects together');
    this.selectHandle.title='Move entire selected draft group in one undoable action';this.selectHandle.textContent='✥';
    this.selectHandle.hidden=true;canvas.parentElement.append(this.selectHandle);
    this.vertexLayer=document.createElement('div');this.vertexLayer.id='strategyVertexLayer';this.vertexLayer.className='strategy-vertex-layer';
    canvas.parentElement.append(this.vertexLayer);
    this.badgeLayer=document.createElement('div');this.badgeLayer.id='strategyRegionBadgeLayer';this.badgeLayer.className='strategy-region-labels-layer';
    canvas.parentElement.append(this.badgeLayer);
    this.overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');this.overlay.id='strategyGuides';this.overlay.classList.add('strategy-guides');
    this.overlay.setAttribute('aria-hidden','true');canvas.parentElement.append(this.overlay);
    this.readout=document.createElement('output');this.readout.className='strategy-gesture-readout';this.readout.hidden=true;canvas.parentElement.append(this.readout);
    this.$('strategyClose').addEventListener('click',()=>this.close());
    for(const key of ['group','region','pan'])this.$('strategyMode'+key[0].toUpperCase()+key.slice(1)).addEventListener('click',()=>this.setMode(key));
    this.$('strategySelectAll').addEventListener('click',()=>this.selectAll());
    this.$('strategyClear').addEventListener('click',()=>this.applyGroup([]));
    this.$('strategyDeleteGroup').addEventListener('click',()=>this.deleteGroup());
    this.$('strategyGroupAxis').addEventListener('change',()=>this.cancelGesture());
    this.$('strategyGroupSnap').addEventListener('change',()=>this.cancelGesture());
    for(const [id,delta] of [['strategyNudgeLeft',[-1,0,0]],['strategyNudgeRight',[1,0,0]],['strategyNudgeUp',[0,0,-1]],['strategyNudgeDown',[0,0,1]],['strategyNudgeHeight',[0,1,0]]]){
      this.$(id).addEventListener('click',()=>this.commitGroupDelta(delta));
    }
    this.$('strategyFromGroup').addEventListener('click',()=>this.createFromGroup());
    this.$('strategyStartDraw').addEventListener('click',()=>this.startDrawing());
    this.$('strategyFinishDraw').addEventListener('click',()=>this.finishDrawing());
    this.$('strategyCancelDraw').addEventListener('click',()=>this.cancelDrawing());
    this.$('strategyRegionForm').addEventListener('submit',e=>this.saveRegion(e));
    this.$('strategyAddVertex').addEventListener('click',()=>this.addVertex());
    this.$('strategyDeleteRegion').addEventListener('click',()=>this.deleteRegion());
    this.$('strategySelectEnclosed')?.addEventListener('click',()=>this.selectEnclosed());
    this.$('strategyFrameRegion')?.addEventListener('click',()=>this.frameRegion());
    this.selectHandle.addEventListener('pointerdown',e=>this.startGroupDrag(e));
    this.selectHandle.addEventListener('pointermove',e=>this.moveGroupDrag(e));
    this.selectHandle.addEventListener('pointerup',e=>this.endGroupDrag(e));
    this.selectHandle.addEventListener('pointercancel',()=>this.cancelGesture());
    // Listen on the canvas after the existing engine. The editor intercepts selection in main.js.
    this.canvas.addEventListener('pointerdown',this._down=e=>this.canvasDown(e));
    this.canvas.addEventListener('pointermove',this._move=e=>this.canvasMove(e));
    this.canvas.addEventListener('pointerup',this._up=e=>this.canvasUp(e));
    this.canvas.addEventListener('pointercancel',this._cancel=()=>this.cancelGesture());
    this._resize=()=>this.updateGuides();window.addEventListener('resize',this._resize);
    this._keys=e=>{
      if(!this.opened||document.querySelector('dialog[open]')||e.target?.closest?.('input,textarea,select,[contenteditable],[role="textbox"]')||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.key==='Escape'&&(this.drawing||this.gesture||this.dragVertices)){
        this.cancelDrawing();this.cancelGesture();e.preventDefault();e.stopImmediatePropagation();return;
      }
      if(e.key==='Backspace'||e.key==='Delete'){
        // An active strategic tool owns destructive keys. Never delete a stale
        // single-object inspector selection when its own group/region is active.
        e.preventDefault();e.stopImmediatePropagation();
        if(this.drawing){
          if(this.drawingPoints.length){
            this.drawingPoints.pop();
            this.$('strategyFinishDraw').disabled=this.drawingPoints.length<3;
            this.$('strategyDrawHint').textContent='Drawing provisional region ('+this.drawingPoints.length+' vertices): Tap to place, Backspace to undo, Enter to finish, ESC to cancel.';
            this.updateGuides();this.onMessage('Removed vertex ('+this.drawingPoints.length+' remaining).');
          }
        }else if(this.mode==='group'&&this.groupIds.length&&!this.gesture&&!this.dragVertices){
          this.deleteGroup();
        }else if(this.mode==='region'&&e.key==='Delete'&&this.regionId&&!this.gesture&&!this.dragVertices){
          this.deleteRegion();
        }
        return;
      }
      if(this.drawing&&e.key==='Enter'){
        e.preventDefault();e.stopImmediatePropagation();
        if(this.drawingPoints.length>=3)this.finishDrawing();
        else this.onMessage('A region requires at least 3 non-collinear vertices.',true);
      }
    };document.addEventListener('keydown',this._keys,true);
    this.setMode('group');this.close();
  }
  attachEngine(engine){
    if(this.engine&&this._onCamera)this.engine.controls.removeEventListener('change',this._onCamera);
    this.engine=engine;this._onCamera=()=>this.updateGuides();engine.controls.addEventListener('change',this._onCamera);
    this.sync();
  }
  open(){if(this.opened)return;this.opened=true;this.panel.hidden=false;this.atlas.classList.add('strategic-open');this.setMode('group');this.sync();}
  close(){this.cancelGesture();this.cancelDrawing();this.opened=false;this.panel.hidden=true;this.atlas.classList.remove('strategic-open');this.selectHandle.hidden=true;this.vertexLayer.replaceChildren();this.badgeLayer.replaceChildren();this.overlay.replaceChildren();if(this.engine){this.engine.controls.enabled=true;this.engine.paused=document.hidden;}this.regionId=null;this.groupIds=[];this.renderRegions();}
  setMode(mode){if(!['group','region','pan'].includes(mode))return;
    this.cancelGesture();this.cancelDrawing();this.mode=mode;
    for(const key of ['group','region','pan'])this.$('strategyMode'+key[0].toUpperCase()+key.slice(1)).setAttribute('aria-pressed',String(key===mode));
    this.$('strategyGroupTools').hidden=mode!=='group';this.$('strategyRegionTools').hidden=mode!=='region';
    if(this.engine){this.engine.controls.enabled=mode==='pan'||!this.opened;this.engine.paused=!!(this.opened&&mode!=='pan'||document.hidden);}
    this.updateGuides();this.sync();
  }
  eligibleVisible(){const s=this.getState(),view=this.getView(),parent=view.kind==='all'?null:view.id;
    const type=view.kind==='all'?'galaxy':view.kind==='galaxy'?'system':'planet';
    return s.nodes.filter(n=>n.status==='draft'&&n.kind===type&&n.parentId===parent&&n.id!=='worldsvault'&&n.id!=='mother');
  }
  consumeSelect(id,ev){if(!this.opened)return false;
    if(this.mode==='region')return true;
    if(this.mode!=='group')return false;
    const n=this.eligibleVisible().find(n=>n.id===id);
    if(!n){this.onMessage('Only editable objects of the current tier can join a group.',true);return true;}
    const additive=!!(ev?.shiftKey||ev?.ctrlKey||ev?.metaKey);
    const next=additive?[...this.groupIds]:[];
    if(next.includes(id))next.splice(next.indexOf(id),1);else next.push(id);
    this.applyGroup(next);return true;
  }
  applyGroup(ids){const limited=ids.slice(0,32),eligible=this.eligibleVisible();this.groupIds=limited.filter(id=>eligible.some(n=>n.id===id));this.syncSelection();this.updateGuides();}
  selectAll(){this.applyGroup(this.eligibleVisible().slice(0,32).map(n=>n.id));}
  deleteGroup(){
    if(!this.opened||this.mode!=='group'||!this.groupIds.length)return;
    const targets=this.groupIds.map(id=>({type:'node',id}));
    let plan;
    try{plan=planDeletionBatch(this.getState(),targets);}
    catch(error){this.onMessage('Delete refused: '+error.message,true);return;}
    const warning='DELETE '+plan.selectedCount+' SELECTED DRAFT OBJECT(S)?'
      +'\nTotal nodes including descendants: '+plan.nodeCount
      +'\nConnected draft routes: '+plan.routeCount
      +'\nDependent draft regions: '+plan.regionCount
      +'\nOnly the current era changes. Undo restores the entire selection in one step.';
    if(!window.confirm(warning))return;
    this.cancelGesture();
    if(this.onChange(state=>deleteObjects(state,targets),{immediate:true})){
      this.groupIds=[];this.sync();
      this.onMessage('Deleted '+plan.nodeCount+' draft node(s), '+plan.routeCount+' corridor(s), '+plan.regionCount+' region(s). One Undo restores all.');
    }
  }
  syncSelection(){
    this.$('strategyCount').textContent=String(this.groupIds.length);
    this.$('strategyFromGroup').disabled=!this.groupIds.length||this.getState().regions?.length>=MAX_REGIONS;
    this.$('strategyDeleteGroup').disabled=!this.groupIds.length||!this.opened||this.mode!=='group';
    const selected=new Set(this.groupIds);
    for(const btn of document.querySelectorAll('.node-btn')){const id=btn.dataset.atlasId;btn.classList.toggle('strategy-selected',selected.has(id));btn.setAttribute('aria-pressed',String(selected.has(id)));}
    for(const label of this.labelsRoot.querySelectorAll('.world-label'))label.classList.toggle('strategy-selected',selected.has(label.dataset.atlasId));
    const count=this.groupIds.length;
    this.$('strategyGroupSummary').textContent=count?`${count} draft object${count===1?'':'s'} / translate or remove together / one undo`:'Click markers, Shift-click to add, or drag a selection marquee.';
    for(const id of ['strategyNudgeLeft','strategyNudgeRight','strategyNudgeUp','strategyNudgeDown','strategyNudgeHeight'])this.$(id).disabled=!count;
  }
  sync(){
    if(!this.engine)return;
    const visible=new Set(this.eligibleVisible().map(n=>n.id));
    this.groupIds=this.groupIds.filter(id=>visible.has(id));
    if(this.regionId&&!this.visibleRegions().some(r=>r.id===this.regionId))this.regionId=null;
    this.syncSelection();this.renderRegions();this.renderRegionList();this.fillRegion();this.updateGuides();
  }
  visibleRegions(){const id=this.getView().kind==='all'?null:this.getView().id;
    if(this.getView().kind==='system')return [];
    return (this.getState().regions||[]).filter(r=>r.parentId===id);
  }
  project(p){if(!this.engine)return null;
    this.engine.camera.updateMatrixWorld();const vector=new THREE.Vector3(...p).project(this.engine.camera);
    if(!Number.isFinite(vector.x)||vector.z<-1||vector.z>1)return null;
    const rect=this.canvas.getBoundingClientRect();return {x:(vector.x*.5+.5)*rect.width,y:(-vector.y*.5+.5)*rect.height};
  }
  pickPlane(e,y){const rect=this.canvas.getBoundingClientRect();if(!rect.width||!rect.height||!this.engine)return null;
    const xy=new THREE.Vector2((e.clientX-rect.left)*2/rect.width-1,1-(e.clientY-rect.top)*2/rect.height);
    this.engine.camera.updateMatrixWorld();const caster=new THREE.Raycaster();caster.setFromCamera(xy,this.engine.camera);
    return caster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),new THREE.Vector3());
  }
  planeY(){return this.getView().kind==='all'?-10:-4;}
  groupCentre(){const valid=this.eligibleVisible(),chosen=this.groupIds.map(id=>valid.find(n=>n.id===id)).filter(Boolean);if(!chosen.length)return null;
    return chosen.reduce((p,n)=>p.map((x,i)=>x+n.position[i]/chosen.length),[0,0,0]);
  }
  updateGuides(){
    this.selectHandle.hidden=true;this.vertexLayer.replaceChildren();this.badgeLayer.replaceChildren();this.overlay.replaceChildren();
    if(!this.opened||!this.engine)return;
    if(this.mode==='group'){
      const centre=this.groupCentre(),p=centre&&this.project(centre);
      if(p){
        this.selectHandle.hidden=false;this.selectHandle.style.left=p.x+'px';this.selectHandle.style.top=p.y+'px';
        this.selectHandle.textContent=this.groupIds.length>1?'✥ '+this.groupIds.length:'✥';
      }
      if(this.groupIds.length>1){
        const valid=this.eligibleVisible(),chosen=this.groupIds.map(id=>valid.find(n=>n.id===id)).filter(Boolean);
        if(chosen.length>1){
          const hull=convexHull(chosen.map(n=>[n.position[0],n.position[2]]));
          const screenPts=hull.map(pt=>this.project([pt[0],this.planeY(),pt[1]])).filter(Boolean);
          if(screenPts.length>=3){
            const hullSvg=document.createElementNS('http://www.w3.org/2000/svg','polygon');
            hullSvg.setAttribute('points',screenPts.map(pt=>pt.x+','+pt.y).join(' '));
            hullSvg.setAttribute('class','strategy-group-hull');
            this.overlay.append(hullSvg);
          }
        }
      }
      if(this.gesture?.type==='marquee'){const d=this.gesture;const b=document.createElementNS('http://www.w3.org/2000/svg','rect');
        b.setAttribute('x',String(Math.min(d.start[0],d.current[0])));b.setAttribute('y',String(Math.min(d.start[1],d.current[1])));
        b.setAttribute('width',String(Math.abs(d.start[0]-d.current[0])));b.setAttribute('height',String(Math.abs(d.start[1]-d.current[1])));
        b.setAttribute('class','strategy-marquee');this.overlay.append(b);}
    }
    if(this.getView().kind!=='system'&&this.getState().layers?.territories){
      for(const r of this.visibleRegions()){
        const c=polygonCentroid(r.points);
        const pos=this.project([c[0],this.planeY(),c[1]]);
        if(pos){
          const badge=document.createElement('div');
          badge.className='strategy-region-badge'+(r.id===this.regionId?' active':'');
          badge.style.left=pos.x+'px';badge.style.top=pos.y+'px';
          const nSpan=document.createElement('span');nSpan.className='region-badge-name';nSpan.textContent=r.name;
          const aSpan=document.createElement('span');aSpan.className='region-badge-sub';aSpan.textContent=`PROVISIONAL · ${r.affiliation||'UNASSIGNED'}`;
          const report=regionReport(this.getState(),r);
          const pSpan=document.createElement('span');pSpan.className='region-badge-posture';pSpan.textContent=report.posture;
          badge.append(nSpan,aSpan,pSpan);
          badge.addEventListener('click',e=>{e.stopPropagation();this.setMode('region');this.selectRegion(r.id);});
          this.badgeLayer.append(badge);
        }
      }
    }
    if(this.mode!=='region')return;
    const region=this.visibleRegions().find(r=>r.id===this.regionId);
    const pts=this.drawing?this.drawingPoints:this.dragVertices?.candidate||region?.points;
    if(pts?.length){const svg=document.createElementNS('http://www.w3.org/2000/svg',pts.length>=3?'polygon':'polyline');
      svg.setAttribute('points',pts.map(p=>this.project([p[0],this.planeY(),p[1]])).filter(Boolean).map(p=>p.x+','+p.y).join(' '));
      svg.setAttribute('class',this.drawing?'strategy-draw-preview':'strategy-region-guides');this.overlay.append(svg);}
    if(!region||this.drawing)return;
    region.points.forEach((point,i)=>{
      const pos=this.project([point[0],this.planeY(),point[1]]);if(!pos)return;
      const h=document.createElement('button');h.type='button';h.className='strategy-vertex';h.textContent=String(i+1);
      h.title=`Vertex ${i+1}: [${point[0].toFixed(1)}, ${point[1].toFixed(1)}] · Drag to move · Right-click or Alt-click to remove`;
      h.style.left=pos.x+'px';h.style.top=pos.y+'px';h.dataset.vertexIndex=String(i);
      h.setAttribute('aria-label','Vertex '+(i+1));
      h.addEventListener('pointerdown',e=>this.vertexDown(e,i));h.addEventListener('pointermove',e=>this.vertexMove(e));
      h.addEventListener('pointerup',e=>this.vertexUp(e));h.addEventListener('pointercancel',()=>this.cancelGesture());
      h.addEventListener('contextmenu',e=>{
        e.preventDefault();e.stopPropagation();
        const r=this.visibleRegions().find(x=>x.id===this.regionId);
        if(r&&r.points.length<=3){
          this.onMessage('A polygon region requires at least 3 vertices.',true);
          return;
        }
        this.removeVertex(i);
        this.onMessage(`Removed vertex ${i+1}. Undo available.`);
      });
      this.vertexLayer.append(h);
    });
  }
  renderRegions(){
    if(!this.engine)return;
    const state=this.getState(),view=this.getView(),regions=this.visibleRegions();
    const active=this.opened&&this.mode==='region'?this.regionId:null;
    // The editor owns GPU meshes. Selection/UI changes must not destroy and
    // recreate unchanged geometry; engine rebuild detachment invalidates cache.
    const key=JSON.stringify([view.kind,view.id,state.layers.territories,active,
      regions.map(r=>[r.id,r.color,r.points])]);
    if(this.regionGroup?.parent===this.engine.group&&this.regionRenderKey===key)return;
    if(this.regionGroup){if(this.regionGroup.parent)this.regionGroup.parent.remove(this.regionGroup);
      this.regionGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.regionGroup=null;}
    this.regionRenderKey=key;
    if(!state.layers.territories||!regions.length)return;
    const group=new THREE.Group();group.name='editorial-draft-regions';group.renderOrder=-1;this.regionGroup=group;
    this.regionRebuilds++;
    const floorY=-19;
    for(const r of regions){
      if(r.points.length<3)continue;
      const isSelected=r.id===active;
      const shape=new THREE.Shape();shape.moveTo(r.points[0][0],-r.points[0][1]);
      for(const [x,z] of r.points.slice(1))shape.lineTo(x,-z);shape.closePath();
      const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);
      const fill=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:r.color,side:THREE.DoubleSide,transparent:true,opacity:isSelected?.24:.11,depthWrite:false,depthTest:true}));
      fill.position.y=this.planeY();fill.renderOrder=-1;group.add(fill);
      const coords=r.points.map(([x,z])=>new THREE.Vector3(x,this.planeY()+.08,z));coords.push(coords[0].clone());
      const border=new THREE.Line(new THREE.BufferGeometry().setFromPoints(coords),new THREE.LineBasicMaterial({color:r.color,transparent:true,opacity:isSelected?.98:.75,depthWrite:false}));
      border.renderOrder=1;group.add(border);
      if(isSelected){
        const accentCoords=r.points.map(([x,z])=>new THREE.Vector3(x,this.planeY()+.14,z));accentCoords.push(accentCoords[0].clone());
        const accentBorder=new THREE.Line(new THREE.BufferGeometry().setFromPoints(accentCoords),new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.55,depthWrite:false}));
        accentBorder.renderOrder=2;group.add(accentBorder);
      }
      // These are active edit affordances, not permanent strategic structures.
      // Avoid 2 GPU objects per vertex across every unselected region.
      if(isSelected)for(const [vx,vz] of r.points){
        const pinPts=[new THREE.Vector3(vx,this.planeY(),vz),new THREE.Vector3(vx,floorY,vz)];
        const pinLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pinPts),new THREE.LineBasicMaterial({color:r.color,transparent:true,opacity:isSelected?.45:.22,depthWrite:false}));
        pinLine.renderOrder=0;pinLine.name='editorial-sector-pin';group.add(pinLine);
        const anchor=new THREE.Mesh(new THREE.RingGeometry(.7,1.1,16),new THREE.MeshBasicMaterial({color:r.color,side:THREE.DoubleSide,transparent:true,opacity:isSelected?.6:.25,depthWrite:false}));
        anchor.rotation.x=-Math.PI/2;anchor.position.set(vx,floorY+.05,vz);anchor.renderOrder=0;anchor.name='editorial-sector-pin';group.add(anchor);
      }
    }
    this.engine.group.add(group);
  }
  renderRegionList(){const box=this.$('strategyRegionList'),frag=document.createDocumentFragment();
    for(const r of this.visibleRegions()){
      const b=document.createElement('button');b.type='button';b.className='strategy-sector-row';b.dataset.regionId=r.id;
      b.classList.toggle('active',r.id===this.regionId);b.textContent=r.name;
      b.title='Editable draft sector – no canonical jurisdiction';b.addEventListener('click',()=>this.selectRegion(r.id));frag.append(b);
    }
    if(!frag.childNodes.length){const span=document.createElement('p');span.textContent='No drafted survey sectors in this tier.';frag.append(span);}
    box.replaceChildren(frag);
  }
  selectRegion(id){this.cancelDrawing();this.cancelGesture();this.regionId=this.visibleRegions().find(r=>r.id===id)?.id||null;this.renderRegions();this.renderRegionList();this.fillRegion();this.updateGuides();}
  fillRegion(){const r=this.visibleRegions().find(x=>x.id===this.regionId);
    this.$('strategyRegionForm').hidden=!r;
    this.$('strategyRegionEmpty').hidden=!!r;
    if(!r)return;
    this.$('strategyRegionName').value=r.name;this.$('strategyRegionAffiliation').value=r.affiliation;
    this.$('strategyRegionColor').value=r.color;
    const list=this.$('strategyVertexList');const frag=document.createDocumentFragment();
    r.points.forEach((p,i)=>{const row=document.createElement('div');row.className='strategy-vertex-row';row.dataset.vertex=String(i);
      const label=document.createElement('span');label.textContent='V'+(i+1);
      for(const [coord,axis] of [[p[0],'x'],[p[1],'z']]){const input=document.createElement('input');input.type='number';input.step='any';input.min='-10000';input.max='10000';input.value=String(coord);input.required=true;input.dataset.axis=axis;input.setAttribute('aria-label','Vertex '+(i+1)+' '+axis.toUpperCase());row.append(input);}
      const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Remove this vertex';del.disabled=r.points.length<=3;
      del.addEventListener('click',()=>this.removeVertex(i));row.prepend(label);row.append(del);frag.append(row);
    });list.replaceChildren(frag);
    const analysis=strategicAnalysis(this.getState(),r);
    this.$('strategyRegionMetrics').textContent=`${analysis.count} nodes · ${analysis.internal} internal corridors · ${analysis.frontier} frontier links · ${analysis.displayArea.toFixed(1)} display²`;
    const postureEl=this.$('strategyRegionPosture');
    if(postureEl)postureEl.textContent=`TOPOLOGICAL POSTURE: ${analysis.posture}`;
    const analysisEl=this.$('strategyRegionAnalysis');
    if(analysisEl){
      analysisEl.innerHTML=`
        <div class="analysis-cell"><span class="cell-val">${(analysis.density*100).toFixed(1)}</span><span class="cell-lbl">DENSITY / 100 DU²</span></div>
        <div class="analysis-cell"><span class="cell-val">${(analysis.cohesionIndex*100).toFixed(0)}%</span><span class="cell-lbl">COHESION</span></div>
        <div class="analysis-cell"><span class="cell-val">${analysis.frontierExposure.toFixed(2)}</span><span class="cell-lbl">FRONTIER EXP.</span></div>
        <div class="analysis-cell"><span class="cell-val">${(analysis.enclosedCorridorRatio*100).toFixed(0)}%</span><span class="cell-lbl">INTERNAL LINK</span></div>
      `;
    }
    const landmarksEl=this.$('strategyRegionLandmarks');
    if(landmarksEl){
      if(analysis.referenceLandmarks?.length){
        landmarksEl.hidden=false;
        landmarksEl.innerHTML=`<div class="strategy-containment-alert"><span class="containment-icon">🔒</span><div><strong>CANONICAL SOURCE ANCHOR ENCLOSED</strong><p>${analysis.referenceLandmarks.join(', ')} is an immutable reference anchor. Editorial sectors cannot establish sovereign jurisdiction or claim canonical territory.</p></div></div>`;
      }else{landmarksEl.hidden=true;}
    }
    const enclosedList=this.$('strategyEnclosedList');
    if(enclosedList){
      enclosedList.replaceChildren();
      const stateNodes=this.getState().nodes;
      for(const id of analysis.memberIds){
        const node=stateNodes.find(n=>n.id===id);if(!node)continue;
        const chip=document.createElement('button');chip.type='button';chip.className='strategy-chip';
        chip.textContent=node.name;chip.title=`Draft node [${node.name}]. Click to inspect in group mode.`;
        chip.addEventListener('click',()=>{this.setMode('group');this.applyGroup([id]);});
        enclosedList.append(chip);
      }
      if(!analysis.memberIds.length){
        const emptySpan=document.createElement('span');emptySpan.style.color='#7298a8';emptySpan.style.fontSize='9px';
        emptySpan.textContent='No draft nodes enclosed in perimeter.';enclosedList.append(emptySpan);
      }
    }
  }
  readVertices(){return [...this.$('strategyVertexList').querySelectorAll('.strategy-vertex-row')].map(row=>[Number(row.querySelector('input[data-axis="x"]').value),Number(row.querySelector('input[data-axis="z"]').value)]);}
  saveRegion(e){e.preventDefault();const r=this.visibleRegions().find(x=>x.id===this.regionId);if(!r)return;
    const name=this.$('strategyRegionName').value.trim(),affiliation=this.$('strategyRegionAffiliation').value.trim(),color=this.$('strategyRegionColor').value;
    const points=this.readVertices(),failure=validatePolygon(points);
    if(failure){this.onMessage(failure,true);return;}
    if(!name||name.length>100||affiliation.length>100){this.onMessage('Invalid draft sector metadata.',true);return;}
    this.onChange(s=>{const item=s.regions.find(x=>x.id===r.id);Object.assign(item,{name,affiliation,color,points});});
    this.onMessage('Draft sector updated; one undo step.');
  }
  addVertex(){const r=this.visibleRegions().find(x=>x.id===this.regionId);if(!r||r.points.length>=MAX_VERTICES)return;
    const a=r.points[0],b=r.points[1];const point=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    this.onChange(s=>{s.regions.find(x=>x.id===r.id).points.splice(1,0,point);});
  }
  removeVertex(index){const r=this.visibleRegions().find(x=>x.id===this.regionId);if(!r||r.points.length<=3)return;
    this.onChange(s=>{s.regions.find(x=>x.id===r.id).points.splice(index,1);});
  }
  deleteRegion(){const r=this.visibleRegions().find(x=>x.id===this.regionId);if(!r)return;
    if(!window.confirm('Delete this editorial draft sector? Undo restores it.'))return;
    this.onChange(s=>deleteObject(s,r.id,{type:'region'}),{immediate:true});this.regionId=null;this.sync();
  }
  selectEnclosed(){
    const r=this.visibleRegions().find(x=>x.id===this.regionId);if(!r)return;
    const report=regionReport(this.getState(),r);
    if(!report.memberIds.length){this.onMessage('No draft nodes enclosed in this region perimeter.',true);return;}
    this.setMode('group');this.applyGroup(report.memberIds);
    this.onMessage(`Selected ${report.memberIds.length} enclosed draft node(s). Move with handle or nudge.`);
  }
  frameRegion(){
    const r=this.visibleRegions().find(x=>x.id===this.regionId);if(!r||!this.engine)return;
    const bounds=polygonBounds(r.points);
    const maxDim=Math.max(bounds.width,bounds.depth,20);
    const distance=Math.max(maxDim*1.4,45);
    const targetPos=new THREE.Vector3(bounds.centerX,this.planeY(),bounds.centerZ);
    const camPos=new THREE.Vector3(bounds.centerX,this.planeY()+distance*.85,bounds.centerZ+distance*1.05);
    this.engine.transitionCamera(camPos,targetPos,700);
    this.onMessage(`Framed boundary of ${r.name}.`);
  }
  createFromGroup(){try{
    const item=regionFromGroup(this.getState(),this.groupIds,this.getView());
    if(this.getState().regions?.length>=MAX_REGIONS)throw Error('Region limit reached');
    if(!this.onChange(s=>{(s.regions??=[]).push(item);}))return;this.setMode('region');this.selectRegion(item.id);
    this.onMessage('Draft survey boundary created from selected markers. No sovereign territory asserted.');
  }catch(e){this.onMessage(e.message,true);}}
  startDrawing(){if(this.getView().kind==='system'){this.onMessage('Region polygons are supported at cosmic and galactic scales.',true);return;}
    this.cancelGesture();this.drawing=true;this.drawingPoints=[];this.$('strategyFinishDraw').disabled=true;this.$('strategyDrawHint').textContent='Tap 3–24 vertices on the map. Enter/FINISH creates a draft polygon, Backspace removes last, ESC discards.';
    this.updateGuides();
  }
  finishDrawing(){if(!this.drawing)return;const failure=validatePolygon(this.drawingPoints);if(failure){this.onMessage(failure,true);return;}
    if(this.getState().regions?.length>=MAX_REGIONS){this.onMessage('Region limit reached',true);return;}
    const used=new Set([...(this.getState().regions||[]).map(x=>x.id),...this.getState().nodes.map(x=>x.id)]);
    let id;do{id='survey-sector-'+Math.random().toString(36).slice(2,9);}while(used.has(id));
    const r={id,name:'NEW SURVEY SECTOR',affiliation:'UNASSIGNED / PROVISIONAL',parentId:this.getView().kind==='all'?null:this.getView().id,
      status:'draft',color:'#58ccf2',points:this.drawingPoints.map(p=>[...p])};
    this.cancelDrawing();if(!this.onChange(s=>{(s.regions??=[]).push(r);}))return;this.selectRegion(id);
    this.onMessage('Editorial polygon saved. No political claim made.');
  }
  cancelDrawing(){this.drawing=false;this.drawingPoints=[];this.$('strategyFinishDraw').disabled=true;
    this.$('strategyDrawHint').textContent='Draw a provisional boundary, or select one to edit its vertices.';this.updateGuides();}
  canvasDown(e){if(!this.opened||this.mode!=='group'||!e.isPrimary||e.button!==0)return;
    const r=this.canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;
    this.gesture={type:'marquee',pointer:e.pointerId,start:[x,y],current:[x,y],moved:false,additive:!!e.shiftKey};
  }
  canvasMove(e){if(this.gesture?.type!=='marquee'||this.gesture.pointer!==e.pointerId)return;
    const r=this.canvas.getBoundingClientRect();this.gesture.current=[e.clientX-r.left,e.clientY-r.top];
    if(Math.hypot(this.gesture.current[0]-this.gesture.start[0],this.gesture.current[1]-this.gesture.start[1])>10)this.gesture.moved=true;
    if(this.gesture.moved){e.preventDefault();this.updateGuides();}
  }
  canvasUp(e){
    if(!this.opened)return;
    if(this.mode==='region'&&this.drawing&&e.isPrimary&&e.button===0){const pos=this.pickPlane(e,this.planeY());
      if(pos&&this.drawingPoints.length<MAX_VERTICES){this.drawingPoints.push([Math.min(10000,Math.max(-10000,pos.x)),Math.min(10000,Math.max(-10000,pos.z))]);
        this.$('strategyFinishDraw').disabled=this.drawingPoints.length<3;
        this.$('strategyDrawHint').textContent=`Drawing provisional region: ${this.drawingPoints.length} vertices. Tap to place, Backspace to undo, Enter to finish, ESC to cancel.`;
        this.updateGuides();}return;}
    const d=this.gesture;if(d?.type!=='marquee'||d.pointer!==e.pointerId)return;this.gesture=null;
    if(d.moved){const x0=Math.min(d.start[0],d.current[0]),x1=Math.max(d.start[0],d.current[0]),y0=Math.min(d.start[1],d.current[1]),y1=Math.max(d.start[1],d.current[1]);
      const selected=this.eligibleVisible().filter(n=>{const p=this.project(n.position);return p&&p.x>=x0&&p.x<=x1&&p.y>=y0&&p.y<=y1;}).map(n=>n.id);
      this.applyGroup(d.additive?[...new Set([...this.groupIds,...selected])]:selected);
      this.onMessage(selected.length+' editable marker(s) enclosed.');
    }
    this.updateGuides();
  }
  groupAxis(){return this.$('strategyGroupAxis').value;}
  groupSnap(){return Number(this.$('strategyGroupSnap').value);}
  commitGroupDelta(delta){if(!this.groupIds.length)return;
    try{const results=translatedGroup(this.getState(),this.groupIds,this.getView(),delta,this.groupSnap());
      if(results.every(u=>u.position.every((v,i)=>v===this.getState().nodes.find(n=>n.id===u.id).position[i])))return;
      this.onChange(s=>{for(const update of results)s.nodes.find(n=>n.id===update.id).position=update.position;});
      this.onMessage('Group translated in one undoable draft edit.');
    }catch(e){this.onMessage(e.message,true);}
  }
  startGroupDrag(e){if(!this.opened||this.mode!=='group'||!e.isPrimary||e.button!==0)return;
    const centre=this.groupCentre();if(!centre)return;
    const start=this.pickPlane(e,centre[1]);if(!start&&this.groupAxis()!=='y'){this.onMessage('Camera is parallel to the plane; switch to height axis.',true);return;}
    e.preventDefault();e.stopPropagation();this.gesture={type:'group',pointer:e.pointerId,centre,origin:[e.clientX,e.clientY],start,delta:[0,0,0],moved:false};
    this.engine.controls.enabled=false;this.selectHandle.setPointerCapture(e.pointerId);this.readout.hidden=false;
  }
  moveGroupDrag(e){const d=this.gesture;if(d?.type!=='group'||d.pointer!==e.pointerId)return;e.preventDefault();
    const events=(typeof e.getCoalescedEvents==='function')?e.getCoalescedEvents():[e];
    const ev=events.length?events[events.length-1]:e;
    if(Math.hypot(ev.clientX-d.origin[0],ev.clientY-d.origin[1])<4)return;
    d.moved=true;
    if(this.groupAxis()==='y'){const distance=this.engine.camera.position.distanceTo(this.engine.controls.target);d.delta=[0,(d.origin[1]-ev.clientY)*Math.max(.04,distance/460),0];}
    else {const next=this.pickPlane(ev,d.centre[1]);if(!next)return;d.delta=[next.x-d.start.x,0,next.z-d.start.z];}
    const steps=this.groupSnap(),updates=translatedGroup(this.getState(),this.groupIds,this.getView(),d.delta,steps);
    const next=updates.reduce((p,u)=>p.map((v,i)=>v+u.position[i]/updates.length),[0,0,0]);
    const projection=this.project(next);if(projection){this.selectHandle.style.left=projection.x+'px';this.selectHandle.style.top=projection.y+'px';}
    this.readout.hidden=false;this.readout.textContent=`GROUP ${updates.length} / Δ ${d.delta.map(v=>v.toFixed(1)).join(' / ')} display units`;
  }
  endGroupDrag(e){const d=this.gesture;if(d?.type!=='group'||d.pointer!==e.pointerId)return;
    const delta=d.delta,moved=d.moved;this.cancelGesture();if(moved)this.commitGroupDelta(delta);
  }
  vertexDown(e,index){if(!this.opened||this.mode!=='region'||!e.isPrimary)return;
    const r=this.visibleRegions().find(x=>x.id===this.regionId);if(!r)return;
    const isErase=e.altKey||(e.pointerType==='pen'&&(e.button===2||e.buttons===2));
    if(isErase){
      e.preventDefault();e.stopPropagation();
      if(r.points.length<=3){
        this.onMessage('A polygon region requires at least 3 vertices.',true);
        return;
      }
      this.removeVertex(index);
      this.onMessage(`Removed vertex ${index+1}. Undo available.`);
      return;
    }
    if(e.button!==0)return;
    e.preventDefault();e.stopPropagation();this.dragVertices={pointer:e.pointerId,pointerType:e.pointerType||'mouse',id:r.id,index,candidate:r.points.map(p=>[...p]),start:[e.clientX,e.clientY]};
    e.currentTarget.setPointerCapture(e.pointerId);if(this.engine)this.engine.controls.enabled=false;
  }
  vertexMove(e){const d=this.dragVertices;if(!d||d.pointer!==e.pointerId)return;e.preventDefault();
    const events=(typeof e.getCoalescedEvents==='function')?e.getCoalescedEvents():[e];
    const ev=events.length?events[events.length-1]:e;
    const p=this.pickPlane(ev,this.planeY());if(!p)return;
    d.candidate[d.index]=[Math.max(-10000,Math.min(10000,p.x)),Math.max(-10000,Math.min(10000,p.z))];
    const screen=this.project([d.candidate[d.index][0],this.planeY(),d.candidate[d.index][1]]);
    if(screen){e.currentTarget.style.left=screen.x+'px';e.currentTarget.style.top=screen.y+'px';}
    this.updatePreviewOnly(d.candidate);
  }
  updatePreviewOnly(points){this.overlay.replaceChildren();const svg=document.createElementNS('http://www.w3.org/2000/svg','polygon');
    svg.setAttribute('points',points.map(p=>this.project([p[0],this.planeY(),p[1]])).filter(Boolean).map(p=>p.x+','+p.y).join(' '));
    svg.setAttribute('class','strategy-region-guides');this.overlay.append(svg);
  }
  vertexUp(e){const d=this.dragVertices;if(!d||d.pointer!==e.pointerId)return;
    const p=d.candidate,old=this.visibleRegions().find(x=>x.id===d.id)?.points;
    this.cancelGesture();const failure=validatePolygon(p);
    if(failure){this.onMessage('Vertex change refused: '+failure,true);return;}
    if(JSON.stringify(old)!==JSON.stringify(p)){this.onChange(s=>{s.regions.find(x=>x.id===d.id).points=p;});this.onMessage('Polygon vertex moved; undo available.');}
  }
  cancelGesture(){this.gesture=null;this.dragVertices=null;this.readout.hidden=true;
    try{if(this.selectHandle.hasPointerCapture?.(0))this.selectHandle.releasePointerCapture(0);}catch{}
    if(this.engine)this.engine.controls.enabled=!this.opened||this.mode==='pan';this.updateGuides();
  }
  dispose(){this.close();this.canvas.removeEventListener('pointerdown',this._down);this.canvas.removeEventListener('pointermove',this._move);
    this.canvas.removeEventListener('pointerup',this._up);this.canvas.removeEventListener('pointercancel',this._cancel);
    if(this.engine)this.engine.controls.removeEventListener('change',this._onCamera);
    window.removeEventListener('resize',this._resize);document.removeEventListener('keydown',this._keys,true);
    this.selectHandle.remove();this.vertexLayer.remove();this.badgeLayer.remove();this.overlay.remove();this.readout.remove();
    if(this.regionGroup){this.regionGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.regionGroup.removeFromParent();}}
}
