import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas} from '../atlas-data.js';
import {
  draftNetwork,
  networkArticulationPoints,
  articulationPointImpact,
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

test('articulationPointImpact: computes component fragmentation when a chokepoint hub is severed', () => {
  const g = makeGraph(['a', 'b', 'c', 'd'], [
    ['r1', 'a', 'b'],
    ['r2', 'b', 'c'],
    ['r3', 'b', 'd']
  ]);
  // b is the central hub connecting leaves a, c, d
  const impact = articulationPointImpact(g, 'b');
  assert.equal(impact.nodeId, 'b');
  assert.equal(impact.resultingComponents, 3, 'Severing b leaves 3 isolated components: [a], [c], [d]');
  assert.deepEqual(impact.componentSizes, [1, 1, 1]);
});

test('network intelligence: DOM and CSS integration for provenance, bottleneck chips, and pulse overlay', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="networkCutBridges"'), 'index.html contains #networkCutBridges button');
  assert.ok(html.includes('network-provenance-banner'), 'index.html contains provenance banner');

  const css = readFileSync(new URL('../network.css', import.meta.url), 'utf8');
  assert.ok(css.includes('.network-bottleneck-chip'), 'network.css contains .network-bottleneck-chip');
  assert.ok(css.includes('.bottleneck-count-tag'), 'network.css contains .bottleneck-count-tag');
  assert.ok(css.includes('.network-step-dist'), 'network.css contains .network-step-dist');
  assert.ok(css.includes('network-line-pulse'), 'network.css contains network-line-pulse animation');

  const js = readFileSync(new URL('../network-lab.js', import.meta.url), 'utf8');
  assert.ok(js.includes('focusRoute'), 'network-lab.js implements focusRoute()');
  assert.ok(js.includes('networkCutBridges'), 'network-lab.js wires networkCutBridges listener');
  assert.ok(js.includes('articulationPointImpact'), 'network-lab.js calculates articulation point severance impact');
});
