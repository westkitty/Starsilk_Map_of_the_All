import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas} from '../atlas-data.js';
import {
  draftNetwork,
  networkArticulationPoints,
  alternativePath,
  networkReport,
  minimumHopPath,
  networkBridges
} from '../network-analysis.js';

const all = { kind: 'all', id: null };
const makeGraph = (nodes, edges) => ({
  nodes: nodes.map(id => ({ id, name: id })),
  edges: edges.map(([id, from, to, kind = 'hookshot']) => ({ id, from, to, kind }))
});

test('articulation points: chain A-B-C identifies B as the single chokepoint hub', () => {
  const g = makeGraph(['a', 'b', 'c'], [
    ['r1', 'a', 'b'],
    ['r2', 'b', 'c']
  ]);
  const chokepoints = networkArticulationPoints(g);
  assert.deepEqual(chokepoints, ['b']);
});

test('articulation points: star graph identifies hub node and excludes leaves', () => {
  const g = makeGraph(['hub', 'leaf1', 'leaf2', 'leaf3', 'leaf4'], [
    ['r1', 'hub', 'leaf1'],
    ['r2', 'hub', 'leaf2'],
    ['r3', 'hub', 'leaf3'],
    ['r4', 'hub', 'leaf4']
  ]);
  const chokepoints = networkArticulationPoints(g);
  assert.deepEqual(chokepoints, ['hub']);
});

test('articulation points: closed cycle has zero chokepoints', () => {
  const g = makeGraph(['a', 'b', 'c', 'd'], [
    ['r1', 'a', 'b'],
    ['r2', 'b', 'c'],
    ['r3', 'c', 'd'],
    ['r4', 'd', 'a']
  ]);
  const chokepoints = networkArticulationPoints(g);
  assert.deepEqual(chokepoints, []);
});

test('articulation points: two cycles joined at a single junction node', () => {
  // Cycle 1: a-b-c-a, Cycle 2: c-d-e-c. Junction is c.
  const g = makeGraph(['a', 'b', 'c', 'd', 'e'], [
    ['r1', 'a', 'b'],
    ['r2', 'b', 'c'],
    ['r3', 'c', 'a'],
    ['r4', 'c', 'd'],
    ['r5', 'd', 'e'],
    ['r6', 'e', 'c']
  ]);
  const chokepoints = networkArticulationPoints(g);
  assert.deepEqual(chokepoints, ['c']);
});

test('alternativePath: identifies secondary bypass when primary route is excluded', () => {
  // Triangle graph: a-b (r1), b-c (r2), a-c (r3)
  const g = makeGraph(['a', 'b', 'c'], [
    ['r1', 'a', 'b'],
    ['r2', 'b', 'c'],
    ['r3', 'a', 'c']
  ]);
  const direct = minimumHopPath(g, 'a', 'b');
  assert.equal(direct.hops, 1);
  assert.deepEqual(direct.routes, ['r1']);

  const bypass = alternativePath(g, 'a', 'b', ['r1']);
  assert.ok(bypass !== null);
  assert.equal(bypass.hops, 2);
  assert.deepEqual(bypass.nodes, ['a', 'c', 'b']);
  assert.deepEqual(bypass.routes, ['r3', 'r2']);
});

test('alternativePath: returns null when single-point bridge has no alternate bypass', () => {
  // Chain: a-b-c
  const g = makeGraph(['a', 'b', 'c'], [
    ['r1', 'a', 'b'],
    ['r2', 'b', 'c']
  ]);
  const bypass = alternativePath(g, 'a', 'c', ['r1']);
  assert.equal(bypass, null);
});

test('networkReport integrates articulation points and counts into intelligence telemetry', () => {
  const state = seedAtlas();
  const g = draftNetwork(state, all);
  const rep = networkReport(g);

  assert.ok(Array.isArray(rep.articulationPoints));
  assert.equal(typeof rep.articulationCount, 'number');
  assert.equal(rep.articulationCount, rep.articulationPoints.length);
  // Bridges and articulation points are distinct topological invariants
  assert.ok(rep.bridgeCount >= 0);
  assert.ok(rep.componentCount === 1);
});
