import * as THREE from 'three';
import {ERA_IDS, compareEras, eraSummary} from './temporal-model.js';
import {EPOCHS} from './atlas-data.js';
import {CANON_CHRONOLOGY_MILESTONES} from './canon-registry.js';

const $ = id => document.getElementById(id);
const elem = (tag, cls='', value='') => {
  const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;
};
const labelFor=id=>EPOCHS.find(e=>e.id===id)?.title||id;

/** Read-only projection of difference markers. Three.js retains sole render-loop ownership. */
export class TemporalLab {
  constructor({canvas,atlas,panel,getState,getView,message,onSwitch,onCopy,onNote}) {
    Object.assign(this,{canvas,atlas,panel,getState,getView,message,onSwitch,onCopy,onNote});
    this.opened=false;this.engine=null;this.baseline='war';this.showGhosts=true;
    this.svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    this.svg.classList.add('temporal-overlay');this.svg.setAttribute('aria-hidden','true');
    this.svg.hidden=true;canvas.parentElement.append(this.svg);
    $('temporalClose').addEventListener('click',()=>this.close());
    $('temporalCompare').addEventListener('change',e=>{this.baseline=e.target.value;this.sync();});
    $('temporalScrub').addEventListener('input',e=>{
      const epoch=ERA_IDS[Number(e.target.value)];if(epoch&&epoch!==this.getState().epoch)this.onSwitch(epoch);
    });
    $('temporalGhost').addEventListener('change',e=>{this.showGhosts=e.target.checked;this.updateOverlay();});
    $('temporalCloneBtn').addEventListener('click',()=>{
      const active=this.getState().epoch;
      if(active===this.baseline){this.message('Choose a different comparison era first.',true);return;}
      if(!confirm(`Replace ALL provisional geometry in ${labelFor(this.baseline)} with the current ${labelFor(active)} draft? You can Undo.`))return;
      this.onCopy(active,this.baseline);
    });
    $('temporalSaveNote').addEventListener('click',()=>this.onNote(this.getState().epoch,$('temporalNote').value));
    $('temporalJump').addEventListener('click',()=>this.onSwitch(this.baseline));
    this.resizeHandler=()=>this.updateOverlay();window.addEventListener('resize',this.resizeHandler);
  }
  attachEngine(engine) {
    if(this.engine&&this.changeHandler)this.engine.controls.removeEventListener('change',this.changeHandler);
    this.engine=engine;this.changeHandler=()=>this.updateOverlay();
    engine.controls.addEventListener('change',this.changeHandler);
  }
  open() {this.opened=true;this.panel.hidden=false;this.atlas.classList.add('temporal-open');
    $('temporalOpen').setAttribute('aria-expanded','true');this.sync();}
  close() {this.opened=false;this.panel.hidden=true;this.atlas.classList.remove('temporal-open');
    this.svg.hidden=true;this.svg.replaceChildren();$('temporalOpen').setAttribute('aria-expanded','false');}
  sync() {
    if(!this.opened || !this.getState().timeline)return;
    const state=this.getState(),t=state.timeline;
    $('temporalActive').textContent=labelFor(state.epoch).toUpperCase();
    $('temporalScrub').value=String(ERA_IDS.indexOf(state.epoch));
    $('temporalCompare').value=this.baseline;
    $('temporalCloneBtn').disabled=this.baseline===state.epoch;
    $('temporalJump').disabled=this.baseline===state.epoch;
    $('temporalNote').value=t.notes[state.epoch];

    const activeEpochObj = EPOCHS.find(e => e.id === state.epoch);
    const eraInfoRoot = $('temporalEraInfo');
    if (eraInfoRoot && activeEpochObj) {
      eraInfoRoot.replaceChildren();
      const meta = elem('div', 'temporal-era-meta');
      meta.append(
        elem('span', 'temporal-era-duration', activeEpochObj.duration || ''),
        elem('span', `temporal-era-badge theme-${activeEpochObj.visualTheme === 'crimson-remnant' ? 'crimson' : activeEpochObj.visualTheme === 'black-hole-lattice' ? 'blackhole' : 'archival'}`, (activeEpochObj.visualTheme || '').toUpperCase())
      );
      eraInfoRoot.append(meta);
      if (activeEpochObj.canonLocks && activeEpochObj.canonLocks.length) {
        const locksRow = elem('div', 'temporal-era-locks');
        for (const lock of activeEpochObj.canonLocks) {
          locksRow.append(elem('span', 'temporal-lock-tag', '🔒 ' + lock));
        }
        eraInfoRoot.append(locksRow);
      }
    }

    const diff=compareEras(t.snapshots[this.baseline],t.snapshots[state.epoch]);
    $('temporalStatus').textContent=diff.total?`${diff.total} DIFFERENCES / ${labelFor(this.baseline).toUpperCase()} → CURRENT`:'NO DRAFT DIFFERENCES';
    const metrics=document.createDocumentFragment();for(const [name,count] of eraSummary(diff)){
      const cell=elem('div','temporal-metric');cell.append(elem('strong','',String(count)),elem('span','',name));metrics.append(cell);
    }$('temporalMetrics').replaceChildren(metrics);
    const list=document.createDocumentFragment();
    const add=(kind,item,detail)=>{
      const div=elem('div','temporal-entry');
      div.append(elem('b','',kind),elem('span','',`${item.name||item.id||item.after?.name||'Unnamed'} · ${detail}`));
      const targetId = item.id || item.after?.id || item.before?.id;
      if (targetId) {
        div.title = `Click to focus on ${item.name || item.after?.name || targetId} in 3D`;
        div.addEventListener('click', () => {
          const n = this.getState().nodes.find(x => x.id === targetId);
          if (n && this.engine) {
            this.engine.focusOn(n);
            this.message(`Focused on ${n.name} in active era.`);
          }
        });
      }
      list.append(div);
    };
    for(const n of diff.nodes.added.slice(0,12))add('NEW',n,'object in active draft');
    for(const n of diff.nodes.removed.slice(0,12))add('ABSENT',n,'present in baseline');
    for(const item of diff.nodes.modified.slice(0,20))add('EDIT',item.after,'attributes or position');
    for(const r of diff.routes.added.slice(0,6))add('LINK',r,'new draft corridor');
    for(const r of diff.routes.removed.slice(0,6))add('MISSING LINK',r,'baseline corridor absent');
    for(const reg of diff.regions.modified.slice(0,6))add('REGION',reg.after,'draft boundary changed');
    for(const k of diff.layers)add('LAYER',{name:k},'display toggle differs');
    if(!list.childNodes.length)list.append(elem('p','temporal-empty','These two independently editable eras currently share the same draft layout.'));
    $('temporalDiffList').replaceChildren(list);

    const milestonesRoot = $('temporalMilestonesList');
    if (milestonesRoot) {
      const frag = document.createDocumentFragment();
      for (const m of CANON_CHRONOLOGY_MILESTONES) {
        const item = elem('div', 'temporal-milestone-item');
        if (m.eraId === state.epoch) item.style.borderLeftColor = '#8be7ff';
        const head = elem('div', 'temporal-milestone-head');
        head.append(elem('span', 'temporal-milestone-year', m.timeframe + ' · ' + m.title));
        const link = elem('a', 'temporal-milestone-link', 'DOSSIER ↗');
        link.href = m.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        head.append(link);
        item.append(head, elem('span', 'temporal-milestone-desc', m.detail));
        frag.append(item);
      }
      milestonesRoot.replaceChildren(frag);
    }

    this.updateOverlay(diff);
  }
  // Convert editable local scene coordinates into the current camera projection.
  project(node,view) {
    if (!node || !this.engine)return null;
    const parent=view.kind==='all'?null:view.id;
    const kind=view.kind==='all'?'galaxy':view.kind==='galaxy'?'system':'planet';
    if(node.kind!==kind || node.parentId!==parent)return null;
    this.engine.camera.updateMatrixWorld();
    const p=new THREE.Vector3(...node.position).project(this.engine.camera);
    if (p.z< -1||p.z>1||Math.abs(p.x)>1.07||Math.abs(p.y)>1.07)return null;
    const rect=this.canvas.getBoundingClientRect();
    return {x:(p.x*.5+.5)*rect.width,y:(-.5*p.y+.5)*rect.height};
  }
  updateOverlay(diff=null) {
    if(!this.opened||!this.showGhosts||!this.engine||!this.getState().timeline){
      this.svg.hidden=true;this.svg.replaceChildren();return;
    }
    const state=this.getState(),t=state.timeline;
    diff??=compareEras(t.snapshots[this.baseline],t.snapshots[state.epoch]);
    const active=t.snapshots[state.epoch],baseline=t.snapshots[this.baseline],view=this.getView();
    const container=this.canvas.getBoundingClientRect();this.svg.setAttribute('viewBox',`0 0 ${container.width||1} ${container.height||1}`);
    const shapes=[];const NS='http://www.w3.org/2000/svg';
    const shape=(tag,attrs,kind,targetNode=null)=>{
      const el=document.createElementNS(NS,tag);
      for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
      el.setAttribute('class','temporal-'+kind);
      if(targetNode){
        el.style.pointerEvents='auto';
        el.style.cursor='pointer';
        el.addEventListener('click',(ev)=>{
          ev.stopPropagation();
          const liveNode=state.nodes.find(n=>n.id===targetNode.id)||targetNode;
          if(this.engine&&liveNode){
            this.engine.focusOn(liveNode);
            this.message(`Focused on ${liveNode.name}.`);
          }
        });
      }
      shapes.push(el);
    };
    for(const item of diff.moved.slice(0,28)){
      const from=this.project(item.before,view),to=this.project(item.after,view);
      if(!from||!to)continue;
      shape('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y},'trail');
      shape('circle',{cx:from.x,cy:from.y,r:8},'ghost',item.before);
      shape('circle',{cx:to.x,cy:to.y,r:6},'current',item.after);
    }
    for(const n of diff.nodes.added.slice(0,20)){
      const p=this.project(n,view);if(p)shape('circle',{cx:p.x,cy:p.y,r:9},'added',n);
    }
    for(const n of diff.nodes.removed.slice(0,20)){
      const p=this.project(n,view);if(p)shape('circle',{cx:p.x,cy:p.y,r:9},'removed',n);
    }
    this.svg.replaceChildren(...shapes);this.svg.hidden=!shapes.length;
  }
  dispose(){this.close();window.removeEventListener('resize',this.resizeHandler);
    if(this.engine)this.engine.controls.removeEventListener('change',this.changeHandler);
    this.svg.remove();}
}
