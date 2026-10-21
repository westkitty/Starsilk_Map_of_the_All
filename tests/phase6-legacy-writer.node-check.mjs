/** Read-only witness using the exact legacy Planner temporal model at
 * westkitty/Star_System_Planner main dc3c742743838757aaafed9e637d95a5aa814596,
 * blob 500381536b63b79a74231429a8274d628186d441. NO Planner writes.
 * This is a deterministic source-level replay, NOT a live cross-site browser test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas,STORAGE_KEY,normalizeDraft,validateAtlas} from '../atlas-data.js';
import {ensureTimeline,switchEra,syncEra} from '../temporal-model.js';
import {setSuppressed} from '../visual-suppression.js';
import {readDraft} from '../draft-recovery.js';
import {
  captureEra as legacyCaptureEra,
  syncEra as legacySyncEra,
  validateTimeline as legacyValidateTimeline
} from './fixtures/legacy-planner-temporal-model.mjs';

const currentDraft=()=>{
  const state=seedAtlas();ensureTimeline(state);
  setSuppressed(state,'network:all',true);syncEra(state);
  switchEra(state,'war');setSuppressed(state,'wall:debris',true);syncEra(state);
  switchEra(state,'post');
  assert.deepEqual(validateAtlas(state),[]);
  return state;
};

test('legacy source snapshooter omits actual newer per-era suppression data',()=>{
  const current=currentDraft();
  assert.equal(STORAGE_KEY,'starsilk.map-of-the-all.draft.v1');
  assert.deepEqual(current.timeline.snapshots.post.suppressedVisuals,['network:all']);
  assert.deepEqual(current.timeline.snapshots.war.suppressedVisuals,['wall:debris']);
  assert.equal(Object.hasOwn(legacyCaptureEra(current),'suppressedVisuals'),false,
    'actual pinned legacy source has no suppression slot');
  assert.deepEqual(legacyValidateTimeline(current,()=>[]),['Active era differs from its stored snapshot'],
    'actual legacy timeline validator rejects new-format active snapshots');
});

test('legacy source-level write creates mixed-version JSON v1 that current reader rejects safely',()=>{
  const state=currentDraft(),copy=structuredClone(state);
  legacySyncEra(copy);
  const raw=JSON.stringify(copy);
  assert.ok(raw.includes('network:all'),'old sync must not destroy the top-level source payload');
  assert.equal(Object.hasOwn(copy.timeline.snapshots.post,'suppressedVisuals'),false,
    'old writer silently discarded the newer snapshot field');
  const currentValidation=normalizeDraft(copy);
  assert.equal(currentValidation.valid,false,'mixed active snapshot must fail closed');
  const recovery=readDraft(raw);
  assert.equal(recovery.rejectedRaw,raw,'exact rejected legacy-overwritten bytes remain recoverable');
  assert.ok(recovery.issue,'user must receive an explicit recovery warning');
});

test('standalone read of untouched modern JSON v1 preserves three independent eras',()=>{
  const modern=currentDraft(),raw=JSON.stringify(modern),read=readDraft(raw);
  assert.equal(read.rejectedRaw,null);
  assert.deepEqual(read.state.timeline.snapshots.post.suppressedVisuals,['network:all']);
  assert.deepEqual(read.state.timeline.snapshots.war.suppressedVisuals,['wall:debris']);
  assert.equal(read.state.version,1);
  assert.equal(JSON.stringify(modern),raw,'read does not mutate fixture');
});
