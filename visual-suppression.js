/** Optional JSON-v1-safe, per-era exclusions for procedural EDITORIAL art. */
export const BRIDGES=[
  ['halcyon-arm','north-reach',1,3],
  ['halcyon-arm','triangulum',2,0],
  ['triangulum','perseus-confluence',1,3],
  ['perseus-confluence','centauri-marches',2,0],
  ['centauri-marches','ember-span',1,3],
  ['centauri-marches','southern-territories',2,0],
  ['ember-span','southern-territories',1,3]
];
const GROUPS=[
  ['network:all','Secondary network'],
  ['network:beads','Hookshot beads'],
  ['network:bridges','Intergalaxy bridges'],
  ['flow:veil','Flow mist'],
  ['flow:nodes','Flow rings'],
  ['flow:pulses','Flow pulses'],
  ['wall:debris','Wall debris'],
  ['wall:lattice','Wall nodes'],
  ['routes:halos','Corridor halos'],
  ['galaxy:ornaments','Galaxy ornaments'],
  ['nebula:bed','Continental dust'],
  ['system:asteroids','Asteroid belt'],
  ['system:comet','Comet trail']
];
const GROUP_IDS=new Set(GROUPS.map(g=>g[0]));
const stable=/^[a-z][a-z0-9_-]{0,89}$/;
export function validVisualId(id){
  if(typeof id!=='string'||id.length>200)return false;
  if(GROUP_IDS.has(id))return true;
  const bits=id.split(':');
  if(bits[0]==='network'&&bits[1]==='system'&&bits.length===3)return stable.test(bits[2]);
  if(bits[0]==='network'&&bits[1]==='bridge'&&bits.length===4)
    return BRIDGES.some(([a,b])=>bits[2]===a&&bits[3]===b);
  if(bits[0]==='galaxy'&&bits[1]==='ornament'&&bits.length===3)return stable.test(bits[2]);
  if(bits[0]==='flow'&&bits[1]==='node'&&bits.length===3)return /^[0-6]$/.test(bits[2]);
  if(bits[0]==='flow'&&bits[1]==='pulse'&&bits.length===4)
    return /^[0-3]$/.test(bits[2])&&+bits[3]<(Number(bits[2])<2?8:6)&&/^[0-7]$/.test(bits[3]);
  return false;
}
export function validateSuppressed(list){
  if(list===undefined)return [];
  if(!Array.isArray(list)||list.length>128||new Set(list).size!==list.length||!list.every(validVisualId))
    return ['Invalid procedural exclusions'];
  return [];
}
export const isSuppressed=(state,id)=>state?.suppressedVisuals?.includes(id)===true;
export function setSuppressed(state,id,hidden){
  if(!validVisualId(id))throw Error('Unknown editorial visual component');
  const previous=state.suppressedVisuals||[];
  const next=hidden?[...new Set([...previous,id])]:previous.filter(value=>value!==id);
  if(validateSuppressed(next).length)throw Error('Procedural exclusion limit reached');
  state.suppressedVisuals=next;
}
export function listVisualTargets(state){
  const options=[...GROUPS];
  const nodes=state.nodes||[],galaxies=new Map(nodes.filter(n=>n.kind==='galaxy').map(n=>[n.id,n.name]));
  for(const n of nodes){
    if(n.kind==='system'&&n.parentId)
      options.push(['network:system:'+n.id,'Radial / '+(galaxies.get(n.parentId)||'draft galaxy')+' / '+n.name]);
    if(n.kind==='galaxy')options.push(['galaxy:ornament:'+n.id,'Galactic ornaments / '+n.name]);
  }
  for(const [a,b] of BRIDGES)if(galaxies.has(a)&&galaxies.has(b))
    options.push(['network:bridge:'+a+':'+b,'Bridge / '+galaxies.get(a)+' to '+galaxies.get(b)]);
  for(let i=0;i<7;i++)options.push(['flow:node:'+i,'Flow node '+(i+1)]);
  for(let strand=0;strand<4;strand++)for(let pulse=0;pulse<(strand<2?8:6);pulse++)
    options.push(['flow:pulse:'+strand+':'+pulse,'Pulse / '+(strand+1)+' / '+(pulse+1)]);
  return options;
}
