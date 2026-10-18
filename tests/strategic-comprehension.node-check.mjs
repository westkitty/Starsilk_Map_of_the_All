import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedAtlas, validateAtlas } from '../atlas-data.js';
import { strategicAnalysis, regionReport, strategicPosture, validatePolygon } from '../strategic-model.js';
import { switchEra, cloneEra, ensureTimeline, syncEra } from '../temporal-model.js';

test('strategic comprehension: strategicAnalysis calculates topological indices without NaN', () => {
  const state = seedAtlas();
  const testRegion = {
    id: 'test-sector-1',
    name: 'TEST SECTOR ALPHA',
    affiliation: 'PROVISIONAL SURVEY',
    parentId: null,
    status: 'draft',
    color: '#38bdf8',
    points: [[-50, -50], [50, -50], [50, 50], [-50, 50]]
  };

  const analysis = strategicAnalysis(state, testRegion);
  assert.ok(Number.isFinite(analysis.count), 'Count is finite');
  assert.ok(Number.isFinite(analysis.internal), 'Internal count is finite');
  assert.ok(Number.isFinite(analysis.frontier), 'Frontier count is finite');
  assert.ok(Number.isFinite(analysis.displayArea), 'Display area is finite');
  assert.ok(analysis.displayArea > 0, 'Area is strictly positive for non-degenerate quad');
  assert.ok(Number.isFinite(analysis.density), 'Density is finite');
  assert.ok(Number.isFinite(analysis.cohesionIndex), 'Cohesion index is finite');
  assert.ok(Number.isFinite(analysis.frontierExposure), 'Frontier exposure is finite');
  assert.ok(Number.isFinite(analysis.enclosedCorridorRatio), 'Enclosed corridor ratio is finite');
  assert.ok(typeof analysis.posture === 'string', 'Posture is a valid string');
});

test('strategic comprehension: handles zero-area or empty region safely', () => {
  const state = seedAtlas();
  const emptyRegion = {
    id: 'empty-sector',
    name: 'EMPTY SECTOR',
    affiliation: 'NONE',
    parentId: null,
    status: 'draft',
    color: '#38bdf8',
    points: [[5000, 5000], [5001, 5000], [5001, 5001]]
  };

  const analysis = strategicAnalysis(state, emptyRegion);
  assert.equal(analysis.count, 0, 'No nodes enclosed in distant sector');
  assert.equal(analysis.internal, 0);
  assert.equal(analysis.frontier, 0);
  assert.equal(analysis.density, 0);
  assert.equal(analysis.cohesionIndex, 0);
  assert.equal(analysis.frontierExposure, 0);
  assert.equal(analysis.enclosedCorridorRatio, 0);
  assert.equal(analysis.posture, 'UNINHABITED SECTOR');
});

test('strategic comprehension: canonical landmark containment detection', () => {
  const state = seedAtlas();
  const vault = state.nodes.find(n => n.id === 'worldsvault');
  assert.ok(vault, 'WorldsVault exists in seed data');
  const [vx, , vz] = vault.position;

  // Quad enclosing WorldsVault
  const vaultEnclosingRegion = {
    id: 'vault-survey-sector',
    name: 'CONTAINMENT PERIMETER',
    affiliation: 'PROVISIONAL',
    parentId: null,
    status: 'draft',
    color: '#f59e0b',
    points: [[vx - 15, vz - 15], [vx + 15, vz - 15], [vx + 15, vz + 15], [vx - 15, vz + 15]]
  };

  const analysis = strategicAnalysis(state, vaultEnclosingRegion);
  assert.ok(analysis.referenceLandmarks.length > 0, 'Detects enclosed reference landmark');
  assert.ok(analysis.referenceLandmarks.includes(vault.name || 'worldsvault'), 'Names WorldsVault as reference');
  // Confirm WorldsVault itself is not counted as an editable draft member
  assert.ok(!analysis.memberIds.includes('worldsvault'), 'Immutable reference is excluded from editable draft members');
});

test('strategic comprehension: DOM and CSS integration for legend, analysis grid, and alerts', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="strategyLegend"'), 'index.html contains #strategyLegend');
  assert.ok(html.includes('id="strategyRegionAnalysis"'), 'index.html contains #strategyRegionAnalysis');
  assert.ok(html.includes('STRATEGIC POSTURE TAXONOMY'), 'Legend displays taxonomy header');

  const css = readFileSync(new URL('../strategic.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.strategy-legend'), 'strategic.css contains .strategy-legend');
  assert.ok(css.includes('.strategy-analysis-grid'), 'strategic.css contains .strategy-analysis-grid');
  assert.ok(css.includes('.strategy-containment-alert'), 'strategic.css contains .strategy-containment-alert');
  assert.ok(css.includes('.region-badge-posture'), 'strategic.css contains .region-badge-posture');

  const js = readFileSync(new URL('../strategic-studio.js', import.meta.url), 'utf8');
  assert.ok(js.includes('strategicAnalysis'), 'strategic-studio.js imports and invokes strategicAnalysis');
  assert.ok(js.includes('region-badge-posture'), 'strategic-studio.js displays posture on 3D region badge');
  assert.ok(js.includes('CANONICAL SOURCE ANCHOR ENCLOSED'), 'strategic-studio.js displays canonical anchor containment notice');
});

test('strategic comprehension: era snapshot isolation for strategic regions', () => {
  const state = seedAtlas();
  state.epoch = 'post';
  ensureTimeline(state);
  if (!state.regions) state.regions = [];

  const postRegion = {
    id: 'post-era-survey',
    name: 'POST-SIEGE RECONNAISSANCE',
    affiliation: 'PROVISIONAL',
    parentId: null,
    status: 'draft',
    color: '#38bdf8',
    points: [[-30, -30], [30, -30], [30, 30], [-30, 30]]
  };
  state.regions.push(postRegion);
  syncEra(state);
  assert.equal(validateAtlas(state).length, 0, 'Atlas validates with new draft region');

  // Switch to war era: region should not exist in war era snapshot
  switchEra(state, 'war');
  assert.equal(state.epoch, 'war');
  const warRegions = state.regions || [];
  assert.ok(!warRegions.some(r => r.id === 'post-era-survey'), 'Post-era region does not bleed into war era');

  // Switch back to post era: region is restored intact
  switchEra(state, 'post');
  assert.equal(state.epoch, 'post');
  assert.ok(state.regions.some(r => r.id === 'post-era-survey'), 'Post-era region is safely preserved in post snapshot');
});
