import { AtlasEngine } from './atlas-engine.js';
import {readDraft} from './draft-recovery.js';
import {setupFullscreenAtlas} from './atlas-focus.js';
import { TemporalLab } from './temporal-lab.js';
import {ensureTimeline, syncEra, switchEra, cloneEra, writeEraNote} from './temporal-model.js';
import { StrategicStudio } from './strategic-studio.js';
import { NetworkLab } from './network-lab.js';
import { SpatialStudio } from './spatial-studio.js';
import { validateCorridor } from './studio-math.js';
import { initSourceGraph } from './source-graph-ui.js';
import { createPlannerHandoff, validateHandoff, makeHandoffFilename, getHandoffSystemMetadata } from './planner-handoff.js';
import { VERSION, STORAGE_KEY, CANON_BASE, EPOCHS, LAYERS, seedAtlas, nodeById, childNodes, ancestry, validateAtlas, sanitizeAtlas, normalizeDraft, addNode, removeNode, uniqueId, RESEARCH_ANCHORS } from './atlas-data.js';
import { searchCanonEntities, findCanonEntity, listCanonGroups, CANON_INVARIANTS, CANON_REPAIR_HIGHLIGHTS, getCanonicalRelations, WORLDSVAULT_IDENTITIES, CANON_REVISION_METADATA } from './canon-registry.js';
import { getGalaxyMorphology } from './galaxy-morphology.js';
import { getStarClassification, getPlanetClassification } from './stellar-telemetry.js';
import { getNodeSigilSvg, getAssetProvenance } from './source-assets.js';

