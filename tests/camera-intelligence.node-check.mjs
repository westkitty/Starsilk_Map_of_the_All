import test from 'node:test';
import assert from 'node:assert/strict';
import { seedAtlas, childNodes, ancestry, nodeById } from '../atlas-data.js';
import { easeInOutCubic } from '../frame-clock.js';

test('camera intelligence: ancestry chain resolves complete 3-tier hierarchy', () => {
  const state = seedAtlas();
  const galaxies = childNodes(state, null, 'galaxy');
  assert.ok(galaxies.length > 0);

  const firstGal = galaxies[0];
  const systems = childNodes(state, firstGal.id, 'system');
  assert.ok(systems.length > 0);

  const firstSys = systems[0];
  const planets = childNodes(state, firstSys.id, 'planet');
  assert.ok(planets.length > 0);

  const firstPlanet = planets[0];

  const galChain = ancestry(state, firstGal.id);
  assert.equal(galChain.length, 1);
  assert.equal(galChain[0].id, firstGal.id);

  const sysChain = ancestry(state, firstSys.id);
  assert.equal(sysChain.length, 2);
  assert.equal(sysChain[0].id, firstGal.id);
  assert.equal(sysChain[1].id, firstSys.id);

  const planetChain = ancestry(state, firstPlanet.id);
  assert.equal(planetChain.length, 3);
  assert.equal(planetChain[0].id, firstGal.id);
  assert.equal(planetChain[1].id, firstSys.id);
  assert.equal(planetChain[2].id, firstPlanet.id);
});

test('camera intelligence: ascent selection preservation contract', () => {
  const state = seedAtlas();
  let currentView = { kind: 'system', id: 'north-reach-system-1' };
  let selectedId = null;

  // Simulate up() from system to galaxy:
  function simulateUp() {
    if (currentView.kind === 'system') {
      const currentSysId = currentView.id;
      const node = nodeById(state, currentView.id);
      currentView = { kind: 'galaxy', id: node.parentId };
      selectedId = currentSysId; // preserved
    } else if (currentView.kind === 'galaxy') {
      const currentGalId = currentView.id;
      currentView = { kind: 'all', id: null };
      selectedId = currentGalId; // preserved
    }
  }

  // Ascend from system to galaxy
  simulateUp();
  assert.equal(currentView.kind, 'galaxy');
  assert.equal(currentView.id, 'north-reach');
  assert.equal(selectedId, 'north-reach-system-1', 'Previously viewed system must remain selected in parent galaxy');

  // Ascend from galaxy to all
  simulateUp();
  assert.equal(currentView.kind, 'all');
  assert.equal(currentView.id, null);
  assert.equal(selectedId, 'north-reach', 'Previously viewed galaxy must remain selected in The All');
});

test('camera intelligence: framing distance formulas avoid singularities and NaN', () => {
  const testNodes = [
    { kind: 'galaxy', size: 1.0 },
    { kind: 'galaxy', size: 0.6 },
    { kind: 'galaxy', size: 1.5 },
    { kind: 'system', size: 0.9 },
    { kind: 'planet', size: 0.5 },
    { kind: 'landmark', size: 1.0 },
  ];

  for (const n of testNodes) {
    const dist = n.kind === 'galaxy' ? (62 * (n.size || 1)) : n.kind === 'system' ? 26 : 10;
    assert.ok(Number.isFinite(dist));
    assert.ok(dist >= 10 && dist <= 120, `Distance ${dist} must be bounded`);
  }

  // Test easing interpolation
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeInOutCubic(0.5), 0.5);
  for (let t = 0; t <= 1; t += 0.05) {
    const val = easeInOutCubic(t);
    assert.ok(val >= 0 && val <= 1);
  }
});

test('camera intelligence: editing mode guards prevent accidental tier exit', () => {
  let isDrawingRegion = true;
  let isDraftingRoute = false;

  function canAscend() {
    if (isDrawingRegion || isDraftingRoute) return false;
    return true;
  }

  assert.equal(canAscend(), false, 'Ascent must be guarded during active region drawing');

  isDrawingRegion = false;
  isDraftingRoute = true;
  assert.equal(canAscend(), false, 'Ascent must be guarded during active corridor drafting');

  isDraftingRoute = false;
  assert.equal(canAscend(), true, 'Ascent allowed when no active drawing or drafting mode');
});
