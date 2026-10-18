import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas} from '../atlas-data.js';
import {
  polygonCentroid,
  polygonBounds,
  strategicPosture,
  regionReport,
  validatePolygon
} from '../strategic-model.js';

test('polygonCentroid calculates geometric center of valid polygons accurately', () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const [cx, cz] = polygonCentroid(square);
  assert.ok(Math.abs(cx - 5) < 1e-4, 'cx should be 5');
  assert.ok(Math.abs(cz - 5) < 1e-4, 'cz should be 5');

  const triangle = [[0, 0], [6, 0], [0, 6]];
  const [tx, tz] = polygonCentroid(triangle);
  assert.ok(Math.abs(tx - 2) < 1e-4, 'tx should be 2');
  assert.ok(Math.abs(tz - 2) < 1e-4, 'tz should be 2');

  // Degenerate/empty inputs
  assert.deepEqual(polygonCentroid([]), [0, 0]);
  assert.deepEqual(polygonCentroid(null), [0, 0]);
});

test('polygonBounds computes min/max coordinates and dimensions correctly', () => {
  const polygon = [[-20, -10], [50, -10], [50, 40], [-20, 40]];
  const bounds = polygonBounds(polygon);
  assert.equal(bounds.minX, -20);
  assert.equal(bounds.maxX, 50);
  assert.equal(bounds.minZ, -10);
  assert.equal(bounds.maxZ, 40);
  assert.equal(bounds.centerX, 15);
  assert.equal(bounds.centerZ, 15);
  assert.equal(bounds.width, 70);
  assert.equal(bounds.depth, 50);

  // Fallback for empty
  assert.deepEqual(polygonBounds([]), {
    minX: 0, maxX: 0, minZ: 0, maxZ: 0, centerX: 0, centerZ: 0, width: 0, depth: 0
  });
});

test('strategicPosture categorizes topological connectivity without sovereign assertions', () => {
  assert.equal(strategicPosture(0, 0, 0), 'UNINHABITED SECTOR');
  assert.equal(strategicPosture(0, 0, 3), 'ISOLATED CLUSTER');
  assert.equal(strategicPosture(4, 0, 4), 'AUTONOMOUS / DEFENSIBLE');
  assert.equal(strategicPosture(0, 3, 2), 'CHOKEPOINT / BUFFER POCKET');
  assert.equal(strategicPosture(5, 3, 4), 'CORE NETWORK HUB');
  assert.equal(strategicPosture(2, 6, 4), 'CONTESTED / FRONTIER MARGIN');
});

test('regionReport identifies canonical reference landmarks and reports topological posture', () => {
  const state = seedAtlas();
  
  // Construct a wide survey sector around the All-scale overview covering the WorldsVault landmark
  const vaultNode = state.nodes.find(n => n.id === 'worldsvault');
  assert.ok(vaultNode, 'WorldsVault landmark exists in seed');

  const vx = vaultNode.position[0];
  const vz = vaultNode.position[2];

  const regionEnclosingVault = {
    id: 'survey-vault-sector',
    name: 'WORLDVAULT SURVEY SECTOR',
    affiliation: 'PROVISIONAL DRAFT',
    parentId: null,
    status: 'draft',
    color: '#39bdff',
    points: [
      [vx - 40, vz - 40],
      [vx + 40, vz - 40],
      [vx + 40, vz + 40],
      [vx - 40, vz + 40]
    ]
  };

  assert.equal(validatePolygon(regionEnclosingVault.points), null);

  const report = regionReport(state, regionEnclosingVault);
  assert.ok(Array.isArray(report.referenceLandmarks));
  assert.ok(report.referenceLandmarks.includes(vaultNode.name || 'worldsvault'), 'Detects WorldsVault landmark');
  assert.ok(typeof report.posture === 'string');
  assert.ok(report.posture.length > 0);
});

test('reference landmarks enclosed in a region remain strictly read-only and immutable', () => {
  const state = seedAtlas();
  const vaultNode = state.nodes.find(n => n.id === 'worldsvault');
  assert.equal(vaultNode.status, 'reference', 'WorldsVault is immutable reference status');
  assert.notEqual(vaultNode.status, 'draft', 'WorldsVault is never draft status');
});