const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const gui={
  canvas:$('spaceCanvas'), labels:$('labels'),atlas:$('atlas'), left:$('leftPanel'), right:$('rightPanel'),
  source:$('sourceLinks'), layers:$('layerControls'), nodes:$('nodeList'), breadcrumb:$('breadcrumb'),
  form:$('objectForm'), search:$('search'), results:$('searchResults'), filterBar:$('searchFilterBar')
};
let state;let view={kind:'all',id:null};let engine=null;let studio=null;let strategy=null;let networkLab=null;let temporal=null;let revision=0;let pendingRoute=null;let saveTimer=null;let history=[];let redoStack=[];let pendingImportData=null;let rejectedDraftRaw=null;let sourceGraphInstance=null;let drawerController=null;let searchFilter='all';let searchSelectedIdx=-1;
function message(text,error=false){const toast=el('div','toast'+(error?' error':''),text);$('notifications').append(toast);setTimeout(()=>toast.remove(),3500);}
function updateUndoRedoButtons(){
  const u=$('undoBtn'),r=$('redoBtn');
  if(u)u.disabled=history.length===0;
  if(r)r.disabled=redoStack.length===0;
}
function bootstrapState(){
  let raw=null;
  try{raw=localStorage.getItem(STORAGE_KEY);}
  catch(e){console.warn('LocalStorage inaccessible:',e);}
  if(!raw){
    try{raw=sessionStorage.getItem(STORAGE_KEY);}
    catch(e){console.warn('SessionStorage inaccessible:',e);}
  }
  if(!raw) return seedAtlas();
  const result=readDraft(raw);
  if(result.rejectedRaw!==null){
    rejectedDraftRaw=result.rejectedRaw;
    $('savedStatus').textContent='RECOVERY REQUIRED';
    message('Stored JSON rejected. Open EXPLORE to download the original before replacing it.',true);
  }
  return result.state;
}
state=bootstrapState();
ensureTimeline(state);
function writeDraftNow(){
  if(rejectedDraftRaw!==null){$('savedStatus').textContent='RECOVERY REQUIRED';return false;}
  try{
    state.updatedAt=new Date().toISOString();
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    $('savedStatus').textContent='DRAFT SAVED';
    return true;
  }catch(e){
    try{
      sessionStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      $('savedStatus').textContent='SESSION SAVED (EXPORT)';
      message('Local storage quota reached; draft preserved in session. Export your JSON.',true);
    }catch(se){
      $('savedStatus').textContent='EXPORT REQUIRED';
      message('Storage full or blocked. Export your draft.',true);
    }
    return false;
  }
}
function flushPendingSave(){
  if(saveTimer===null)return;
  clearTimeout(saveTimer);saveTimer=null;writeDraftNow();
}
function persist(){
  if(rejectedDraftRaw!==null){$('savedStatus').textContent='RECOVERY REQUIRED';return;}
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{saveTimer=null;writeDraftNow();},250);
}
function setupRecoveryUI(){
  if(rejectedDraftRaw===null)return;
  const tools=el('section','atlas-recovery-tools');tools.id='atlasRecoveryTools';
  tools.setAttribute('aria-label','Unreadable saved draft');
  const note=el('p','small-note','The previous local draft could not be loaded. It has NOT been overwritten. Download its exact contents before starting another saved draft.');
  const download=button('DOWNLOAD ORIGINAL JSON','button-outline',()=>{
    if(rejectedDraftRaw===null)return;
    const blob=new Blob([rejectedDraftRaw],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='starsilk-map-rejected-local-draft.json.txt';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    message('Original bytes offered for download. Stored draft is still untouched.');
  });
  const replaceDraft=button('REPLACE WITH NEW DRAFT','button-outline',()=>{
    if(!confirm('Replace the unreadable saved draft with the currently open draft? Download the original first if you need recovery.'))return;
    rejectedDraftRaw=null;tools.remove();persist();
    message('New draft selected. The old local data will be replaced.');
  });
  tools.append(note,download,replaceDraft);
  gui.left.prepend(tools);
}
function change(mutator,{geometry=true}={}){
  const prior=JSON.stringify(state);
  try{mutator();syncEra(state);const errors=validateAtlas(state);if(errors.length)throw new Error(errors[0]);}
  catch(e){state=JSON.parse(prior);message('Change rejected: '+e.message,true);return false;}
  history.push(prior);if(history.length>30)history.shift();
  redoStack=[];
  revision++;
  updateUndoRedoButtons();
  if(geometry)engine?.setState(state,view);else engine?.updateLabels();
  updateUI();persist();return true;
}
function enter(viewKind,id,preserveSelectedId=null){
  studio?.cancel();studio?.routeStop();strategy?.cancelGesture();strategy?.cancelDrawing();pendingRoute=null;
  const n=nodeById(state,id);
  if(viewKind==='galaxy'&&n?.kind!=='galaxy')return;
  if(viewKind==='system'&&n?.kind!=='system')return;
  view={kind:viewKind,id:viewKind==='all'?null:id};
  state.selected=preserveSelectedId;engine?.setView(view);updateUI();
  const name=n?.name||'THE ALL';$('savedStatus').textContent='VIEW / '+name.slice(0,14);
  if(viewKind==='galaxy'&&n)message('Entered '+n.name+': '+childNodes(state,n.id,'system').length+' provisional stellar systems mapped.');
  else if(viewKind==='system'&&n)message('Entered '+n.name+': '+childNodes(state,n.id,'planet').length+' draft planetary bodies.');
  else if(viewKind==='all')message('Ascended to The All: 7 galaxies and cosmic landmarks.');
}
function enterSelected(){const n=nodeById(state,state.selected);
  if(n?.kind==='galaxy')enter('galaxy',n.id);
  else if(n?.kind==='system')enter('system',n.id);
  else message('This object has no deeper cartographic tier.');
}
function up(){
  if(strategy?.isDrawing?.()||studio?.mode==='route'){
    message('Active drafting mode in progress. Finish or cancel (Escape) before ascending.',true);
    return;
  }
  if(view.kind==='system'){
    const sysId=view.id;
    const node=nodeById(state,view.id);
    enter('galaxy',node?.parentId,sysId);
  }else if(view.kind==='galaxy'){
    const galId=view.id;
    enter('all',null,galId);
  }else{
    state.selected=null;updateUI();
  }
}
function select(id,autoEnter=false,ev=null){
  if(strategy?.consumeSelect(id,ev))return;
  const n=nodeById(state,id);if(!n){if(id==='wall-concept')message('The Siege Wall: containment by heliocide, not ordinary masonry.');return;}
  if(studio?.mode==='route'){
    if(!pendingRoute){
      if(n.status!=='draft'||!['galaxy','system','planet'].includes(n.kind)){message('Select an editable galaxy, system or planet as corridor origin.',true);return;}
      if(!currentNodes().some(x=>x.id===id)){message('Corridor origin must be visible in the current tier.',true);return;}
      pendingRoute=id;state.selected=id;updateUI();studio.routeStart(id);
      message('Now choose another draft '+n.kind+' in this tier. Escape cancels.');return;
    }
    if(pendingRoute===id){pendingRoute=null;studio.routeStop();message('Corridor drafting cancelled.');return;}
    const source=pendingRoute, issue=validateCorridor(state,source,id);
    if(issue){message(issue,true);return;}
    const kind=$('studioRouteKind').value;
    const ok=change(()=>{state.routes.push({id:uniqueId(state,'draft-lane'),from:source,to:id,kind,status:'draft'});});
    if(ok){pendingRoute=null;studio.routeStop();state.selected=id;updateUI();message('Draft corridor committed. No physical path or canon route asserted.');}
    return;
  }
  if(view.kind==='all'&&n.parentId){
    const chain=ancestry(state,id);if(chain[0]?.kind==='galaxy'){if(n.kind==='planet'){enter('system',n.parentId);}else enter('galaxy',chain[0].id);}
  }else if(view.kind==='galaxy'&&n.kind==='planet'){enter('system',n.parentId);}
  state.selected=n.id;updateUI();
  if(autoEnter)enterSelected();
  if(innerWidth<=620)gui.right.classList.add('mobile-open');
}
function focusSelected(){const n=nodeById(state,state.selected);if(n){engine?.focusOn(n);message('Camera focused on '+n.name+'. Orbit to inspect.');}}
function button(text,cls,action){const b=el('button',cls,text);b.type='button';b.addEventListener('click',action);return b;}
function updateBreadcrumb(){
  const frag=document.createDocumentFragment();
  frag.append(button('THE ALL',view.kind==='all'?'breadcrumb-active':'',()=>enter('all',null)));
  if(view.kind!=='all'){
    for(const n of ancestry(state,view.id)){
      if(n.kind==='galaxy')frag.append(button(n.name,view.id===n.id&&view.kind==='galaxy'?'breadcrumb-active':'',()=>enter('galaxy',n.id)));
      else if(n.kind==='system')frag.append(button(n.name,view.id===n.id&&view.kind==='system'?'breadcrumb-active':'',()=>enter('system',n.id)));
    }
  }
  const resetBtn=button('⟲ RESET CAM','breadcrumb-reset',()=>{
    engine?.resetViewCamera(true);
    message('Camera reset to default.');
  });
  resetBtn.title='Reset camera framing to tier default';
  frag.append(resetBtn);
  gui.breadcrumb.replaceChildren(frag);
}
function updateLayers(){const frag=document.createDocumentFragment();
  for(const [key,label] of LAYERS){const row=el('label','layer-option');const input=el('input');input.type='checkbox';input.checked=state.layers[key];input.setAttribute('aria-label','Toggle '+label);
    input.addEventListener('change',()=>change(()=>{state.layers[key]=input.checked;}));
    row.append(input,el('span','',label),el('em','',state.layers[key]?'ON':'OFF'));frag.append(row);
  }
  gui.layers.replaceChildren(frag);
}
function currentNodes(){
  if(view.kind==='all')return childNodes(state,null).filter(n=>n.kind==='galaxy'||n.kind==='landmark'||n.kind==='annotation');
  return childNodes(state,view.id).filter(n=>view.kind==='galaxy'?['system','annotation'].includes(n.kind):['planet','annotation'].includes(n.kind));
}
function updateNodeList(){const frag=document.createDocumentFragment();for(const n of currentNodes()){
  const b=button(n.name,'node-btn'+(state.selected===n.id?' active':''),event=>select(n.id,false,event));
  b.dataset.atlasId=n.id;
  const icon=el('span','node-icon');icon.style.background=n.color;icon.style.color=n.color;b.prepend(icon);
  b.title=n.kind.toUpperCase()+' / '+(n.status==='reference'?'SOURCE IDENTITY':'DRAFT');
  frag.append(b);
}
 gui.nodes.replaceChildren(frag);
 const nlabel=view.kind==='all'?'GALAXY':view.kind==='galaxy'?'SYSTEM':'PLANET';
 $('addNodeBtn').textContent='+ ADD '+nlabel;
}
function updateRoutes(){
  const frag=document.createDocumentFragment();const inView=n=>n?.parentId===view.id;
  const visible=state.routes.filter(r=>inView(nodeById(state,r.from))&&inView(nodeById(state,r.to)));
  for(const route of visible){
    const a=nodeById(state,route.from),b=nodeById(state,route.to);
    const row=el('div','route-entry');
    const label=el('span','',(a?.name||route.from)+' / '+(b?.name||route.to));
    const mode=button(route.kind==='hookshot'?'H':'S','route-mode',()=>{change(()=>{route.kind=route.kind==='hookshot'?'starsilk':'hookshot';});});
    mode.title='Toggle illustrative Hookshot / Starsilk representation';
    const del=button('×','route-delete',()=>{change(()=>{state.routes=state.routes.filter(r=>r.id!==route.id);});});
    del.title='Remove draft corridor';del.setAttribute('aria-label','Remove corridor '+label.textContent);
    row.append(label,mode,del);frag.append(row);
  }
  if(!visible.length)frag.append(el('p','small-note','No draft corridors in this view.'));
  $('routeList').replaceChildren(frag);
}
function fillInspector(){const n=nodeById(state,state.selected);const intro=$('inspectorDescription');
  gui.form.hidden=!n;
  if(!n){$('inspectorTitle').textContent=view.kind==='all'?'A UNIVERSE IN REVISION':'INSPECT THE UNKNOWN';$('inspectorKind').textContent=view.kind.toUpperCase()+' / OBSERVATORY';
    intro.textContent=view.kind==='all'?'Many galaxies, one continuum. Choose a luminous node to open its evidence and editable draft geometry.':'Select a luminous marker to inspect it; double-click to descend one cosmic scale.';
    $('inspectorStatus').textContent='SOURCE / VISUALIZATION SEPARATED';
    $('inspectorStatus').setAttribute('aria-label','Source and visualization separated');
    $('objectSigil').style.borderColor='rgba(120,201,231,.4)';
    $('objectSigil').innerHTML='<span>&#10023;</span>';return;}
  const isRef=n.status==='reference';
  $('inspectorStatus').textContent=isRef?'CANONICAL SOURCE TOPOLOGY · IMMUTABLE · UNAUTHORED COORDINATES':(n.kind==='galaxy'?'PROVISIONAL DRAFT GALAXY · EDITABLE COORDINATES':(n.kind==='system'?'PROVISIONAL DRAFT SYSTEM · EDITABLE COORDINATES':'PROVISIONAL DRAFT OBJECT · EDITABLE COORDINATES'));
  $('inspectorStatus').setAttribute('aria-label',isRef?'Canonical source topology. Immutable read-only reference from Starsilk Dossier.':'Provisional draft object with editable cartographic coordinates.');
  $('inspectorTitle').textContent=n.name;$('inspectorKind').textContent=n.kind.toUpperCase()+' / '+(isRef?'CANON CONCEPT':'EDITORIAL DRAFT');
  if(n.kind==='galaxy'){
    const morph=getGalaxyMorphology(n);
    if(morph){
      intro.textContent+='\n\n'+`MORPHOLOGY: ${morph.name} [${morph.code}] · ${morph.arms} spiral arms · Est. ~${morph.estimatedStarsBillions}B stars · Core radius: ${morph.coreDiameterDU} DU. (${morph.classificationNotice})`;
    }
  }
  if(n.kind==='system'){
    const starInfo=getStarClassification(n);
    if(starInfo){
      intro.textContent+='\n\n'+`STELLAR CLASSIFICATION: ${starInfo.spectralType} · Surface Temp: ~${starInfo.temperatureK} K · Luminosity: ${starInfo.luminositySol} L☉. (${starInfo.notice})`;
    }
  }
  if(n.kind==='planet'&&n.parentId){
    const peers=childNodes(state,n.parentId,'planet');
    const idx=peers.findIndex(p=>p.id===n.id);
    const pInfo=getPlanetClassification(n,Math.max(0,idx));
    if(pInfo){
      intro.textContent+='\n\n'+`PLANETARY PROFILE: ${pInfo.classification} [${pInfo.badge}] · Semi-Major Axis: ~${pInfo.approxAU} AU · Orbital Period: ~${pInfo.approxPeriodDays} days · Moons: ${pInfo.hasMoons?'Detected':'None'} · Rings: ${pInfo.hasRings?'Present':'None'}. (${pInfo.notice})`;
    }else{
      const au=(0.5+Math.max(0,idx)*0.62).toFixed(2);
      const period=Math.round(365.25*Math.pow(Number(au),1.5));
      intro.textContent+='\n\n'+`HYPOTHETICAL ORBIT: ~${au} AU · ~${period} days (Keplerian sandbox period for System Planner export; not canon measurements).`;
    }
  }
  $('inspectorStatus').textContent=n.status==='reference'?'SOURCE IDENTITY / READ ONLY':'DRAFT COORDINATE / NOT CANON';
  $('objectSigil').style.borderColor=n.color;
  $('objectSigil').innerHTML=getNodeSigilSvg(n);
  $('objName').value=n.name;$('objDescription').value=n.description;
  for(const [axis,index] of [['X',0],['Y',1],['Z',2]])$('obj'+axis).value=String(n.position[index]);
  $('objColor').value=n.color;$('objSize').value=n.size;
  $('objLabelShow').checked=n.label.show;$('objLabelColor').value=n.label.color;
  $('objLabelSize').value=n.label.size;$('objLabelFamily').value=n.label.family;
  const readOnly=n.status==='reference';
  for(const field of gui.form.querySelectorAll('input,textarea,select'))field.disabled=readOnly;
  $('applyBtn').disabled=readOnly;$('enterBtn').disabled=!['galaxy','system'].includes(n.kind);
  $('deleteBtn').textContent=readOnly?'FORK AS DRAFT':'DELETE DRAFT';
  $('connectBtn').disabled=readOnly||!['galaxy','system','planet'].includes(n.kind);
}
function updateSources(){
  const frag=document.createDocumentFragment();const n=nodeById(state,state.selected);
  const canonMatch=n?(findCanonEntity(n.id)||findCanonEntity(n.name)):null;
  if(n&&(n.status==='reference'||n.id==='worldsvault'||n.id==='mother'||canonMatch)){
    const graphBtn=el('button','source-graph-launch-btn','VIEW IN WORLDSVAULT GRAPH ↗');
    graphBtn.type='button';
    graphBtn.title='Open published WorldsVault topology dialog';
    graphBtn.addEventListener('click',()=>{
      if(sourceGraphInstance)sourceGraphInstance.open(n.id);
      else $('sourceGraphOpen')?.click();
    });
    frag.append(graphBtn);
  }
  if(n?.kind==='galaxy'){
    const morph=getGalaxyMorphology(n);
    if(morph){
      const card=el('div','galaxy-telemetry-card');
      card.append(
        el('div','telemetry-title',`GALACTIC ARCHITECTURE · ${morph.name.toUpperCase()} [${morph.code}]`),
        el('div','telemetry-grid',`ARMS: ${morph.arms} · CORE RADIUS: ${morph.coreDiameterDU} DU · EST. STARS: ~${morph.estimatedStarsBillions}B`),
        el('div','telemetry-disclaimer',`CARTOGRAPHY: ${morph.classificationNotice}`)
      );
      const enterBtn=el('button','galaxy-enter-btn','ENTER GALAXY SYSTEMS ⛶');
      enterBtn.type='button';
      enterBtn.title='Descend to planetary systems within this galaxy';
      enterBtn.addEventListener('click',()=>enter('galaxy',n.id));
      card.append(enterBtn);
      frag.append(card);
    }
  }else if(n?.kind==='system'){
    const starInfo=getStarClassification(n);
    if(starInfo){
      const card=el('div','stellar-telemetry-card');
      card.append(
        el('div','telemetry-title',`STELLAR CLASSIFICATION · ${starInfo.starName}`),
        el('div','telemetry-grid',`SPECTRAL: ${starInfo.spectralType} · TEMP: ~${starInfo.temperatureK} K · LUM: ${starInfo.luminositySol} L☉`),
        el('div','telemetry-disclaimer',`EDITORIAL: ${starInfo.notice}`)
      );
      frag.append(card);
    }
  }else if(n?.kind==='planet'){
    const peers=n.parentId?childNodes(state,n.parentId,'planet'):[];
    const idx=peers.findIndex(p=>p.id===n.id);
    const pInfo=getPlanetClassification(n,Math.max(0,idx));
    if(pInfo){
      const card=el('div','stellar-telemetry-card');
      card.append(
        el('div','telemetry-title',`PLANETARY TELEMETRY · ${pInfo.planetName} [${pInfo.badge}]`),
        el('div','telemetry-grid',`CLASS: ${pInfo.classification} · ORBIT: ~${pInfo.approxAU} AU · PERIOD: ~${pInfo.approxPeriodDays} D`),
        el('div','telemetry-disclaimer',`EDITORIAL: ${pInfo.notice}`)
      );
      frag.append(card);
    }
  }
  const entries=[];
  if(n?.sourceUrl){
    entries.push({name:n.name,description:'Source-backed identity; position on this map is draft.',url:n.sourceUrl});
  }else if(canonMatch){
    entries.push({name:canonMatch.name+' (DOSSIER ↗)',description:'Canonical figure from '+canonMatch.sourcePath+' (unauthored coordinates).',url:canonMatch.humanUrl});
  }
  for(const a of RESEARCH_ANCHORS.slice(0,entries.length?2:3))entries.push(a);
  for(const a of entries){
    const link=el('a','source-item');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';
    link.append(el('strong','',a.name),el('span','',a.description));frag.append(link);
  }
  const relId=n?.id||canonMatch?.id;
  const rels=relId?getCanonicalRelations(relId):[];
  if(rels.length){
    const relSec=el('div','source-relations-section');
    relSec.append(el('div','source-relations-title','DIRECT-AUTHORED RELATIONS (TOPOLOGY ONLY)'));
    for(const r of rels){
      const chip=el('button','source-relation-chip',`${r.relation.toUpperCase()}: ${r.targetName}`);
      chip.type='button';
      chip.title='Inspect relation in WorldsVault graph';
      chip.addEventListener('click',()=>{
        if(sourceGraphInstance)sourceGraphInstance.open(relId);
        else $('sourceGraphOpen')?.click();
      });
      relSec.append(chip);
    }
    frag.append(relSec);
  }
  if(canonMatch?.drakkenMetadata){
    const d=canonMatch.drakkenMetadata;
    const card=el('div','drakken-crosswalk-card');
    card.append(
      el('div','crosswalk-title','DRAKKEN BIO-WEAPON TAXONOMY · '+d.sourceAnchor),
      el('div','crosswalk-grid',`CANDIDATE: ${d.candidateId} · TIER: ${d.threatTier} · AFFINITY: ${d.affinity}`),
      el('div','crosswalk-foot',`MATCHING: ${d.matchingState} · CANON APPROVAL: NONE (MATCHING IS NOT APPROVAL)`)
    );
    frag.append(card);
  }
  if(canonMatch){
    const repair=CANON_REPAIR_HIGHLIGHTS.find(r=>r.subject.toLowerCase().includes(canonMatch.id)||r.subject.toLowerCase().includes(canonMatch.name.toLowerCase()));
    if(repair)frag.append(el('div','source-notice-chip','CANON INVARIANT ['+repair.id+']: '+repair.subject));
  }
  if(n){
    const prov=getAssetProvenance(n);
    if(prov){
      const card=el('div','asset-provenance-card');
      card.append(
        el('div','provenance-title',`CARTOGRAPHIC VECTOR ASSET · ${prov.assetId.toUpperCase()}`),
        el('div','provenance-grid',`TYPE: ${prov.provenanceType} · SOURCE: ${prov.sourceAnchor}`),
        el('div','provenance-notice',`NOTICE: ${prov.authorityNotice}`)
      );
      frag.append(card);
    }
  }
  const isRef=n?.status==='reference'||!!canonMatch;
  const integrityCard=el('div','source-integrity-card');
  integrityCard.append(
    el('div','source-integrity-title','SOURCE COMPLETENESS & CARTOGRAPHIC HONESTY'),
    el('div','source-integrity-grid',
      `COORDINATES: ${isRef?'UNAUTHORED (PROVISIONAL PIN)':'EDITORIAL DRAFT (USER-EDITABLE)'} · `+
      `DISTANCES: UNKNOWN (NO ASTROMETRY CLAIMS) · `+
      `BORDERS: UNCLAIMED (NO FACTION EMPIRES AUTHORED)`
    ),
    el('div','source-integrity-notice',
      isRef
        ? 'HONEST CARTOGRAPHY: Canonical entities possess published relationships in the Dossier, but zero canonical 3D coordinates. Display pins are illustrative.'
        : 'HONEST CARTOGRAPHY: Draft objects are provisional sandboxes. They can be freely edited, repositioned, or exported without mutating canonical lore.'
    )
  );
  frag.append(integrityCard);
  const rev=el('div','source-revision-footer');
  rev.append(
    el('span','',`DOSSIER REF: ${CANON_REVISION_METADATA.dossierSha.slice(0,8)} · 127 STABLE IDS`),
    el('span','',`WAR: 170 YRS · S4 STRAINS: ${CANON_REVISION_METADATA.compendiumCrosswalkStrains} MAPPED`),
    el('span','source-repair-badge',`INVARIANTS: ${CANON_REVISION_METADATA.trackedRepairCount} TRACKED`)
  );
  frag.append(rev);
  gui.source.replaceChildren(frag);
}
function updateCounts(){ $('countGalaxy').textContent=String(state.nodes.filter(n=>n.kind==='galaxy').length).padStart(2,'0');
  $('countSystems').textContent=String(state.nodes.filter(n=>n.kind==='system').length).padStart(2,'0');
}
function activateEra(id){
  if(id===state.epoch)return;
  studio?.cancel();studio?.routeStop();pendingRoute=null;strategy?.close();networkLab?.close();
  const accepted=change(()=>switchEra(state,id));
  if(accepted){
    if(view.id&&!nodeById(state,view.id))enter('all',null);
    if(engine)engine.transitionEra?.();
    message('Switched independent provisional draft to '+EPOCHS.find(e=>e.id===id)?.title+'.');
  }
}
function updateEpoch(){const current=EPOCHS.find(x=>x.id===state.epoch);
  $('eraLabel').textContent=current.title.toUpperCase();const frag=document.createDocumentFragment();
  for(const e of EPOCHS){const b=button('', 'era-btn'+(e.id===state.epoch?' active':''),()=>activateEra(e.id));
    b.append(el('b','',e.title.toUpperCase()),el('span','',e.id==='war'?'BLOOD RINGS':e.id==='locking'?'CONTAINMENT':'ARCHIVE / SURVEY'));
    b.title=e.note;b.setAttribute('aria-pressed',e.id===state.epoch?'true':'false');frag.append(b);
  }
  $('eraOptions').replaceChildren(frag);
}
function currentHandoffSystem(){
  const selected=nodeById(state,state.selected);
  if(selected?.kind==='system'&&selected.status==='draft')return selected;
  const focused=view.kind==='system'?nodeById(state,view.id):null;
  return focused?.status==='draft'?focused:null;
}
function updateHandoff(){
  const system=currentHandoffSystem();
  $('handoffExportBtn').disabled=!system;
  const summaryEl=$('handoffSystemSummary');
  if(system){
    const meta=getHandoffSystemMetadata(state,system.id);
    if(summaryEl&&meta){
      summaryEl.hidden=false;
      summaryEl.replaceChildren(
        el('div','handoff-summary-item',null),
        el('div','handoff-summary-item',null)
      );
      summaryEl.children[0].append(el('span','','PRIMARY STAR'),el('strong','',meta.primaryMassSolar));
      summaryEl.children[1].append(el('span','','ORBITAL CORRIDOR'),el('strong','',`${meta.planetCount} PLANETS (${meta.orbitalSpanAu})`));
    }
    $('plannerHandoffInfo').textContent=`Ready to export ${system.name} (${childNodes(state,system.id,'planet').length} planets) as Schema 1.1.0 initial conditions.`;
  }else{
    if(summaryEl)summaryEl.hidden=true;
    $('plannerHandoffInfo').textContent='Select a draft stellar system or enter its system view. Export creates a hypothetical .ssp.json for the orbital simulator, not canon star coordinates.';
  }
}
function exportPlannerHandoff(){
  const system=currentHandoffSystem();if(!system){message('Select a draft system before orbital export.',true);return;}
  try{
    const project=createPlannerHandoff(state,system.id);
    const errors=validateHandoff(project);if(errors.length)throw new Error(errors.join('; '));
    const filename=makeHandoffFilename(project);
    const file=new Blob([JSON.stringify(project,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(file),anchor=el('a');anchor.href=url;anchor.download=filename;
    document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    message(`Exported ${filename}. Click "OPEN PLANNER ↗" and select IMPORT in the simulator.`);
    $('handoffInstructionsDialog')?.showModal();
  }catch(e){message('Orbital export refused: '+e.message,true);}
}
function updateScaleGauge(){
  const textEl=$('scaleGaugeText');
  if(!textEl)return;
  if(view.kind==='all'){
    textEl.textContent='UNIVERSAL CONTINUUM · 500 DU (~100 MLY FRAME)';
  }else if(view.kind==='galaxy'){
    const g=nodeById(state,view.id);
    textEl.textContent=`GALACTIC SECTOR · 100 DU (${g?g.name:'SECTOR'} · ~80 kLY FRAME)`;
  }else if(view.kind==='system'){
    const sys=nodeById(state,view.id);
    textEl.textContent=`STELLAR SYSTEM · ~5 AU SANDBOX (${sys?sys.name:'STAR'} · SSP COMPATIBLE)`;
  }
}
function updateUI(){
  updateBreadcrumb();updateLayers();updateNodeList();updateRoutes();fillInspector();updateSources();updateCounts();updateEpoch();updateHandoff();updateScaleGauge();updateUndoRedoButtons();
  $('quality').value=state.quality;
  $('motionBtn').textContent=state.motion?'MOTION ON':'MOTION OFF';
  $('motionBtn').setAttribute('aria-pressed',state.motion?'true':'false');
  if(state.motion===false)document.body.classList.add('reduced-motion');
  else document.body.classList.remove('reduced-motion');
  studio?.sync();strategy?.sync();networkLab?.sync();temporal?.sync();
}
function cycleSelection(delta=1){
  const nodes=currentNodes();
  if(!nodes.length)return;
  const currentIdx=nodes.findIndex(n=>n.id===state.selected);
  let nextIdx=(currentIdx+delta)%nodes.length;
  if(nextIdx<0)nextIdx+=nodes.length;
  const nextNode=nodes[nextIdx];
  if(nextNode){
    select(nextNode.id);
    if(engine)engine.focusOn(nextNode);
    message(`Selected ${nextNode.name} (${nextIdx+1}/${nodes.length}).`);
  }
}
function focusSearch(){gui.search.focus();if(innerWidth<=620)gui.left.classList.add('expanded');}
function inspectCanonEntity(c){
  state.selected=null;
  fillInspector();
  $('inspectorTitle').textContent=c.name;
  $('inspectorKind').textContent=c.group.toUpperCase()+' / CANON DOSSIER IDENTIFIER';
  $('inspectorDescription').textContent='Canonical figure/record from '+c.sourcePath+'. As an authoritative identity, it possesses no authored map coordinates in Starsilk canon.';
  $('inspectorStatus').textContent='CANONICAL IDENTITY / UNPLACED RECORD';
  $('objectSigil').style.borderColor='#8beaff';
  $('objectSigil').innerHTML=getNodeSigilSvg({id:c.id,kind:c.group==='drakken'?'drakken':'reference',color:'#52deff'});
  gui.form.hidden=true;
  const frag=document.createDocumentFragment();

  const unplacedCard=el('div','unplaced-warning-card');
  unplacedCard.append(
    el('div','unplaced-warning-header','🔒 UNPLACED CANONICAL RECORD'),
    el('div','unplaced-warning-body','Authoritative identity from Starsilk Dossier (127 Stable IDs). Coordinates remain strictly unauthored in canon; no fictional spatial coordinates or star-chart positions are inferred or invented.')
  );
  frag.append(unplacedCard);

  const mainLink=el('a','source-item');mainLink.href=c.humanUrl;mainLink.target='_blank';mainLink.rel='noopener noreferrer';
  mainLink.append(el('strong','',c.name+' ↗'),el('span','','Open authoritative Dossier record ('+c.sourcePath+')'));
  frag.append(mainLink);
  if(c.drakkenMetadata){
    const d=c.drakkenMetadata;
    const card=el('div','drakken-crosswalk-card');
    card.append(
      el('div','crosswalk-title','DRAKKEN BIO-WEAPON TAXONOMY · '+d.sourceAnchor),
      el('div','crosswalk-grid',`CANDIDATE: ${d.candidateId} · TIER: ${d.threatTier} · AFFINITY: ${d.affinity}`),
      el('div','crosswalk-foot',`MATCHING: ${d.matchingState} · CANON APPROVAL: NONE (MATCHING IS NOT APPROVAL)`)
    );
    frag.append(card);
  }
  const rels=getCanonicalRelations(c.id);
  if(rels.length){
    const relSec=el('div','source-relations-section');
    relSec.append(el('div','source-relations-title','DIRECT-AUTHORED RELATIONS (TOPOLOGY ONLY)'));
    for(const r of rels){
      const chip=el('button','source-relation-chip',`${r.relation.toUpperCase()}: ${r.targetName}`);
      chip.type='button';
      chip.title='Inspect relation in WorldsVault graph';
      chip.addEventListener('click',()=>{
        if(sourceGraphInstance)sourceGraphInstance.open(c.id);
        else $('sourceGraphOpen')?.click();
      });
      relSec.append(chip);
      const placedTarget=state.nodes.find(n=>n.id===r.targetId||n.name.toLowerCase()===r.targetName.toLowerCase());
      if(placedTarget){
        const jumpBtn=el('button','source-jump-btn',`⛶ JUMP TO MAP LANDMARK (${placedTarget.name.toUpperCase()})`);
        jumpBtn.type='button';
        jumpBtn.title=`Focus 3D camera on ${placedTarget.name}`;
        jumpBtn.addEventListener('click',()=>{
          select(placedTarget.id);
          focusSelected();
          drawerController?.open('inspect');
        });
        relSec.append(jumpBtn);
      }
    }
    frag.append(relSec);
  }
  const repair=CANON_REPAIR_HIGHLIGHTS.find(r=>r.subject.toLowerCase().includes(c.id)||r.subject.toLowerCase().includes(c.name.toLowerCase()));
  if(repair)frag.append(el('div','source-notice-chip','CANON INVARIANT ['+repair.id+']: '+repair.subject));
  for(const a of RESEARCH_ANCHORS.slice(0,2)){
    const link=el('a','source-item');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';
    link.append(el('strong','',a.name),el('span','',a.description));frag.append(link);
  }
  const rev=el('div','source-revision-footer');
  rev.append(el('span','','DOSSIER REF: 862bc476 · 127 STABLE IDS'),el('span','','CANON: 170-YR BLOOD ECLIPSE WAR'));
  frag.append(rev);
  gui.source.replaceChildren(frag);
  if(innerWidth<=850)gui.right.classList.add('mobile-open');
  drawerController?.open('inspect');
  message('Inspecting canonical record: '+c.name+' (unplaced).');
}

function setSearchFilter(filter){
  searchFilter=filter;
  const chips=document.querySelectorAll('.search-filter-chip');
  chips.forEach(c=>{c.classList.toggle('active',c.dataset.filter===filter);});
  showSearch();
}

function showSearch(){
  const q=gui.search.value.toLowerCase().trim();
  const frag=document.createDocumentFragment();
  searchSelectedIdx=-1;

  if(q){
    const mapNodes=(searchFilter==='all'||searchFilter==='map')
      ? state.nodes.filter(n=>n.name.toLowerCase().includes(q)||n.description.toLowerCase().includes(q)||n.id.toLowerCase().includes(q)||n.kind.toLowerCase().includes(q)).slice(0,15)
      : [];

    const regions=(searchFilter==='all'||searchFilter==='regions')
      ? (state.regions||[]).filter(r=>r.name.toLowerCase().includes(q)||r.id.toLowerCase().includes(q)||(r.notes&&r.notes.toLowerCase().includes(q))).slice(0,8)
      : [];

    const routes=(searchFilter==='all'||searchFilter==='routes')
      ? (state.routes||[]).filter(rt=>{
          if(rt.id.toLowerCase().includes(q)||(rt.kind&&rt.kind.toLowerCase().includes(q)))return true;
          const fromN=nodeById(state,rt.from);const toN=nodeById(state,rt.to);
          return (fromN&&fromN.name.toLowerCase().includes(q))||(toN&&toN.name.toLowerCase().includes(q));
        }).slice(0,8)
      : [];

    const canonHits=(searchFilter==='all'||searchFilter==='canon')
      ? searchCanonEntities(q).slice(0,15)
      : [];

    const totalCount=mapNodes.length+regions.length+routes.length+canonHits.length;

    if(mapNodes.length){
      frag.append(el('div','search-category-header',`MAP OBJECTS (${mapNodes.length})`));
      for(const n of mapNodes){
        const b=el('button','search-result','');
        b.type='button';b.setAttribute('role','option');
        const badgeCls=n.status==='reference'?'badge-ref':(n.kind==='galaxy'?'badge-galaxy':(n.kind==='system'?'badge-system':'badge-draft'));
        const badgeText=n.status==='reference'?'◆ TOPOLOGY':(n.kind==='galaxy'?'● GALAXY':(n.kind==='system'?'● SYSTEM':'● '+n.kind.toUpperCase()));
        const topRow=el('div','search-result-header');
        topRow.append(el('span','search-result-name',n.name),el('span',`search-badge ${badgeCls}`,badgeText));
        const sub=el('small','',`${n.kind.toUpperCase()} · Tier: ${n.parentId||'THE ALL'} · ${n.status==='reference'?'Authoritative Landmark':'Provisional Draft'}`);
        b.append(topRow,sub);
        b.addEventListener('click',()=>{
          gui.search.value='';gui.results.hidden=true;
          select(n.id);focusSelected();drawerController?.open('inspect');
        });
        frag.append(b);
      }
    }

    if(regions.length){
      frag.append(el('div','search-category-header',`STRATEGIC REGIONS (${regions.length})`));
      for(const r of regions){
        const b=el('button','search-result','');
        b.type='button';b.setAttribute('role','option');
        const topRow=el('div','search-result-header');
        topRow.append(el('span','search-result-name',r.name),el('span','search-badge badge-region','✥ REGION'));
        const sub=el('small','',`4X Draft Sector · ${r.vertices?.length||0} vertices · Parent: ${r.parent||'THE ALL'}`);
        b.append(topRow,sub);
        b.addEventListener('click',()=>{
          gui.search.value='';gui.results.hidden=true;
          drawerController?.open('regions');
          if(strategy){strategy.open();strategy.setMode('region');strategy.selectRegion(r.id);}
          message(`Selected draft region: ${r.name}. Edit vertices in Strategy Lab.`);
        });
        frag.append(b);
      }
    }

    if(routes.length){
      frag.append(el('div','search-category-header',`DRAFT CORRIDORS (${routes.length})`));
      for(const rt of routes){
        const fromN=nodeById(state,rt.from);const toN=nodeById(state,rt.to);
        const fromName=fromN?fromN.name:rt.from;const toName=toN?toN.name:rt.to;
        const b=el('button','search-result','');
        b.type='button';b.setAttribute('role','option');
        const topRow=el('div','search-result-header');
        topRow.append(el('span','search-result-name',`${fromName} ↔ ${toName}`),el('span','search-badge badge-route',`— ${rt.kind.toUpperCase()}`));
        const sub=el('small','',`Draft Corridor · ID: ${rt.id} · Kind: ${rt.kind}`);
        b.append(topRow,sub);
        b.addEventListener('click',()=>{
          gui.search.value='';gui.results.hidden=true;
          drawerController?.open('routes');
          if(networkLab){networkLab.open();networkLab.focusRoute(rt.id);}
          message(`Focused draft corridor: ${fromName} ↔ ${toName} in Network Lab.`);
        });
        frag.append(b);
      }
    }

    if(canonHits.length){
      frag.append(el('div','search-category-header',`CANON DOSSIER (${canonHits.length})`));
      for(const c of canonHits){
        const b=el('button','search-result canon-result','');
        b.type='button';b.setAttribute('role','option');
        const mapMatch=state.nodes.find(n=>n.id===c.id||n.name.toLowerCase()===c.name.toLowerCase());
        const isPlaced=!!mapMatch;
        const topRow=el('div','search-result-header');
        topRow.append(
          el('span','search-result-name',c.name),
          el('span',`search-badge badge-canon`,isPlaced?'◆ PLACED CANON':'◆ UNPLACED CANON')
        );
        let drakkenSnippet='';
        if(c.drakkenMetadata){
          drakkenSnippet=` · ${c.drakkenMetadata.candidateId} (${c.drakkenMetadata.threatTier}) · ${c.drakkenMetadata.affinity}`;
        }
        const sub=el('small','',`${c.group.toUpperCase()}${drakkenSnippet} · ${isPlaced?'Placed Landmark':'Unauthored Coordinates (No 3D Placement)'}`);
        b.append(topRow,sub);
        b.addEventListener('click',()=>{
          gui.search.value='';gui.results.hidden=true;
          if(mapMatch){select(mapMatch.id);focusSelected();drawerController?.open('inspect');}
          else{inspectCanonEntity(c);drawerController?.open('inspect');}
        });
        frag.append(b);
      }
    }

    if(totalCount===0){
      const emptyBox=el('div','search-empty-box');
      emptyBox.append(el('div','',`No objects or canon records match "${q}" in ${searchFilter.toUpperCase()}.`));
      const suggestions=el('div','search-suggestions');
      const sampleQueries=['WorldsVault','Mother','Omega','Spiral','Corridor'];
      for(const sq of sampleQueries){
        const chip=el('button','search-suggest-chip',`Try: ${sq}`);
        chip.type='button';
        chip.addEventListener('click',()=>{
          gui.search.value=sq;setSearchFilter('all');showSearch();gui.search.focus();
        });
        suggestions.append(chip);
      }
      emptyBox.append(suggestions);
      frag.append(emptyBox);
    }
  }

  gui.results.replaceChildren(frag);
  gui.results.hidden=!q;
}

function handleSearchKeydown(e){
  if(gui.results.hidden)return;
  const items=Array.from(gui.results.querySelectorAll('.search-result'));
  if(!items.length){
    if(e.key==='Escape'){gui.search.value='';gui.results.hidden=true;gui.search.blur();}
    return;
  }
  if(e.key==='ArrowDown'){
    e.preventDefault();searchSelectedIdx=(searchSelectedIdx+1)%items.length;updateSearchSelection(items);
  }else if(e.key==='ArrowUp'){
    e.preventDefault();searchSelectedIdx=(searchSelectedIdx-1+items.length)%items.length;updateSearchSelection(items);
  }else if(e.key==='Enter'){
    if(searchSelectedIdx>=0&&items[searchSelectedIdx]){e.preventDefault();items[searchSelectedIdx].click();}
  }else if(e.key==='Escape'){
    e.preventDefault();gui.search.value='';gui.results.hidden=true;gui.search.blur();
  }
}

function updateSearchSelection(items){
  items.forEach((item,idx)=>{
    const isSelected=idx===searchSelectedIdx;
    item.classList.toggle('search-selected',isSelected);
    if(isSelected){
      item.scrollIntoView({block:'nearest'});
      gui.search.setAttribute('aria-activedescendant',item.id||`search-result-${idx}`);
    }
  });
}
function addCurrentNode(kind){const parentId=kind==='galaxy'?null:view.id;
  let id;const ok=change(()=>{const n=addNode(state,kind,parentId);id=n.id;});
  if(ok){select(id);message('New '+kind+' added to the draft.');}
}
function saveInspector(ev){ev.preventDefault();const n=nodeById(state,state.selected);if(!n||n.status!=='draft')return;
  const nums=['X','Y','Z'].map(a=>Number($('obj'+a).value));const sz=Number($('objSize').value),fs=Number($('objLabelSize').value);
  if(nums.some(v=>!Number.isFinite(v))||!Number.isFinite(sz)||!Number.isFinite(fs)){message('Invalid numeric value.',true);return;}
  if(change(()=>{n.name=$('objName').value.trim();n.description=$('objDescription').value.trim();n.position=nums;
    n.color=$('objColor').value;n.size=sz;n.label={show:$('objLabelShow').checked,color:$('objLabelColor').value,size:fs,family:$('objLabelFamily').value, ...(n.label.offset?{offset:[...n.label.offset]}:{})};}))message('Draft geometry and typography updated.');
}
function removeOrFork(){const n=nodeById(state,state.selected);if(!n)return;
  if(n.status==='reference'){
    let id;change(()=>{id=uniqueId(state,'draft-reference');state.nodes.push({...structuredClone(n),id,name:n.name+' / DRAFT',status:'draft',sourceUrl:null});});
    select(id);message('Created an editable draft. The source reference remains protected.');return;
  }
  if(!confirm('Delete this draft object and any children or connected routes?'))return;
  change(()=>{removeNode(state,n.id);});message('Draft object deleted.');
}
function connectRoute(){const n=nodeById(state,state.selected);if(!n||n.status!=='draft')return;
  studio?.setMode('route');pendingRoute=n.id;studio?.routeStart(n.id);
  message('Choose another '+n.kind+' at this tier. Proposed route only; Escape cancels.');
}
function moveDraftNode(id,position){
  const n=nodeById(state,id);if(!n||n.status!=='draft')return;
  if(change(()=>{n.position=position;}))message('Draft marker repositioned. Undo available; no canon coordinates changed.');
}
function moveDraftLabel(id,offset){
  const n=nodeById(state,id);if(!n||n.status!=='draft')return;
  if(change(()=>{n.label.offset=offset;},{geometry:false}))message('Draft label offset saved. Undo available.');
}
function commitNetworkLink({from,to,kind}){
  const reason=validateCorridor(state,from,to);
  if(reason||!['hookshot','starsilk'].includes(kind)){message('Draft corridor refused: '+(reason||'Invalid corridor kind'),true);return false;}
  return change(()=>{
    let next=1,id;
    do{id='draft-network-'+next++;}while(state.routes.some(r=>r.id===id)||state.nodes.some(n=>n.id===id));
    state.routes.push({id,from,to,kind,status:'draft'});
  });
}
function exportAtlas(){syncEra(state);const data={...state,selected:null,updatedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='starsilk-map-of-the-all-draft-v'+VERSION+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message('JSON atlas exported. No canon has been changed.');
}
async function importAtlas(file){if(!file)return;if(file.size>1200000){message('JSON exceeds 1.2 MB import limit.',true);return;}
  try{
    const contents=await file.text();
    const raw=JSON.parse(contents);
    const normalized=normalizeDraft(raw);
    if(!normalized.valid)throw new Error(normalized.errors[0]||'Invalid draft schema');
    const parsed=sanitizeAtlas(normalized.data);
    pendingImportData={
      parsed,
      filename:file.name,
      filesize:(file.size/1024).toFixed(1)+' KB',
      nodeCount:parsed.nodes?.length||0,
      routeCount:parsed.routes?.length||0,
      regionCount:parsed.regions?.length||0,
      eraCount:parsed.timeline?Object.keys(parsed.timeline.snapshots).length:1
    };
    if($('importConfirmDialog')){
      $('importSummaryFile').textContent=pendingImportData.filename;
      $('importSummarySize').textContent=pendingImportData.filesize;
      $('importSummaryNodes').textContent=pendingImportData.nodeCount;
      $('importSummaryRoutes').textContent=pendingImportData.routeCount;
      $('importSummaryRegions').textContent=pendingImportData.regionCount;
      $('importSummaryEras').textContent=pendingImportData.eraCount;
      $('importConfirmDialog').showModal();
    }else{
      executeImport();
    }
  }catch(e){message('Import refused: '+e.message,true);}
}
function executeImport(){
  if(!pendingImportData)return;
  const previous=JSON.stringify(state);
  strategy?.cancelGesture();strategy?.cancelDrawing();
  studio?.cancel();studio?.routeStop();
  state=pendingImportData.parsed;
  ensureTimeline(state);
  history.push(previous);
  redoStack=[];
  view={kind:'all',id:null};
  pendingRoute=null;
  engine?.setState(state,view);
  engine?.setView(view);
  updateUI();
  updateUndoRedoButtons();
  rejectedDraftRaw=null;
  $('atlasRecoveryTools')?.remove();
  persist();
  $('importConfirmDialog')?.close();
  message(`Imported ${pendingImportData.filename}: source status intentionally demoted to draft.`);
  pendingImportData=null;
}
function undo(){if(!history.length){message('No changes to undo.');return;}
  strategy?.cancelGesture();strategy?.cancelDrawing();studio?.cancel();studio?.routeStop();pendingRoute=null;
  const current=JSON.stringify(state);
  redoStack.push(current);if(redoStack.length>30)redoStack.shift();
  state=JSON.parse(history.pop());
  if(view.id&&!nodeById(state,view.id))view={kind:'all',id:null};
  engine?.setState(state,view);updateUI();persist();updateUndoRedoButtons();message('Reverted last edit.');
}
function redo(){if(!redoStack.length){message('No changes to redo.');return;}
  strategy?.cancelGesture();strategy?.cancelDrawing();studio?.cancel();studio?.routeStop();pendingRoute=null;
  const current=JSON.stringify(state);
  history.push(current);if(history.length>30)history.shift();
  state=JSON.parse(redoStack.pop());
  if(view.id&&!nodeById(state,view.id))view={kind:'all',id:null};
  engine?.setState(state,view);updateUI();persist();updateUndoRedoButtons();message('Redone edit.');
}
function resetCamera(){engine?.setView(view);}
function toggleFocus(){gui.atlas.classList.toggle('focus-view');if(!gui.atlas.classList.contains('focus-view'))gui.right.classList.remove('mobile-open');}
function bind(){
  $('temporalOpen').addEventListener('click',()=>{networkLab?.close();strategy?.close();studio?.setMode('orbit');temporal?.open();});
  $('strategyOpen').addEventListener('click',()=>{if(!strategy)return;temporal?.close();networkLab?.close();studio?.setMode('orbit');strategy.open();});
  $('networkOpen').addEventListener('click',()=>{if(!networkLab)return;temporal?.close();studio?.setMode('orbit');strategy?.close();networkLab.open();});
  $('objectForm').addEventListener('submit',saveInspector);
  $('closeMobileInspector').addEventListener('click',()=>gui.right.classList.remove('mobile-open'));
  $('enterBtn').addEventListener('click',enterSelected);$('focusBtn').addEventListener('click',focusSelected);
  $('connectBtn').addEventListener('click',connectRoute);$('deleteBtn').addEventListener('click',removeOrFork);
  $('addNodeBtn').addEventListener('click',()=>addCurrentNode(view.kind==='all'?'galaxy':view.kind==='galaxy'?'system':'planet'));
  $('addAnnotationBtn').addEventListener('click',()=>addCurrentNode('annotation'));
  $('allLayersBtn').addEventListener('click',()=>{
    const enable=LAYERS.some(([key])=>!state.layers[key]);
    change(()=>{for(const [key] of LAYERS)state.layers[key]=enable;});
  });
  $('homeBtn').addEventListener('click',()=>enter('all',null));$('resetCameraBtn').addEventListener('click',resetCamera);
  $('topBtn').addEventListener('click',()=>{if(!engine)return;const d=engine.camera.position.distanceTo(engine.controls.target);engine.camera.position.set(engine.controls.target.x+.01,engine.controls.target.y+d,engine.controls.target.z+.01);engine.controls.update();});
  $('quality').addEventListener('change',ev=>change(()=>{state.quality=ev.target.value;}));
  $('motionBtn').addEventListener('click',()=>change(()=>{state.motion=!state.motion;},{geometry:false}));
  $('presentBtn').addEventListener('click',toggleFocus);
  $('helpBtn').addEventListener('click',()=>$('helpDialog').showModal());$('closeHelp').addEventListener('click',()=>$('helpDialog').close());
  $('undoBtn')?.addEventListener('click',undo);
  $('redoBtn')?.addEventListener('click',redo);
  $('importConfirmBtn')?.addEventListener('click',executeImport);
  $('importCancelBtn')?.addEventListener('click',()=>{
    $('importConfirmDialog')?.close();
    pendingImportData=null;
  });
  $('importBackupBtn')?.addEventListener('click',()=>{exportAtlas();});
  $('handoffExportBtn').addEventListener('click',exportPlannerHandoff);
  $('handoffHelpBtn')?.addEventListener('click',()=>$('handoffInstructionsDialog')?.showModal());
  $('closeHandoffInstructions')?.addEventListener('click',()=>$('handoffInstructionsDialog')?.close());
  $('exportBtn').addEventListener('click',exportAtlas);$('importBtn').addEventListener('click',()=>$('fileInput').click());
  $('fileInput').addEventListener('change',ev=>{importAtlas(ev.target.files?.[0]);ev.target.value='';});
  gui.search.addEventListener('input',showSearch);
  gui.search.addEventListener('keydown',handleSearchKeydown);
  gui.search.addEventListener('focus',()=>{if(innerWidth<=620)gui.left.classList.add('expanded');});
  $('searchFilterBar')?.addEventListener('click',ev=>{
    const chip=ev.target.closest('.search-filter-chip');
    if(chip&&chip.dataset.filter){setSearchFilter(chip.dataset.filter);}
  });
  document.addEventListener('pointerdown',ev=>{
    if(!ev.target.closest('.search-box')&&!ev.target.closest('.search-filter-bar')&&!ev.target.closest('.search-results')){
      gui.results.hidden=true;
    }
  });
  document.addEventListener('keydown',ev=>{
    if(ev.target?.closest?.('input,textarea,select,[contenteditable]')||$('helpDialog').open||$('sourceGraphDialog').open||$('importConfirmDialog')?.open)return;
    if((ev.ctrlKey||ev.metaKey)&&!ev.altKey){
      const k=ev.key.toLowerCase();
      if(!ev.shiftKey&&k==='z'){ev.preventDefault();undo();return;}
      if((ev.shiftKey&&k==='z')||k==='y'){ev.preventDefault();redo();return;}
    }
    if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(ev.key==='/'||ev.key==='?'){ev.preventDefault();if(ev.key==='?')$('helpDialog').showModal();else focusSearch();}
    else if(ev.key==='['||ev.key.toLowerCase()==='j'){ev.preventDefault();cycleSelection(-1);}
    else if(ev.key===']'||ev.key.toLowerCase()==='k'){ev.preventDefault();cycleSelection(1);}
    else if(ev.key==='Enter'&&state.selected&&!ev.target?.closest?.('input,textarea,select,button')){ev.preventDefault();enterSelected();}
    else if(ev.key.toLowerCase()==='h'){toggleFocus();}
    else if(ev.key.toLowerCase()==='f'){focusSelected();}
    else if(ev.key==='Escape'){ev.preventDefault();up();gui.right.classList.remove('mobile-open');}
    else if(ev.key==='Backspace'&&!ev.target?.closest?.('input,textarea,select')){ev.preventDefault();up();}
    else if(ev.key==='0'){ev.preventDefault();engine?.resetViewCamera(true);message('Camera reset to default.');}
    else if(ev.key==='Home'){enter('all',null);}
  });
  const mobile=button('INSPECT OBJECT','mobile-inspect',()=>{gui.right.classList.toggle('mobile-open');gui.left.classList.remove('expanded');});
  gui.atlas.append(mobile);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)flushPendingSave();
    if(engine)engine.paused=document.hidden||!!networkLab?.opened||!!(strategy?.opened&&strategy.mode!=='pan')||['move','label'].includes(studio?.mode);
  });
  window.addEventListener('pagehide',flushPendingSave);
  window.addEventListener('unhandledrejection',ev=>{
    console.error('Unhandled async failure in Atlas:',ev.reason);
    message('Operation failed: '+(ev.reason?.message||'Unexpected asynchronous error'),true);
  });
  window.addEventListener('error',ev=>{
    if(ev.error?.message?.includes('ResizeObserver'))return;
    console.error('Atlas runtime error:',ev.error||ev.message);
  });
}
function init(){updateUI();bind();
  try{
    sourceGraphInstance=initSourceGraph({
      onInspect3D:(id)=>{
        const targetNode=state.nodes.find(n=>n.id===id||n.name.toLowerCase()===id.toLowerCase());
        if(targetNode){
          select(targetNode.id);
          if(engine){
            engine.focusOn(targetNode);
            message('Focused 3D camera on '+targetNode.name+'.');
          }
        }
      }
    });
  }catch(e){$('sourceGraphOpen').disabled=true;message('Source topology unavailable: '+e.message,true);}
  try{engine=new AtlasEngine(gui.canvas,gui.labels,{onSelect:select,onViewChanged:updateUI});engine.setState(state,view);
    studio=new SpatialStudio({canvas:gui.canvas,labelsRoot:gui.labels,atlas:gui.atlas,panel:$('studioPanel'),
      getState:()=>state,getView:()=>view,onMove:moveDraftNode,onLabelCommit:moveDraftLabel,
      onRouteCancel:()=>{pendingRoute=null;},
      onScale:value=>change(()=>{state.typographyScale=value;},{geometry:false}),
      onModeChange:()=>{pendingRoute=null;strategy?.close();networkLab?.close();},message});studio.attachEngine(engine);
    strategy=new StrategicStudio({canvas:gui.canvas,labelsRoot:gui.labels,atlas:gui.atlas,panel:$('strategyPanel'),
      getState:()=>state,getView:()=>view,onChange:mutator=>change(()=>mutator(state)),onMessage:message});
    strategy.attachEngine(engine);
    networkLab=new NetworkLab({canvas:gui.canvas,atlas:gui.atlas,panel:$('networkPanel'),
      getState:()=>state,getView:()=>view,onCommit:commitNetworkLink,message,
      isOtherEditorActive:()=>!!(strategy?.opened&&strategy.mode!=='pan')||['move','label'].includes(studio?.mode)});
    networkLab.attachEngine(engine);
    temporal=new TemporalLab({canvas:gui.canvas,atlas:gui.atlas,panel:$('temporalPanel'),getState:()=>state,getView:()=>view,
      message,onSwitch:activateEra,
      onCopy:(from,to)=>{if(change(()=>cloneEra(state,from,to)))message('Copied current draft into '+EPOCHS.find(e=>e.id===to)?.title+'. Undo is available.');},
      onNote:(era,note)=>{if(change(()=>writeEraNote(state,era,note),{geometry:false}))message('Era note saved as editorial draft.');}});
    temporal.attachEngine(engine);updateUI();
    $('loading').style.opacity='0';setTimeout(()=>$('loading').remove(),900);
    setInterval(()=>{if(engine&&document.visibilityState==='visible')$('drawCalls').textContent=String(engine.info().drawCalls).padStart(2,'0');},1000);
    message('The All is ready. All starting coordinates remain provisional.');
  }catch(e){
    $('loading').replaceChildren(
      el('h2','','3D WEBGL ACCELERATION UNAVAILABLE'),
      el('p','','WebGL hardware acceleration is required to render the 3D cosmological atlas. You can still explore canonical source records, analyze network topology, or download your saved map draft.'),
      button('EXPORT ATLAS JSON ↗','primary-button',exportAtlas),
      button('OPEN CANON REGISTRY ◆','button-outline',()=>{if(gui.left)gui.left.classList.add('expanded');}),
      button('RETRY INITIALIZATION ↻','button-outline faint',()=>{location.reload();})
    );
    console.error('Atlas startup:',e);
  }
}
init();
drawerController=setupFullscreenAtlas();
setupRecoveryUI();
