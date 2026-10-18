import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas, removeNode, validateAtlas} from '../atlas-data.js';
import {planDeletion, deleteObject,planDeletionBatch,deleteObjects} from '../deletion-engine.js';
import {ensureTimeline, syncEra, switchEra} from '../temporal-model.js';

const newState = () => seedAtlas();
const region = parentId => ({
  id:'test-region',name:'Provisional Sector',parentId,status:'draft',
  affiliation:'DRAFT',color:'#123456',points:[[0,0],[12,0],[0,12]]
});

test('Phase 11: deletion plan is read-only and includes nodes, dependent routes and regions',()=>{
  const state=newState();
  state.regions.push(region('north-reach'));
  const snapshot=structuredClone(state);
  const plan=planDeletion(state,'north-reach',{type:'node',dryRun:true});
  assert.equal(plan.nodeCount,21);
  assert.ok(plan.routeCount>0);
  assert.deepEqual(plan.regionIds,['test-region']);
  assert.deepEqual(state,snapshot,'preview must not mutate user data');
});

test('Phase 11: source identities are immutable, including canonical descendants',()=>{
  const state=newState();
  assert.throws(()=>deleteObject(state,'worldsvault',{type:'node'}),/Read-only source/);
  const snapshot=structuredClone(state);
  state.nodes.find(n=>n.id==='north-reach-system-1-planet-1').status='reference';
  const before=structuredClone(state);
  assert.throws(()=>deleteObject(state,'north-reach',{type:'node'}),/read-only canonical/i);
  assert.deepEqual(state,before,'rejection must be atomic');
  state.nodes=snapshot.nodes;
});

test('Phase 11: canonical routes and regions prevent dependent cascade before mutation',()=>{
  const state=newState();
  state.routes.find(r=>r.from==='north-reach').status='reference';
  const before=structuredClone(state);
  assert.throws(()=>deleteObject(state,'north-reach',{type:'node'}),/source route/i);
  assert.deepEqual(state,before);
  state.routes.find(r=>r.from==='north-reach').status='draft';
  state.regions.push({...region('north-reach'),status:'reference'});
  const beforeRegion=structuredClone(state);
  assert.throws(()=>deleteObject(state,'north-reach',{type:'node'}),/source region/i);
  assert.deepEqual(state,beforeRegion);
});

test('Phase 11: deleting galaxy cleans descendants, routes, regions and selection',()=>{
  const state=newState();
  state.regions.push(region('north-reach'));
  state.selected='north-reach-system-1';
  const beforeRoutes=state.routes.length;
  const plan=deleteObject(state,'north-reach',{type:'node'});
  assert.equal(plan.nodeCount,21);
  assert.equal(state.selected,null);
  assert.ok(state.routes.length<beforeRoutes);
  assert.equal(state.regions.length,0);
  assert.ok(!state.nodes.some(n=>n.id==='north-reach'||n.parentId==='north-reach'));
  assert.deepEqual(validateAtlas(state),[]);
});

test('Phase 11: existing removeNode callers also enforce read-only protection',()=>{
  const state=newState();
  assert.throws(()=>removeNode(state,'mother'),/Read-only source/);
  assert.equal(removeNode(state,'north-reach'),21);
  assert.deepEqual(validateAtlas(state),[]);
});

test('Phase 11: independent route and region removal preserve unrelated nodes',()=>{
  const state=newState();
  const before=state.nodes.length;
  state.regions.push(region('north-reach'));
  assert.equal(deleteObject(state,'lane-1',{type:'route'}).routeCount,1);
  assert.equal(state.nodes.length,before);
  assert.equal(deleteObject(state,'test-region',{type:'region'}).regionCount,1);
  assert.deepEqual(validateAtlas(state),[]);
});

test('Phase 11: missing, duplicated and malformed target IDs fail without mutation',()=>{
  const state=newState();
  assert.throws(()=>deleteObject(state,'does-not-exist'),/not found/i);
  assert.throws(()=>deleteObject(state,'worldsvault',{type:'banana'}),/Unknown object type/);
  state.routes.push({...state.routes[0]});
  const before=structuredClone(state);
  assert.throws(()=>deleteObject(state,'lane-1',{type:'route'}),/Ambiguous/);
  assert.deepEqual(state,before);
});

test('Phase 11: deletion affects the active era, not other era snapshots',()=>{
  const state=newState();
  ensureTimeline(state);
  const original=state.nodes.length;
  deleteObject(state,'triangulum',{type:'node'});
  syncEra(state);
  assert.equal(state.nodes.length,original-21);
  switchEra(state,'war');
  assert.equal(state.nodes.length,original);
  switchEra(state,'post');
  assert.equal(state.nodes.length,original-21);
});


test('Phase 12: overlapping parent/child, route and region roots are counted only once',()=>{
  const state=newState();
  state.regions.push(region('north-reach'));
  const before=structuredClone(state);
  const roots=[
    {type:'node',id:'north-reach'},
    {type:'node',id:'north-reach-system-1'},
    {type:'route',id:'lane-1'},
    {type:'region',id:'test-region'},
    {type:'node',id:'north-reach'},
  ];
  const plan=planDeletionBatch(state,roots);
  assert.equal(plan.selectedCount,4,'duplicate explicit root ignored');
  assert.equal(plan.nodeCount,21,'parent descendants counted once');
  assert.equal(plan.regionCount,1);
  assert.equal(new Set(plan.routeIds).size,plan.routeCount);
  assert.ok(plan.routeIds.includes('lane-1'));
  assert.deepEqual(state,before,'planning cannot mutate state');
  const applied=deleteObjects(state,roots);
  assert.deepEqual(applied,plan);
  assert.deepEqual(validateAtlas(state),[]);
  assert.equal(state.regions.length,0);
  assert.ok(!state.nodes.some(n=>n.id==='north-reach-system-1'));
});

