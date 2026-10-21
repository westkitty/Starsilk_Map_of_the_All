/** Phase 2 mixed-version fixtures; synthetic data only. No browser profile is accessed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas,normalizeDraft,validateAtlas,STORAGE_KEY,VERSION} from '../atlas-data.js';
import {readDraft,readStoredDraft} from '../draft-recovery.js';
import {ensureTimeline,syncEra,switchEra} from '../temporal-model.js';
import {setSuppressed} from '../visual-suppression.js';

const synthetic=()=>{const state=seedAtlas();ensureTimeline(state);return state;};
const legacyCapture=state=>structuredClone({nodes:state.nodes,routes:state.routes,regions:state.regions,layers:state.layers});

test('Phase 2: v1 key and pre-suppression snapshots import without an upgrade prompt or erased objects',()=>{
  const state=synthetic(),before=structuredClone(state);
  delete state.suppressedVisuals;
  for(const snapshot of Object.values(state.timeline.snapshots))delete snapshot.suppressedVisuals;
  const oldJson=JSON.stringify(state),normalized=normalizeDraft(JSON.parse(oldJson));
  assert.equal(VERSION,1);
  assert.equal(STORAGE_KEY,'starsilk.map-of-the-all.draft.v1');
  assert.equal(normalized.valid,true,normalized.errors?.join('; '));
  assert.deepEqual(validateAtlas(normalized.data),[]);
  assert.deepEqual(normalized.data.suppressedVisuals,[]);
  for(const era of ['war','locking','post']){
    assert.deepEqual(normalized.data.timeline.snapshots[era].suppressedVisuals,[]);
    assert.equal(normalized.data.timeline.snapshots[era].nodes.length,before.timeline.snapshots[era].nodes.length);
  }
  assert.deepEqual(normalized.data.nodes,before.nodes);
  assert.deepEqual(normalized.data.routes,before.routes);
});

test('Phase 2: three-era suppressions round-trip through current JSON v1 and preserve source locks',()=>{
  const state=synthetic();
  setSuppressed(state,'network:all',true);syncEra(state);
  switchEra(state,'war');setSuppressed(state,'wall:debris',true);syncEra(state);
  switchEra(state,'locking');setSuppressed(state,'flow:pulses',true);syncEra(state);
  switchEra(state,'post');
  const raw=JSON.stringify(state),recovered=readDraft(raw);
  assert.equal(recovered.rejectedRaw,null);
  assert.deepEqual(validateAtlas(recovered.state),[]);
  assert.deepEqual(recovered.state.timeline.snapshots.post.suppressedVisuals,['network:all']);
  assert.deepEqual(recovered.state.timeline.snapshots.war.suppressedVisuals,['wall:debris']);
  assert.deepEqual(recovered.state.timeline.snapshots.locking.suppressedVisuals,['flow:pulses']);
  assert.ok(recovered.state.nodes.some(n=>n.status==='reference'));
});

test('Phase 2: simulated older era-writer discards optional suppression and is rejected without destroying raw JSON',()=>{
  const state=synthetic();
  setSuppressed(state,'network:all',true);syncEra(state);
  switchEra(state,'war');setSuppressed(state,'wall:debris',true);syncEra(state);
  switchEra(state,'post');
  // This is an explicitly simulated former captureEra shape, NOT a verified legacy browser replay.
  const modifiedByOld=structuredClone(state);
  modifiedByOld.timeline.snapshots.post=legacyCapture(modifiedByOld);
  const raw=JSON.stringify(modifiedByOld);
  const normalized=normalizeDraft(modifiedByOld);
  assert.equal(normalized.valid,false,'mixed-version active snapshot must not be silently accepted as equal');
  const recovered=readDraft(raw);
  assert.equal(recovered.rejectedRaw,raw,'exact bytes are available for recovery');
  assert.ok(recovered.issue,'recovery must be announced rather than silently overwriting');
  const preferred=readStoredDraft(raw,null);
  assert.equal(preferred.rejectedRaw,raw,'invalid local JSON is retained even if no valid session fallback exists');
});
