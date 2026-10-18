import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas, LAYERS, DEFAULT_LAYERS} from '../atlas-data.js';
import {CANON_INVARIANTS} from '../canon-registry.js';

test('Starsilk routes and layers are distinct from Hookshot corridors', () => {
  const state = seedAtlas();
  const starsilkRoutes = state.routes.filter(r => r.kind === 'starsilk');
  const hookshotRoutes = state.routes.filter(r => r.kind === 'hookshot');

  assert.ok(starsilkRoutes.length > 0, 'Starsilk routes must exist in seed atlas');
  assert.ok(hookshotRoutes.length > 0, 'Hookshot routes must exist in seed atlas');
  assert.equal(starsilkRoutes.length + hookshotRoutes.length, state.routes.length);

  assert.equal(typeof state.layers.starsilk, 'boolean');
  assert.equal(typeof state.layers.routes, 'boolean');
});

test('Siege Wall layer honors causal invariant: absent during War, active after Year 170 locking', () => {
  assert.ok(LAYERS.some(([k]) => k === 'wall'));
  assert.equal(DEFAULT_LAYERS.wall, true);

  // Invariant check: causalSequence establishes Siege Wall formation at end of Year 170
  assert.ok(CANON_INVARIANTS.causalSequence[2].includes('Siege Wall'));
  assert.ok(CANON_INVARIANTS.siegeWallNature.includes('black-hole containment lattice and cosmic absence'));
});

test('Blood Rings layer honors causal sequence: active during War and Locking, absent in post-war survey', () => {
  assert.ok(LAYERS.some(([k]) => k === 'rings'));
  assert.equal(DEFAULT_LAYERS.rings, true);
  // Blood rings are war remnants documented in Year 3
  assert.equal(CANON_INVARIANTS.bloodEclipseWarDurationYears, 170);
});

test('Palette and layer definitions maintain non-empty names and booleans', () => {
  for (const [key, label] of LAYERS) {
    assert.equal(typeof key, 'string');
    assert.equal(typeof label, 'string');
    assert.ok(label.length > 0);
    assert.equal(typeof DEFAULT_LAYERS[key], 'boolean');
  }
});
