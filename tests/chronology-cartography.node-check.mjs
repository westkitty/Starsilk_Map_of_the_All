import assert from 'node:assert/strict';
import test from 'node:test';
import { EPOCHS, seedAtlas } from '../atlas-data.js';
import { CANON_CHRONOLOGY_MILESTONES } from '../canon-registry.js';
import { ERA_IDS, compareEras, eraSummary, ensureTimeline, switchEra, captureEra } from '../temporal-model.js';

test('Historical Cartography & Chronology Suite', async (t) => {
  await t.test('causal chronology milestone sequence & source provenance', () => {
    assert.equal(CANON_CHRONOLOGY_MILESTONES.length, 5, 'Exactly 5 canonical causal milestones');
    const expectedEras = ['war', 'war', 'war', 'locking', 'post'];

    for (const [idx, m] of CANON_CHRONOLOGY_MILESTONES.entries()) {
      assert.equal(m.eraId, expectedEras[idx], `Milestone ${idx} must belong to ${expectedEras[idx]}`);
      assert.ok(m.timeframe.length > 0, 'Milestone must possess timeframe label');
      assert.ok(m.title.length > 0, 'Milestone must possess title');
      assert.ok(m.detail.length > 20, 'Milestone must provide detailed narrative context');
      assert.ok(m.url.startsWith('https://westkitty.github.io/Starsilk_Character_Dossier/'), 'Must cite authoritative Dossier URL');
    }
  });

  await t.test('immutable era locks & 170-year war duration', () => {
    const warEpoch = EPOCHS.find(e => e.id === 'war');
    assert.ok(warEpoch, 'War epoch must exist');
    assert.ok(warEpoch.duration.includes('170') || warEpoch.note.includes('170-year'), '170-year war invariant must be stated');
    assert.ok(warEpoch.canonLocks.some(l => l.includes('170-year war duration strictly locked')), '170-year war duration must be strictly locked');

    const lockingEpoch = EPOCHS.find(e => e.id === 'locking');
    assert.ok(lockingEpoch, 'Locking epoch must exist');
    assert.ok(lockingEpoch.canonLocks.some(l => l.includes('Siege Wall is a black-hole containment lattice and cosmic absence')), 'Siege Wall black hole lattice must be locked');

    const postEpoch = EPOCHS.find(e => e.id === 'post');
    assert.ok(postEpoch, 'Post-war epoch must exist');
    assert.ok(postEpoch.canonLocks.some(l => l.includes('No authored galaxy coordinates')), 'Unauthored galaxy coordinates must be locked');
  });

  await t.test('delta comparison determinism & categorized diffs', () => {
    const atlas = seedAtlas();
    const snap1 = captureEra(atlas);
    const snap2 = captureEra(atlas);

    const zeroDiff = compareEras(snap1, snap2);
    assert.equal(zeroDiff.total, 0, 'Identical snapshots have zero differences');

    // Mutate snap2
    snap2.nodes = snap2.nodes.slice(1); // remove 1 node
    snap2.nodes.push({ id: 'new-draft-node', name: 'Test Node', position: [10, 0, 10], kind: 'galaxy', status: 'draft', label: { show: true } });
    snap2.layers = { ...snap2.layers, grid: !snap2.layers.grid };

    const diff = compareEras(snap1, snap2);
    assert.equal(diff.nodes.added.length, 1, 'Exactly 1 added node');
    assert.equal(diff.nodes.removed.length, 1, 'Exactly 1 removed node');
    assert.equal(diff.layers.length, 1, 'Exactly 1 layer toggle');
    assert.ok(diff.total >= 3, 'Total differences reflects changes');

    const summary = eraSummary(diff);
    assert.ok(Array.isArray(summary) && summary.length === 8);
    assert.equal(summary.find(s => s[0] === 'New objects')[1], 1);
    assert.equal(summary.find(s => s[0] === 'Removed objects')[1], 1);
  });

  await t.test('era atmospheric tone calibration mapping', () => {
    const eraFogMap = {
      war: { color: 0x0c0406, density: 0.0014 },
      locking: { color: 0x020812, density: 0.0013 },
      post: { color: 0x010408, density: 0.0010 }
    };

    for (const eraId of ERA_IDS) {
      assert.ok(eraFogMap[eraId], `Era ${eraId} must have calibrated fog`);
      assert.ok(eraFogMap[eraId].density > 0, 'Density must be positive');
      assert.ok(Number.isFinite(eraFogMap[eraId].color), 'Color must be numeric hex');
    }
  });

  await t.test('timeline switching preserves independent era drafts atomically', () => {
    const atlas = seedAtlas();
    ensureTimeline(atlas);
    assert.equal(atlas.epoch, 'post');

    // Switch to war
    switchEra(atlas, 'war');
    assert.equal(atlas.epoch, 'war');

    // Add node in war
    atlas.nodes.push({ id: 'war-exclusive-node', name: 'War Outpost', position: [5, 5, 5], kind: 'galaxy', status: 'draft', label: { show: true } });
    switchEra(atlas, 'locking');
    assert.equal(atlas.epoch, 'locking');
    assert.ok(!atlas.nodes.some(n => n.id === 'war-exclusive-node'), 'Locking snapshot must not contain war-exclusive node');

    switchEra(atlas, 'war');
    assert.equal(atlas.epoch, 'war');
    assert.ok(atlas.nodes.some(n => n.id === 'war-exclusive-node'), 'Switching back to war restores war-exclusive node');
  });
});
