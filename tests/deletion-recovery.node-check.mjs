import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas,normalizeDraft,sanitizeAtlas,validateAtlas} from '../atlas-data.js';
import {readDraft,readStoredDraft} from '../draft-recovery.js';
import {ensureTimeline,syncEra,switchEra} from '../temporal-model.js';
import {deleteObject,deleteObjects} from '../deletion-engine.js';

const at=(iso,name)=>{
  const s=seedAtlas();ensureTimeline(s);
  s.updatedAt=iso;s.nodes.find(n=>n.id==='north-reach').name=name;
  syncEra(s);
  return s;
};

test('Phase 13: newest session delete wins over stale valid local draft',()=>{
  const local=at('2026-10-18T09:00:00.000Z','OLD');
  const session=structuredClone(local);
  deleteObject(session,'north-reach',{type:'node'});syncEra(session);
  session.updatedAt='2026-10-18T09:00:00.001Z';
  const oldRaw=JSON.stringify(local),sessionRaw=JSON.stringify(session);
  const recovered=readStoredDraft(oldRaw,sessionRaw,true);
  assert.equal(recovered.source,'session');
  assert.ok(!recovered.state.nodes.some(n=>n.id==='north-reach'));
  assert.ok(local.nodes.some(n=>n.id==='north-reach'));
  assert.deepEqual(validateAtlas(recovered.state),[]);
  assert.equal(oldRaw,JSON.stringify(local),'selection never overwrites storage');
});

test('Phase 13: newer valid local snapshot beats stale marked session fallback',()=>{
  const local=at('2026-10-18T09:00:00.002Z','NEW LOCAL');
  const session=at('2026-10-18T09:00:00.001Z','OLD SESSION');
  const result=readStoredDraft(JSON.stringify(local),JSON.stringify(session),true);
  assert.equal(result.source,'local');
  assert.equal(result.state.nodes.find(n=>n.id==='north-reach').name,'NEW LOCAL');
});

test('Phase 13: equal-time marked fallback prioritizes the session copy',()=>{
  const local=at('2026-10-18T09:00:00.001Z','STALE');
  const session=at('2026-10-18T09:00:00.001Z','RECOVERED');
  assert.equal(readStoredDraft(JSON.stringify(local),JSON.stringify(session),true).source,'session');
  assert.equal(readStoredDraft(JSON.stringify(local),JSON.stringify(session),false).source,'local');
});

test('Phase 13: legacy local-only and session-only schema v1 remain readable',()=>{
  const local=seedAtlas();delete local.timeline;delete local.updatedAt;
  const a=readStoredDraft(JSON.stringify(local),null,false);
  assert.equal(a.source,'local');assert.deepEqual(validateAtlas(a.state),[]);
  const b=readStoredDraft(null,JSON.stringify(local),false);
  assert.equal(b.source,'session');assert.equal(b.rejectedRaw,null);
  assert.equal(readStoredDraft(null,null,false).source,'seed');
});

test('Phase 13: broken primary JSON remains recoverable even with good session',()=>{
  const raw='{"unfinished":';
  const session=at('2026-10-18T09:00:00.003Z','SESSION SAFE');
  const result=readStoredDraft(raw,JSON.stringify(session),true);
  assert.equal(result.rejectedRaw,raw);
  assert.equal(result.source,'local');
  assert.ok(result.issue);
  assert.equal(result.state.nodes.find(n=>n.id==='north-reach').name,'SESSION SAFE');
  assert.deepEqual(validateAtlas(result.state),[]);
});

test('Phase 13: malformed session fallback stays untouched, valid local not lost',()=>{
  const local=at('2026-10-18T09:00:00.003Z','LOCAL GOOD');
  const bad='[{"truncated":';
  const result=readStoredDraft(JSON.stringify(local),bad,true);
  assert.equal(result.rejectedRaw,bad);
  assert.equal(result.source,'session');
  assert.equal(result.state.nodes.find(n=>n.id==='north-reach').name,'LOCAL GOOD');
});

test('Phase 13: no candidates and unsupported schema do not fabricate valid saves',()=>{
  const wrong=seedAtlas();wrong.version=42;
  const raw=JSON.stringify(wrong);
  const result=readStoredDraft(raw,null,false);
  assert.equal(result.rejectedRaw,raw);
  assert.match(result.issue,/Unsupported atlas schema/i);
  assert.equal(readDraft(null).rejectedRaw,null);
});

test('Phase 13: deleted items persist through JSON v1 export, import and reload',()=>{
  const state=seedAtlas();ensureTimeline(state);
  deleteObjects(state,[
    {type:'node',id:'north-reach'},
    {type:'node',id:'triangulum'}
  ]);
  syncEra(state);
  const exported=JSON.stringify({...state,selected:null});
  const reopened=readDraft(exported);
  assert.equal(reopened.rejectedRaw,null);
  assert.equal(reopened.state.nodes.length,state.nodes.length);
  for(const id of ['north-reach','triangulum'])
    assert.ok(!reopened.state.nodes.some(n=>n.id===id));
  const imported=sanitizeAtlas(normalizeDraft(JSON.parse(exported)).data);
  assert.deepEqual(validateAtlas(imported),[]);
  for(const id of ['north-reach','triangulum'])
    assert.ok(!imported.nodes.some(n=>n.id===id));
  switchEra(imported,'war');
  assert.ok(imported.nodes.some(n=>n.id==='north-reach'));
  switchEra(imported,'post');
  assert.ok(!imported.nodes.some(n=>n.id==='north-reach'));
  assert.ok(imported.nodes.every(n=>n.status==='draft'),'imports must never convey canon');
});

test('Phase 13: deleting in post does not corrupt a distinct locking deletion',()=>{
  const state=seedAtlas();ensureTimeline(state);
  deleteObject(state,'north-reach',{type:'node'});syncEra(state);
  switchEra(state,'locking');
  deleteObject(state,'triangulum',{type:'node'});syncEra(state);
  const data=readDraft(JSON.stringify(state)).state;
  assert.deepEqual(validateAtlas(data),[]);
  assert.ok(data.nodes.some(n=>n.id==='north-reach'));
  assert.ok(!data.nodes.some(n=>n.id==='triangulum'));
  switchEra(data,'post');
  assert.ok(!data.nodes.some(n=>n.id==='north-reach'));
  assert.ok(data.nodes.some(n=>n.id==='triangulum'));
  switchEra(data,'war');
  assert.ok(data.nodes.some(n=>n.id==='triangulum'));
  assert.ok(data.nodes.some(n=>n.id==='north-reach'));
});


test('Phase 13: newer timestamped fallback takes precedence over legacy undated primary',()=>{
  const local=seedAtlas();delete local.updatedAt;
  const session=seedAtlas();ensureTimeline(session);
  deleteObject(session,'north-reach',{type:'node'});syncEra(session);
  session.updatedAt='2026-10-18T09:00:00.005Z';
  const result=readStoredDraft(JSON.stringify(local),JSON.stringify(session),false);
  assert.equal(result.source,'session');
  assert.ok(!result.state.nodes.some(n=>n.id==='north-reach'));
});
