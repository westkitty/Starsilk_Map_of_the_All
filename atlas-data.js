import {validateRegions} from './strategic-model.js';
import {deleteObject} from './deletion-engine.js';
import {validateSuppressed} from './visual-suppression.js';
import {validateTimeline, sanitizeTimeline} from './temporal-model.js';
export const VERSION = 1;
export const STORAGE_KEY = 'starsilk.map-of-the-all.draft.v1';
export const CANON_BASE = 'https://westkitty.github.io/Starsilk_Character_Dossier';
export const EPOCHS = [
  {
    id: 'war',
    title: 'Blood Eclipse War',
    duration: '170 YEARS (YEARS 0–170)',
    note: 'Blood Rings documented by Year 3; Year 121 Ruby Eclipse in Pharos. Invariant: strictly 170-year duration (not 17 years).',
    visualTheme: 'crimson-remnant',
    canonLocks: ['170-year war duration strictly locked', 'Blood Rings are vitrified remnants of destroyed worlds']
  },
  {
    id: 'locking',
    title: 'The Siege Wall is locked',
    duration: 'YEAR 170 (WAR END / PERMANENT CONTAINMENT)',
    note: 'Tiger heliocide aftermath. Invariant: Siege Wall is a starless black-hole containment lattice and cosmic absence, never a glowing magical barrier.',
    visualTheme: 'black-hole-lattice',
    canonLocks: ['Siege Wall is a black-hole containment lattice and cosmic absence', 'Heliocide triggered by Aureal Starsilk strike']
  },
  {
    id: 'post',
    title: 'Post-Siege survey',
    duration: 'CONTEMPORARY SURVEY',
    note: 'Interpretive visualization and Hookshot recovery. Invariant: Illustrative coordinates; no official galactic positions or faction borders authored.',
    visualTheme: 'archival-survey',
    canonLocks: ['No authored galaxy coordinates', 'Hookshot corridors are provisional drafts']
  },
];
export const LAYERS = [
  ['galaxies','Galactic structures'], ['stars','Stellar detail'],
  ['routes','Hookshot routes'], ['starsilk','Starsilk currents'],
  ['territories','Regional overlays'], ['wall','Siege Wall absence'],
  ['rings','Blood Ring remnants'], ['worldsvault','WorldsVault references'],
  ['annotations','Annotations'], ['labels','Typography'], ['grid','Coordinate guides'],
];
export const DEFAULT_LAYERS = Object.fromEntries(LAYERS.map(([key])=>[key,key!=='grid']));
const galaxyDefs = [
  ['north-reach','NORTH REACH',-52,22,-58,'#83bcff',1.05],
  ['halcyon-arm','HALCYON ARM',-108,6,-12,'#85dcff',0.95],
  ['perseus-confluence','PERSEUS CONFLUENCE',-26,2,8,'#ffe1ac',1.45],
  ['triangulum','TRIANGULUM',-96,-10,42,'#8bbfff',0.72],
  ['centauri-marches','CENTAURI MARCHES',44,3,20,'#bdaaff',0.92],
  ['ember-span','EMBER SPAN',102,7,-8,'#ffd5a2',0.95],
  ['southern-territories','SOUTHERN TERRITORIES',128,-14,52,'#7aa9ff',0.85],
];
export const RESEARCH_ANCHORS = [
  { name: 'WorldsVault', description: 'Published topology and its direct-authored relationships; layout is explicitly not canonical.', url: CANON_BASE + '/worldsvault/' },
  { name: 'Cosmic architecture', description: 'Source for prisons, repositories, and containment structures.', url: CANON_BASE + '/entities/cosmic-architecture/' },
  { name: 'The systems', description: 'Drakken, Mother, Rings and documented system concepts.', url: CANON_BASE + '/entities/systems/' },
  { name: 'Canon locks', description: 'Machine-readable canon restrictions and provenance.', url: CANON_BASE + '/canon/' },
];
const makeNode = (id, name, kind, parentId, position, color, size = 1, sourceUrl = null) => ({
  id,name,kind,parentId,position,color,size,description:'',status:'draft',sourceUrl,
  label:{show:true,size:12,color:'#e5f5ff',family:'display'}
});
export function seedAtlas() {
  const nodes = galaxyDefs.map(([id,name,x,y,z,color,size])=>makeNode(id,name,'galaxy',null,[x,y,z],color,size));
  for (const [index, [galId]] of galaxyDefs.entries()) {
    const galaxy = nodes.find(n=>n.id===galId);
    for (let i=0;i<5;i++) {
      const a=i*Math.PI*2/5 + index*.45;
      const id=`${galId}-system-${i+1}`;
      nodes.push(makeNode(id,`SURVEY ${String(index+1).padStart(2,'0')}-${i+1}`,'system',galId,
        [Math.cos(a)*(22+i*3),(i-2)*4,Math.sin(a)*(22+i*3)],i%2?'#91c4ff':'#ffdc9f',0.8+i*.11));
      for(let p=0;p<3;p++) nodes.push(makeNode(`${id}-planet-${p+1}`,`UNNAMED ${p+1}`,'planet',id,
        [Math.cos(p*2.2)*((p+1)*10),Math.sin(p*1.7)*1.1,Math.sin(p*2.2)*((p+1)*10)],
        ['#5daed1','#d4ad7b','#8e9eaf'][p],0.5+p*.22));
    }
  }
  nodes.push({ ...makeNode('worldsvault','WORLDSVAULT','landmark',null,[-20,21,62],'#d6faff',1.1,CANON_BASE+'/worldsvault/'), description:'Source-confirmed repository / topology. This pin is an editorial illustration, not a physical coordinate.', status:'reference' });
  nodes.push({ ...makeNode('mother','MOTHER / AUREAL NEBULA','landmark',null,[99,19,-24],'#ebbb9b',1.0,CANON_BASE+'/worldsvault/'), description:'The Dossier identifies Mother within the Aureal Nebula. This display placement is provisional.', status:'reference' });
  const connections = [
    ['north-reach','perseus-confluence'],['north-reach','halcyon-arm'],
    ['halcyon-arm','triangulum'],['halcyon-arm','perseus-confluence'],
    ['triangulum','centauri-marches'],['perseus-confluence','centauri-marches'],
    ['perseus-confluence','ember-span'],['centauri-marches','ember-span'],
    ['centauri-marches','southern-territories'],['ember-span','southern-territories'],
  ];
  const routes=connections.map(([from,to],i)=>({id:`lane-${i+1}`,from,to,kind:i%3===0?'starsilk':'hookshot',status:'draft'}));
  return { version:VERSION, title:'THE MAP OF THE ALL', epoch:'post', layers:{...DEFAULT_LAYERS},
    nodes,routes, regions:[], suppressedVisuals:[], selected:null, quality:'balanced', motion:true, typographyScale:1, updatedAt:new Date().toISOString() };
}
export const childNodes = (state,parentId,kind=null)=>state.nodes.filter(n=>n.parentId===parentId&&(!kind||n.kind===kind));
export const nodeById = (state,id)=>state.nodes.find(n=>n.id===id)||null;
export function ancestry(state,id) {
  const path=[];const visited=new Set();let node=nodeById(state,id);
  while(node&&!visited.has(node.id)){visited.add(node.id);path.unshift(node);node=node.parentId?nodeById(state,node.parentId):null;}
  return path;
}
const isHex = v=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);
const validName=v=>typeof v==='string'&&v.trim().length>0&&v.length<=100;
const validPos=v=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=10000);
export function validateAtlas(value) {
  const errors=[];
  if(!value||typeof value!=='object'||value.version!==VERSION) return ['Unsupported atlas schema version'];
  if(!Array.isArray(value.nodes)||value.nodes.length>750) errors.push('Invalid node collection');
  if(!Array.isArray(value.routes)||value.routes.length>1000) errors.push('Invalid route collection');
  if(errors.length) return errors;
  const ids=new Set();
  for(const n of value.nodes){
    if(!n||typeof n.id!=='string'||!/^[-a-zA-Z0-9_]{1,90}$/.test(n.id)||ids.has(n.id)) errors.push('Invalid or duplicate node ID');
    else ids.add(n.id);
    if(!validName(n.name)||!['galaxy','system','planet','landmark','annotation'].includes(n.kind)||!validPos(n.position)||!isHex(n.color)||!Number.isFinite(n.size)||n.size<=0||n.size>10) errors.push('Invalid node geometry or name');
    if(typeof n.description!=='string'||n.description.length>2500||!['draft','reference'].includes(n.status))errors.push('Invalid node metadata');
    if(!n.label||typeof n.label.show!=='boolean'||!isHex(n.label.color)||!Number.isFinite(n.label.size)||n.label.size<9||n.label.size>36||!['display','mono'].includes(n.label.family))errors.push('Invalid label');
    if(n.label?.offset!==undefined&&(!Array.isArray(n.label.offset)||n.label.offset.length!==2||n.label.offset.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>.3)))errors.push('Invalid label offset');
    if(n.sourceUrl!==null&&n.sourceUrl!==undefined&&(typeof n.sourceUrl!=='string'||n.sourceUrl.length>1024||!n.sourceUrl.startsWith(CANON_BASE+'/')))errors.push('Untrusted canon URL');
  }
  const map=new Map(value.nodes.map(n=>[n.id,n]));
  for(const n of value.nodes){
    if(n.parentId!==null&&(!map.has(n.parentId)||map.get(n.parentId).kind===n.kind||n.parentId===n.id))errors.push('Invalid parent');
    const seen=new Set(); let cursor=n;
    while(cursor&&cursor.parentId){if(seen.has(cursor.id)){errors.push('Cyclic parent graph');break;}seen.add(cursor.id);cursor=map.get(cursor.parentId);}
    if(n.kind==='system'&&map.get(n.parentId)?.kind!=='galaxy')errors.push('System must belong to galaxy');
    if(n.kind==='planet'&&map.get(n.parentId)?.kind!=='system')errors.push('Planet must belong to system');
    if(n.kind==='galaxy'&&n.parentId!==null)errors.push('Galaxy must be top-level');
  }
  for(const r of value.routes){if(!r||!ids.has(r.from)||!ids.has(r.to)||r.from===r.to||!['hookshot','starsilk'].includes(r.kind)||!/^[-a-zA-Z0-9_]{1,90}$/.test(r.id)) errors.push('Invalid route');}
  if(!EPOCHS.some(e=>e.id===value.epoch))errors.push('Invalid epoch');
  if(!value.layers||LAYERS.some(([key])=>typeof value.layers[key]!=='boolean'))errors.push('Invalid layers');
  errors.push(...validateSuppressed(value.suppressedVisuals));
  if(!['balanced','cinematic','battery'].includes(value.quality))errors.push('Invalid quality tier');
  if(typeof value.motion!=='boolean'||!Number.isFinite(value.typographyScale)||value.typographyScale<.6||value.typographyScale>2)errors.push('Invalid preferences');
  errors.push(...validateRegions(value));
  if (!errors.length) errors.push(...validateTimeline(value, validateAtlas));
  return [...new Set(errors)];
}
export function normalizeDraft(raw) {
  if(!raw||typeof raw!=='object')return {valid:false,errors:['Invalid or non-object draft JSON']};
  const data=JSON.parse(JSON.stringify(raw));
  if(data.version!==VERSION)return {valid:false,errors:['Unsupported atlas schema version']};
  if(!Array.isArray(data.regions))data.regions=[];
  if(data.suppressedVisuals===undefined)data.suppressedVisuals=[];
  for(const snap of Object.values(data.timeline?.snapshots||{}))if(snap&&typeof snap==='object'&&snap.suppressedVisuals===undefined)snap.suppressedVisuals=[];
  if(!data.layers||typeof data.layers!=='object')data.layers={...DEFAULT_LAYERS};
  else{for(const [key] of LAYERS)if(typeof data.layers[key]!=='boolean')data.layers[key]=key!=='grid';}
  if(!data.quality||!['balanced','cinematic','battery'].includes(data.quality))data.quality='balanced';
  if(typeof data.motion!=='boolean')data.motion=true;
  if(!Number.isFinite(data.typographyScale)||data.typographyScale<.6||data.typographyScale>2)data.typographyScale=1;
  if(!EPOCHS.some(e=>e.id===data.epoch))data.epoch='post';
  if(Array.isArray(data.nodes)){
    for(const n of data.nodes){
      if(n&&typeof n==='object'){
        if(!n.label||typeof n.label!=='object'){
          n.label={show:true,size:12,color:'#e5f5ff',family:'display'};
        }else{
          if(typeof n.label.show!=='boolean')n.label.show=true;
          if(!isHex(n.label.color))n.label.color='#e5f5ff';
          if(!Number.isFinite(n.label.size)||n.label.size<9||n.label.size>36)n.label.size=12;
          if(!['display','mono'].includes(n.label.family))n.label.family='display';
        }
      }
    }
  }
  const errors=validateAtlas(data);
  if(errors.length)return {valid:false,errors,data};
  return {valid:true,errors:[],data};
}
export function sanitizeAtlas(value) {
  const norm=normalizeDraft(value);
  if(!norm.valid)throw new Error(norm.errors.join('; '));
  const data=JSON.parse(JSON.stringify(norm.data));
  // Imported source pointers do not grant canon authority. Keep the official read-only evidence separate.
  for(const n of data.nodes){n.status='draft';n.sourceUrl=null;}
  sanitizeTimeline(data);
  data.updatedAt=new Date().toISOString();data.selected=null;
  return data;
}
export function removeNode(state,id){
  // Retained v1 API: route all mutations through the source-safe deletion engine.
  return deleteObject(state,id,{type:'node'}).nodeCount;
}
export function uniqueId(state,prefix){let id;do{id=prefix+'-'+Math.random().toString(36).slice(2,9);}while(state.nodes.some(n=>n.id===id));return id;}
export function addNode(state,kind,parentId=null){
  const id=uniqueId(state,kind),position=kind==='galaxy'?[Math.random()*100-50,0,Math.random()*90]:[Math.random()*20-10,0,Math.random()*20-10];
  const n=makeNode(id,kind==='annotation'?'NEW ANNOTATION':'NEW '+kind.toUpperCase(),kind,parentId,position,kind==='planet'?'#d4ad7b':'#47dfff');
  state.nodes.push(n);return n;
}
