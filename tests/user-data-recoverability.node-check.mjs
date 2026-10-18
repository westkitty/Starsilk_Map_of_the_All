import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { seedAtlas, validateAtlas, normalizeDraft, sanitizeAtlas, VERSION } from '../atlas-data.js';
import { readDraft } from '../draft-recovery.js';

const mainSource = readFileSync(resolve(process.cwd(), 'main.js'), 'utf-8');
const indexSource = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
const cssSource = readFileSync(resolve(process.cwd(), 'atlas.css'), 'utf-8');

test('user data: normalizeDraft normalizes legacy v1 drafts missing optional regions, layers, and timeline', () => {
  const legacy = seedAtlas();
  delete legacy.regions;
  delete legacy.timeline;
  delete legacy.layers.grid;

  const res = normalizeDraft(legacy);
  assert.equal(res.valid, true, 'legacy draft should be valid under normalizeDraft');
  assert.ok(Array.isArray(res.data.regions), 'regions array should be initialized to []');
  assert.equal(typeof res.data.layers.grid, 'boolean', 'missing layer should be initialized');
  assert.equal(res.errors.length, 0);
});

test('user data: normalizeDraft rejects invalid schema version, corrupt geometry, or cyclic graphs', () => {
  const badVersion = seedAtlas();
  badVersion.version = 99;
  const res1 = normalizeDraft(badVersion);
  assert.equal(res1.valid, false);
  assert.match(res1.errors[0], /Unsupported atlas schema/);

  const badPos = seedAtlas();
  badPos.nodes[0].position = [NaN, 0, 0];
  const res2 = normalizeDraft(badPos);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.length > 0);

  const nonObj = normalizeDraft('not an object');
  assert.equal(nonObj.valid, false);
});

test('user data: sanitizeAtlas demotes reference status and clears sourceUrl across all nodes and era snapshots', () => {
  const seeded = seedAtlas();
  // Ensure we have a reference node
  const refNode = seeded.nodes.find(n => n.status === 'reference');
  assert.ok(refNode, 'seeded atlas must contain a reference node');
  assert.ok(refNode.sourceUrl, 'reference node must have sourceUrl');

  const sanitized = sanitizeAtlas(seeded);
  for (const n of sanitized.nodes) {
    assert.equal(n.status, 'draft', `node ${n.id} must be demoted to draft`);
    assert.equal(n.sourceUrl, null, `node ${n.id} sourceUrl must be cleared`);
  }

  if (sanitized.timeline) {
    for (const eraId of ['war', 'locking', 'post']) {
      for (const n of sanitized.timeline.snapshots[eraId].nodes) {
        assert.equal(n.status, 'draft', `snapshot node ${n.id} in era ${eraId} must be draft`);
        assert.equal(n.sourceUrl, null, `snapshot node ${n.id} in era ${eraId} sourceUrl must be null`);
      }
    }
  }
});

test('user data: guarded import UX dialog and summary grid are present in index.html and atlas.css', () => {
  assert.ok(indexSource.includes('id="importConfirmDialog"'), 'index.html must include importConfirmDialog');
  assert.ok(indexSource.includes('id="importSummaryGrid"'), 'index.html must include importSummaryGrid');
  assert.ok(indexSource.includes('id="importBackupBtn"'), 'index.html must include importBackupBtn');
  assert.ok(indexSource.includes('id="importConfirmBtn"'), 'index.html must include importConfirmBtn');
  assert.ok(indexSource.includes('id="importCancelBtn"'), 'index.html must include importCancelBtn');
  assert.ok(cssSource.includes('.import-dialog'), 'atlas.css must style .import-dialog');
  assert.ok(cssSource.includes('.import-summary-grid'), 'atlas.css must style .import-summary-grid');
});

test('user data: Undo and Redo stack management, keyboard shortcuts, and button wiring in main.js', () => {
  assert.ok(mainSource.includes('let redoStack=[];'), 'main.js must declare redoStack');
  assert.ok(mainSource.includes('function undo()'), 'main.js must implement undo()');
  assert.ok(mainSource.includes('function redo()'), 'main.js must implement redo()');
  assert.ok(mainSource.includes('redoStack.push(current)'), 'undo must push to redoStack');
  assert.ok(mainSource.includes('history.push(current)'), 'redo must push to history');
  assert.ok(mainSource.includes('updateUndoRedoButtons()'), 'must update undo/redo button enabled states');
  assert.ok(mainSource.includes('!ev.shiftKey&&k===\'z\''), 'Ctrl+Z must trigger undo');
  assert.ok(mainSource.includes('k===\'y\''), 'Ctrl+Y must trigger redo');
  assert.ok(indexSource.includes('id="undoBtn"'), 'index.html must include undoBtn in header');
  assert.ok(indexSource.includes('id="redoBtn"'), 'index.html must include redoBtn in header');
});

test('user data: storage recoverability and sessionStorage fallback in bootstrapState and writeDraftNow', () => {
  assert.ok(mainSource.includes('sessionStorage.getItem(STORAGE_KEY)'), 'bootstrapState must check sessionStorage fallback');
  assert.ok(mainSource.includes('sessionStorage.setItem(STORAGE_KEY,'), 'writeDraftNow must catch storage errors and fall back to sessionStorage');
  assert.ok(mainSource.includes('rejectedDraftRaw!==null'), 'unreadable drafts must trigger recovery without overwriting');

  // Verify readDraft preserves rejected bytes
  const corruptJson = '{"title": "incomplete';
  const rec = readDraft(corruptJson);
  assert.equal(rec.rejectedRaw, corruptJson, 'readDraft must preserve corrupt raw input');
  assert.ok(rec.issue, 'readDraft must note the issue');
  assert.equal(rec.state.version, VERSION, 'fallback state must be valid seed');
});