test('Phase 12: mixed node, route and region selection removes only selected drafts',()=>{
  const state=newState(),initialCount=state.nodes.length;
  state.regions.push(region('perseus-confluence'));
  const plan=deleteObjects(state,[
    {type:'node',id:'triangulum-system-1-planet-1'},
    {type:'route',id:'lane-1'},
    {type:'region',id:'test-region'}
  ]);
  assert.equal(plan.nodeCount,1);
  assert.equal(plan.routeCount,1);
  assert.equal(plan.regionCount,1);
  assert.equal(state.nodes.length,initialCount-1);
  assert.ok(state.nodes.some(n=>n.id==='perseus-confluence'));
  assert.ok(!state.routes.some(r=>r.id==='lane-1'));
  assert.deepEqual(validateAtlas(state),[]);
});

test('Phase 12: any canonical root cancels the entire mixed transaction',()=>{
  const state=newState();state.regions.push(region('north-reach'));
  const snapshot=structuredClone(state);
  assert.throws(()=>deleteObjects(state,[
    {type:'region',id:'test-region'},
    {type:'node',id:'worldsvault'},
    {type:'node',id:'triangulum'}
  ]),/read-only source/i);
  assert.deepEqual(state,snapshot);
});

test('Phase 12: canonical descendant and protected edge reject whole multi-delete',()=>{
  const state=newState(),snapshot=structuredClone(state);
  state.nodes.find(n=>n.id==='north-reach-system-1').status='reference';
  const before=structuredClone(state);
  assert.throws(()=>deleteObjects(state,[
    {type:'node',id:'triangulum'},
    {type:'node',id:'north-reach'}
  ]),/read-only canonical/i);
  assert.deepEqual(state,before);
  state.nodes=snapshot.nodes;
  const route=state.routes.find(r=>r.from==='north-reach');
  route.status='reference';
  const beforeRoute=structuredClone(state);
  assert.throws(()=>deleteObjects(state,[
    {type:'node',id:'triangulum'},
    {type:'node',id:'north-reach'}
  ]),/read-only source route/i);
  assert.deepEqual(state,beforeRoute);
});

test('Phase 12: stale or incorrectly typed root blocks all mutations',()=>{
  const state=newState(),before=structuredClone(state);
  assert.throws(()=>deleteObjects(state,[
    {type:'node',id:'triangulum'},
    {type:'route',id:'no-route'}
  ]),/not found/i);
  assert.throws(()=>deleteObjects(state,[
    {type:'node',id:'triangulum'},
    {type:'planet',id:'triangulum-system-1-planet-1'}
  ]),/Invalid deletion target/);
  assert.deepEqual(state,before);
});

test('Phase 12: batch contract rejects empty/overlong/non-array targets',()=>{
  const state=newState(),before=structuredClone(state);
  for(const items of [[],null,Array.from({length:33},()=>({type:'node',id:'triangulum'}))]){
    assert.throws(()=>planDeletionBatch(state,items),/Select 1–32/);
  }
  assert.deepEqual(state,before);
});

test('Phase 12: dryRun and duplicate root filtering remain mutation-free',()=>{
  const state=newState(),original=structuredClone(state);
  const roots=[{type:'node',id:'triangulum'},{type:'node',id:'triangulum'}];
  const plan=deleteObjects(state,roots,{dryRun:true});
  assert.equal(plan.selectedCount,1);
  assert.equal(plan.nodeCount,21);
  assert.deepEqual(state,original);
});

test('Phase 12: delete all editable galaxy groups leaves immutable source landmarks',()=>{
  const state=newState();
  const galaxies=state.nodes.filter(n=>n.kind==='galaxy'&&n.status==='draft');
  const result=deleteObjects(state,galaxies.map(n=>({type:'node',id:n.id})));
  assert.equal(result.selectedCount,7);
  assert.equal(state.nodes.filter(n=>n.status==='reference').length,2);
  assert.deepEqual(state.nodes.map(n=>n.id).sort(),['mother','worldsvault']);
  assert.equal(state.routes.length,0);
  assert.deepEqual(validateAtlas(state),[]);
});

test('Phase 12: grouped removal is limited to one era and clears an affected selection',()=>{
  const state=newState(),initial=state.nodes.length;
  ensureTimeline(state);state.selected='triangulum';
  const roots=[
    {type:'node',id:'triangulum'},
    {type:'node',id:'north-reach'}
  ];
  const plan=deleteObjects(state,roots);
  assert.equal(plan.nodeCount,42);
  assert.equal(state.selected,null);
  syncEra(state);
  assert.equal(state.nodes.length,initial-42);
  switchEra(state,'war');
  assert.equal(state.nodes.length,initial);
  assert.ok(state.nodes.some(n=>n.id==='triangulum'));
  switchEra(state,'post');
  assert.equal(state.nodes.length,initial-42);
  assert.deepEqual(validateAtlas(state),[]);
});
