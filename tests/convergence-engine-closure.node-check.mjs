import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { seedAtlas, ancestry, nodeById, childNodes, EPOCHS, sanitizeAtlas } from '../atlas-data.js';
import { TOPOLOGY } from '../source-topology.js';
import { WORLDSVAULT_IDENTITIES, CANON_REVISION_METADATA, DRAKKEN_CROSSWALK, findCanonEntity } from '../canon-registry.js';
import { createPlannerHandoff, validateHandoff } from '../planner-handoff.js';

test('convergence pass: full exploration and breadcrumb hierarchy (Loop 196)', () => {
  const state = seedAtlas();
  const northReach = state.nodes.find(n => n.id === 'north-reach');
  assert.ok(northReach, 'north-reach galaxy exists');

  const systems = childNodes(state, northReach.id, 'system');
  assert.ok(systems.length > 0, 'north-reach has child systems');
  const sys = systems[0];

  const planets = childNodes(state, sys.id, 'planet');
  assert.ok(planets.length > 0, 'system has child planets');
  const planet = planets[0];

  const ancSys = ancestry(state, sys.id);
  assert.equal(ancSys.length, 2, 'system ancestry includes galaxy and system');
  assert.equal(ancSys[0].id, northReach.id);
  assert.equal(ancSys[1].id, sys.id);

  const ancPlanet = ancestry(state, planet.id);
  assert.equal(ancPlanet.length, 3, 'planet ancestry includes galaxy, system, and planet');
  assert.equal(ancPlanet[0].id, northReach.id);
  assert.equal(ancPlanet[1].id, sys.id);
  assert.equal(ancPlanet[2].id, planet.id);

  // Verify main.js contains planet breadcrumb handling
  const mainSrc = readFileSync('main.js', 'utf8');
  assert.match(mainSrc, /view\.kind==='system'&&state\.selected/, 'main.js updates breadcrumb for selected planet');
  assert.match(mainSrc, /Ascended to.*system overview/, 'up() deselects planet before ascending to galaxy');
});

test('convergence pass: WorldsVault topology and cross-system UX (Loop 197)', () => {
  assert.equal(TOPOLOGY.nodes.length, 11, 'exactly 11 WorldsVault topology nodes');
  assert.equal(TOPOLOGY.edges.length, 6, 'exactly 6 authoritative topology edges');

  for (const n of TOPOLOGY.nodes) {
    assert.ok(n.graphUrl.startsWith('https://'), `node ${n.id} has valid graphUrl`);
    assert.ok(n.sourceUrl.startsWith('https://'), `node ${n.id} has valid sourceUrl`);
    assert.equal(n.canonStatus, 'unknown', `node ${n.id} preserves unknown canon status`);
  }

  const srcGraphSrc = readFileSync('source-graph-ui.js', 'utf8');
  assert.match(srcGraphSrc, /if\(onInspect3D\)/, 'source-graph-ui provides onInspect3D button for all topology nodes');

  // Verify safe planner handoff without state mutation
  const state = seedAtlas();
  const sys = state.nodes.find(n => n.kind === 'system');
  assert.ok(sys);
  const handoff = createPlannerHandoff(state, sys.id);
  const errors = validateHandoff(handoff);
  assert.equal(errors.length, 0, 'handoff generates valid Schema 1.1.0 .ssp.json');
  assert.equal(handoff.schemaVersion, '1.1.0');
  const primary = handoff.branches[0].snapshot.bodies[0];
  assert.equal(primary.plannerClassification, 'NON-CANON SANDBOX');
  assert.equal(primary.sourceCanonStatus, 'unknown');
});

test('convergence pass: reticle lifecycle, pulse and zero-allocation math (Loop 198)', () => {
  const engineSrc = readFileSync('atlas-engine.js', 'utf8');
  assert.match(engineSrc, /group\.userData=\{ringMat,tickMat\}/, 'reticle materials are exposed on userData');
  assert.match(engineSrc, /this\._scratchDelta/, 'tick uses cached _scratchDelta for zero-allocation tracking');
  assert.match(engineSrc, /this\.reticle\.userData\.ringMat\.opacity/, 'reticle breathes with pulsing opacity in tick');

  const mainSrc = readFileSync('main.js', 'utf8');
  assert.match(mainSrc, /UNIVERSAL CONTINUUM · 500 DU/, 'scale gauge reflects all view');
  assert.match(mainSrc, /GALACTIC SECTOR · 100 DU/, 'scale gauge reflects galaxy view');
  assert.match(mainSrc, /STELLAR SYSTEM · ~5 AU SANDBOX/, 'scale gauge reflects system view');
});

test('convergence pass: memory lifecycle, glow caching and telemetry (Loop 199)', () => {
  const engineSrc = readFileSync('atlas-engine.js', 'utf8');
  assert.match(engineSrc, /_glowTextureCache\.set\(key,t\)/, 'glow textures are cached in _glowTextureCache');
  assert.match(engineSrc, /_glowTextureCache\.clear\(\)/, 'dispose clears glow texture cache');
  assert.match(engineSrc, /disposeTree\(this\.reticle\)/, 'dispose properly disposes selection reticle');
  assert.match(engineSrc, /this\.frameStats/, 'engine tracks frameStats telemetry');

  // Verify bundle budget strictly < 225 kB gzip
  const budgetSrc = readFileSync('scripts/bundle-budget.mjs', 'utf8');
  assert.match(budgetSrc, /225000/, 'bundle budget script enforces 225,000 bytes gzip limit');
});

test('convergence pass: campaign invariants and final closure integrity (Loop 200)', () => {
  // 170-year war duration invariant
  for (const e of EPOCHS) {
    if (e.id === 'war') {
      assert.match(e.duration, /170 YEARS/, '170-year Blood Eclipse War duration locked');
      assert.doesNotMatch(e.duration, /^17 YEARS\b/, 'strictly reject 17-year error');
    }
  }
  assert.match(CANON_REVISION_METADATA.authoritativeChronology, /170-year Blood Eclipse War/);

  // Black-hole containment lattice Siege Wall invariant
  const engineSrc = readFileSync('atlas-engine.js', 'utf8');
  assert.match(engineSrc, /if\(z < -110\)continue/, 'Siege Wall boundary (z < -110) strictly starless');

  // 127 stable identities & 58 Drakken strains
  assert.equal(CANON_REVISION_METADATA.stableIdentitiesCount, 127);
  const drakkenKeys = Object.keys(DRAKKEN_CROSSWALK);
  assert.equal(drakkenKeys.length, 58);
  for (const key of drakkenKeys) {
    const entity = findCanonEntity(key);
    assert.ok(entity, `entity ${key} found in canon registry`);
    assert.ok(entity.drakkenMetadata, `entity ${key} has drakkenMetadata`);
    assert.equal(entity.drakkenMetadata.canonApproved, null, 'Drakken strain must have canonApproved: null');
  }

  // Draft demotion safeguard
  const state = seedAtlas();
  const sanitized = sanitizeAtlas(state);
  for (const n of sanitized.nodes) {
    assert.equal(n.status, 'draft', 'all sanitized nodes demoted to draft status');
    assert.equal(n.sourceUrl, null, 'sourceUrl stripped from draft nodes');
  }
});
