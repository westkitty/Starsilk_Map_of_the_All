import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedAtlas, validateAtlas } from '../atlas-data.js';
import { eligibleGroup, translatedGroup, validatePolygon, regionReport, MAX_REGIONS } from '../strategic-model.js';

test('spatial editing maturity: keyboard shortcut mapping and input element guards', () => {
  const code = readFileSync(new URL('../spatial-studio.js', import.meta.url), 'utf8');
  assert.ok(code.includes("k==='o'"), 'SpatialStudio supports [O] key for orbit');
  assert.ok(code.includes("k==='m'"), 'SpatialStudio supports [M] key for move');
  assert.ok(code.includes("k==='r'"), 'SpatialStudio supports [R] key for route');
  assert.ok(code.includes("k==='t'"), 'SpatialStudio supports [T] key for label typography');
  assert.ok(code.includes("e.target.closest?.('input,textarea,select')"), 'Keyboard shortcuts are guarded against form focus');
  assert.ok(code.includes('this.keyHandler'), 'Clean keyHandler instance reference used for add/removeEventListener');
});

test('spatial editing maturity: high-frequency coalesced pointer events and snap tick guides', () => {
  const spatialCode = readFileSync(new URL('../spatial-studio.js', import.meta.url), 'utf8');
  assert.ok(spatialCode.includes('getCoalescedEvents'), 'SpatialStudio uses pointer coalesced events to eliminate high-frequency drag lag');
  assert.ok(spatialCode.includes('this.guideTick'), 'SpatialStudio renders snap indicator circle tick');

  const strategicCode = readFileSync(new URL('../strategic-studio.js', import.meta.url), 'utf8');
  assert.ok(strategicCode.includes('getCoalescedEvents'), 'StrategicStudio uses pointer coalesced events during group and vertex dragging');
});

test('spatial editing maturity: strategic group handle displays member count badge', () => {
  const strategicCode = readFileSync(new URL('../strategic-studio.js', import.meta.url), 'utf8');
  assert.ok(strategicCode.includes("this.groupIds.length>1?'✥ '+this.groupIds.length:'✥'"), 'Select handle renders group size badge');
});

test('spatial editing maturity: reference landmarks are strictly excluded from strategic selection', () => {
  const state = seedAtlas();
  const strategicCode = readFileSync(new URL('../strategic-studio.js', import.meta.url), 'utf8');
  assert.ok(strategicCode.includes("n.status==='draft'"), 'StrategicStudio only queries draft nodes');
  assert.ok(strategicCode.includes("n.id!=='worldsvault'"), 'StrategicStudio strictly excludes WorldsVault reference');
  assert.ok(strategicCode.includes("n.id!=='mother'"), 'StrategicStudio strictly excludes Mother reference');

  const vault = state.nodes.find(n => n.id === 'worldsvault');
  assert.equal(vault.status, 'reference', 'WorldsVault has immutable reference status');
  const result = eligibleGroup(state, ['worldsvault'], { kind: 'all', id: null });
  assert.ok(result.error, 'eligibleGroup rejects reference landmarks');
});

test('spatial editing maturity: vertex deletion enforces 3-vertex polygon minimum guard', () => {
  const strategicCode = readFileSync(new URL('../strategic-studio.js', import.meta.url), 'utf8');
  assert.ok(strategicCode.includes('points.length<=3'), 'Vertex deletion enforces 3-vertex minimum guard');
  assert.ok(strategicCode.includes('e.altKey'), 'Alt-click shortcut supported for fast vertex removal');
  assert.ok(strategicCode.includes("'contextmenu'"), 'Context menu (right-click) supported for vertex removal');

  // Verify mathematical polygon validation with <= 2 points fails
  assert.notEqual(validatePolygon([[0, 0], [10, 0]]), null, 'A 2-point polygon is mathematically invalid');
  assert.notEqual(validatePolygon([[0, 0], [10, 0], [0, 0]]), null, 'Degenerate zero-area polygon is invalid');
  assert.equal(validatePolygon([[0, 0], [10, 0], [10, 10], [0, 10]]), null, 'A valid 4-vertex quad passes');
});

test('spatial editing maturity: translatedGroup preserves geometric relations under bounded translation', () => {
  const state = seedAtlas();
  const galaxies = state.nodes.filter(n => n.kind === 'galaxy' && n.status === 'draft').slice(0, 3);
  const ids = galaxies.map(g => g.id);
  const origPos = galaxies.map(g => [...g.position]);

  const translated = translatedGroup(state, ids, { kind: 'all', id: null }, [5, 0, 10], 1);
  assert.equal(translated.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(translated[i].position[0], origPos[i][0] + 5);
    assert.equal(translated[i].position[1], origPos[i][1]);
    assert.equal(translated[i].position[2], origPos[i][2] + 10);
  }
});
