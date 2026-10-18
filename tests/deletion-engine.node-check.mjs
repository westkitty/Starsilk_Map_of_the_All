import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas, removeNode, validateAtlas} from '../atlas-data.js';
import {planDeletion, deleteObject} from '../deletion-engine.js';
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
