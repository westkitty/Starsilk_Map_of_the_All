import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas, EPOCHS} from '../atlas-data.js';
import {
  ensureTimeline,
  syncEra,
  switchEra,
  cloneEra,
  writeEraNote,
  compareEras,
  validateTimeline,
  ERA_IDS,
  MAX_ERA_NOTE
} from '../temporal-model.js';
import {CANON_CHRONOLOGY_MILESTONES, CANON_INVARIANTS} from '../canon-registry.js';

test('EPOCHS metadata preserves locked 170-year war and containment lattice invariants', () => {
  assert.equal(EPOCHS.length, 3);
  const war = EPOCHS.find(e => e.id === 'war');
  const locking = EPOCHS.find(e => e.id === 'locking');
  const post = EPOCHS.find(e => e.id === 'post');

  assert.ok(war);
  assert.ok(war.duration.includes('170 YEARS'));
  assert.ok(war.canonLocks.some(l => l.includes('170-year')));
  assert.equal(war.visualTheme, 'crimson-remnant');

  assert.ok(locking);
  assert.ok(locking.duration.includes('170'));
  assert.ok(locking.canonLocks.some(l => l.includes('black-hole containment lattice and cosmic absence')));
  assert.equal(locking.visualTheme, 'black-hole-lattice');

  assert.ok(post);
  assert.equal(post.visualTheme, 'archival-survey');
});

test('CANON_CHRONOLOGY_MILESTONES reflects authoritative sequence without coordinate claims', () => {
  assert.equal(CANON_CHRONOLOGY_MILESTONES.length, 5);
  const years = CANON_CHRONOLOGY_MILESTONES.map(m => m.timeframe);
  assert.deepEqual(years, ['YEAR 0', 'YEAR 3', 'YEAR 121', 'YEAR 170', 'POST-YEAR 170']);

  for (const m of CANON_CHRONOLOGY_MILESTONES) {
    assert.ok(ERA_IDS.includes(m.eraId));
    assert.ok(typeof m.title === 'string' && m.title.length > 0);
    assert.ok(typeof m.detail === 'string' && m.detail.length > 0);
    assert.ok(m.url.startsWith('https://westkitty.github.io/Starsilk_Character_Dossier'));
  }
});

test('compareEras reports moved nodes with node IDs and before/after coordinates', () => {
  const state = seedAtlas();
  ensureTimeline(state);

  const baseline = state.timeline.snapshots.war;
  const active = structuredClone(baseline);

  // Move first node by +10 on X
  active.nodes[0].position[0] += 10;
  // Add a new draft node
  active.nodes.push({
    id: 'test-new-galaxy',
    name: 'TEST GALAXY',
    kind: 'galaxy',
    status: 'draft',
    parentId: null,
    position: [100, 0, 100],
    size: 1,
    color: '#ffffff',
    label: { show: true, text: 'TEST', color: '#ffffff', size: 12, family: 'sans' }
  });

  const diff = compareEras(baseline, active);
  assert.equal(diff.nodes.added.length, 1);
  assert.equal(diff.nodes.added[0].id, 'test-new-galaxy');
  assert.equal(diff.moved.length, 1);
  assert.equal(diff.moved[0].id, active.nodes[0].id);
  assert.equal(diff.moved[0].before.position[0] + 10, diff.moved[0].after.position[0]);
});

test('switchEra is atomic and preserves independent draft geometries across eras', () => {
  const state = seedAtlas();
  ensureTimeline(state);

  // Edit in post era
  state.nodes[0].name = 'RENAMED IN POST';
  syncEra(state);

  // Switch to war era
  const switched = switchEra(state, 'war');
  assert.equal(switched, true);
  assert.equal(state.epoch, 'war');
  assert.notEqual(state.nodes[0].name, 'RENAMED IN POST');

  // Switch back to post era
  switchEra(state, 'post');
  assert.equal(state.nodes[0].name, 'RENAMED IN POST');
});

test('cloneEra copies one era draft into another without corrupting third era', () => {
  const state = seedAtlas();
  ensureTimeline(state);

  state.nodes[0].name = 'UNIQUE TO POST';
  syncEra(state);

  // Clone post into locking
  cloneEra(state, 'post', 'locking');
  assert.equal(state.timeline.snapshots.locking.nodes[0].name, 'UNIQUE TO POST');
  // War era remains unaffected
  assert.notEqual(state.timeline.snapshots.war.nodes[0].name, 'UNIQUE TO POST');
});

test('writeEraNote accepts valid notes up to MAX_ERA_NOTE and rejects invalid', () => {
  const state = seedAtlas();
  ensureTimeline(state);

  writeEraNote(state, 'war', 'Editorial hypothesis for warfront supply lines.');
  assert.equal(state.timeline.notes.war, 'Editorial hypothesis for warfront supply lines.');

  assert.throws(() => {
    writeEraNote(state, 'war', 'X'.repeat(MAX_ERA_NOTE + 1));
  }, /Invalid provisional era note/);

  assert.throws(() => {
    writeEraNote(state, 'invalid-era', 'Note');
  }, /Invalid provisional era note/);
});
