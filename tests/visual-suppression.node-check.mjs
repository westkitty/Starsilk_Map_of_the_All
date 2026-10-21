import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas,validateAtlas,normalizeDraft,sanitizeAtlas} from '../atlas-data.js';
import {readDraft} from '../draft-recovery.js';
import {deleteObject} from '../deletion-engine.js';
import {ensureTimeline,syncEra,switchEra,compareEras} from '../temporal-model.js';
import {BRIDGES,validVisualId,validateSuppressed,isSuppressed,setSuppressed,listVisualTargets} from '../visual-suppression.js';

const fresh=()=>{const state=seedAtlas();ensureTimeline(state);return state;};
test('Phase 14: suppression lists named categories and actual keyed generated elements',()=>{
  const state=fresh(),options=listVisualTargets(state);
  const keys=options.map(v=>v[0]);
  for(const id of ['network:all','flow:pulses','flow:pulse:1:7','flow:node:6','network:system:north-reach-system-1','network:bridge:halcyon-arm:north-reach','galaxy:ornament:perseus-confluence','wall:debris','system:asteroids']){
    assert.ok(keys.includes(id),id);assert.equal(validVisualId(id),true);
  }
  assert.equal(keys.length,new Set(keys).size,'all settings have unique persistent keys');
  assert.equal(BRIDGES.length,7);
});

test('Phase 14: hidden, suppressed and actual deleted draft data remain distinct',()=>{
  const state=fresh(),beforeNodes=state.nodes.length,beforeRoutes=state.routes.length;
  state.layers.routes=false;
  setSuppressed(state,'network:system:north-reach-system-1',true);
  assert.equal(isSuppressed(state,'network:system:north-reach-system-1'),true);
  assert.equal(state.nodes.length,beforeNodes);
  assert.equal(state.routes.length,beforeRoutes);
  assert.equal(state.layers.routes,false,'layer hide remains independent of suppression');
  setSuppressed(state,'network:system:north-reach-system-1',false);
  assert.equal(isSuppressed(state,'network:system:north-reach-system-1'),false);
  syncEra(state);assert.deepEqual(validateAtlas(state),[]);
});

test('Phase 14: category and single-item suppression is idempotent and bounded',()=>{
  const s=fresh();
  for(const id of ['flow:nodes','flow:node:0','flow:pulses','flow:pulse:0:0']){
    setSuppressed(s,id,true);setSuppressed(s,id,true);
  }
  assert.equal(s.suppressedVisuals.length,4);
  setSuppressed(s,'flow:node:0',false);
  assert.ok(!s.suppressedVisuals.includes('flow:node:0'));
  syncEra(s);assert.deepEqual(validateAtlas(s),[]);
});

test('Phase 14: malformed visual IDs, duplicates and unbounded arrays never validate',()=>{
  const bad=['flow:node:7','flow:pulse:3:7','galaxy:ornament:../..','network:bridge:unknown:unknown','__proto__','flow:pulse:0:09'];
  for(const id of bad){assert.equal(validVisualId(id),false,id);assert.throws(()=>setSuppressed(fresh(),id,true));}
  const s=fresh();s.suppressedVisuals=['wall:debris','wall:debris'];
  assert.deepEqual(validateSuppressed(s.suppressedVisuals),['Invalid procedural exclusions']);
  assert.ok(validateAtlas(s).length>0);
  s.suppressedVisuals=Array.from({length:129},(_,i)=>'network:system:seed-'+i);
  assert.ok(validateAtlas(s).length>0);
});

test('Phase 14: per-era procedural exclusions remain independent and produce comparison deltas',()=>{
  const s=fresh();
  setSuppressed(s,'network:all',true);syncEra(s);
  const from=structuredClone(s.timeline.snapshots.war);
  switchEra(s,'war');
  assert.equal(isSuppressed(s,'network:all'),false);
  setSuppressed(s,'flow:pulses',true);syncEra(s);
  switchEra(s,'post');
  assert.equal(isSuppressed(s,'network:all'),true);
  assert.equal(isSuppressed(s,'flow:pulses'),false);
  assert.deepEqual(validateAtlas(s),[]);
  assert.equal(from.suppressedVisuals.length,0);
});

test('Phase 14: old JSON v1 without suppression arrays migrates safely',()=>{
  const s=fresh();
  delete s.suppressedVisuals;
  for(const snap of Object.values(s.timeline.snapshots))delete snap.suppressedVisuals;
  const norm=normalizeDraft(s);
  assert.equal(norm.valid,true,norm.errors?.join('; '));
  assert.deepEqual(norm.data.suppressedVisuals,[]);
  for(const snap of Object.values(norm.data.timeline.snapshots))assert.deepEqual(snap.suppressedVisuals,[]);
  assert.deepEqual(validateAtlas(norm.data),[]);
});

test('Phase 14: malformed imported suppression never disappears silently',()=>{
  const s=fresh();
  s.suppressedVisuals='remove all canon';
  assert.equal(normalizeDraft(s).valid,false);
  assert.throws(()=>sanitizeAtlas(s),/Invalid procedural exclusions/);
  const raw=JSON.stringify(s),recovery=readDraft(raw);
  assert.equal(recovery.rejectedRaw,raw);
});

test('Phase 14: JSON v1 round-trip preserves exclusions and source immutability',()=>{
  const s=fresh();
  for(const id of ['wall:debris','network:all','galaxy:ornament:north-reach'])setSuppressed(s,id,true);
  syncEra(s);
  const reopened=readDraft(JSON.stringify(s)).state;
  assert.deepEqual(reopened.suppressedVisuals,s.suppressedVisuals);
  assert.equal(reopened.timeline.snapshots.post.suppressedVisuals.length,3);
  assert.equal(reopened.nodes.find(n=>n.id==='worldsvault').status,'reference');
  const imported=sanitizeAtlas(reopened);
  assert.ok(imported.nodes.every(n=>n.status==='draft'));
  assert.deepEqual(imported.suppressedVisuals,s.suppressedVisuals);
  assert.deepEqual(validateAtlas(imported),[]);
});

test('Phase 14: orphaned suppressions remain harmless after user draft deletion',()=>{
  const s=fresh();
  const id='network:system:north-reach-system-1';
  setSuppressed(s,id,true);
  deleteObject(s,'north-reach',{type:'node'});syncEra(s);
  assert.ok(!s.nodes.some(n=>n.id==='north-reach-system-1'));
  assert.equal(isSuppressed(s,id),true,'preserve the intentional exclusion until reset');
  assert.ok(!listVisualTargets(s).some(([key])=>key===id),'deleted object has no active cleanup entry');
  assert.deepEqual(validateAtlas(s),[]);
});

test('Phase 14: literal suppression reset does not destroy eras or node geometries',()=>{
  const s=fresh();const original=JSON.stringify(s.nodes);
  setSuppressed(s,'wall:debris',true);syncEra(s);
  s.suppressedVisuals=[];syncEra(s);
  assert.equal(JSON.stringify(s.nodes),original);
  assert.deepEqual(validateAtlas(s),[]);
  assert.deepEqual(s.suppressedVisuals,[]);
});
