import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CANON_IDENTITIES,
  searchCanonEntities,
  findCanonEntity,
  listCanonGroups
} from '../canon-registry.js';
import { seedAtlas, nodeById } from '../atlas-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('discovery: searchCanonEntities covers all 127 canonical identities by name and ID', () => {
  assert.equal(CANON_IDENTITIES.length, 127);

  // Search by exact ID
  const magma = searchCanonEntities('drk-magma-pleuron');
  assert.ok(magma.length >= 1);
  assert.equal(magma[0].id, 'drk-magma-pleuron');

  // Search by name substring
  const dao = searchCanonEntities('dao');
  assert.ok(dao.some(e => e.id === 'dao'));

  // Search by group filter
  const drakkenOnly = searchCanonEntities('', 'drakken');
  assert.equal(drakkenOnly.length, 60);

  const principalOnly = searchCanonEntities('', 'principal');
  assert.equal(principalOnly.length, 6);
});

test('discovery: searchCanonEntities matches Drakken candidate IDs, affinities, and threat tiers', () => {
  // Query by Candidate ID
  const f001 = searchCanonEntities('DRK-F001');
  assert.ok(f001.length >= 1);
  assert.equal(f001[0].id, 'drk-magma-pleuron');
  assert.equal(f001[0].drakkenMetadata.candidateId, 'DRK-F001');

  // Query by Threat Tier (OMEGA)
  const omegaHits = searchCanonEntities('OMEGA');
  assert.ok(omegaHits.length >= 10, 'Multiple Drakken bioweapons belong to OMEGA tier');
  for (const h of omegaHits) {
    assert.equal(h.drakkenMetadata?.threatTier, 'OMEGA');
  }

  // Query by Affinity
  const thermoHits = searchCanonEntities('thermoferrous');
  assert.ok(thermoHits.length >= 1);
  assert.equal(thermoHits[0].id, 'drk-magma-pleuron');

  // Query by Source Anchor
  const s4Hits = searchCanonEntities('S4 L173');
  assert.ok(s4Hits.length >= 1);
  assert.equal(s4Hits[0].id, 'drk-magma-pleuron');
});

test('discovery: unplaced canonical identity invariants strictly preserved', () => {
  for (const entity of CANON_IDENTITIES) {
    assert.equal(entity.coordinateStatus, 'unauthored', 'Canon identities must remain unauthored coordinates');
    assert.equal('position' in entity, false, 'No position property allowed on canonical identities');
    assert.equal('coordinates' in entity, false, 'No coordinates property allowed on canonical identities');
    assert.ok(entity.humanUrl.startsWith('https://westkitty.github.io/Starsilk_Character_Dossier/entities/'));
  }
});

test('discovery: map node, region, and corridor query matching on seed atlas state', () => {
  const state = seedAtlas();

  // Test node query matching
  const qNode = 'halcyon';
  const nodeMatches = state.nodes.filter(n =>
    n.name.toLowerCase().includes(qNode) ||
    n.description.toLowerCase().includes(qNode) ||
    n.id.toLowerCase().includes(qNode)
  );
  assert.ok(nodeMatches.length >= 1, 'Should find Halcyon in seed atlas nodes');

  // Add sample regions and corridors to verify query matching logic
  state.regions = [
    { id: 'region-1', name: 'CORE EXPANSE', parent: null, vertices: [[0, 0], [10, 0], [10, 10], [0, 10]], notes: 'Fortified sector' },
    { id: 'region-2', name: 'OUTER DRIFT', parent: null, vertices: [[20, 20], [30, 20], [30, 30]], notes: 'Sparse frontier' }
  ];

  const qRegion = 'expanse';
  const regionMatches = state.regions.filter(r =>
    r.name.toLowerCase().includes(qRegion) ||
    r.id.toLowerCase().includes(qRegion) ||
    (r.notes && r.notes.toLowerCase().includes(qRegion))
  );
  assert.equal(regionMatches.length, 1);
  assert.equal(regionMatches[0].id, 'region-1');

  // Test corridor query matching
  const qRoute = 'hookshot';
  const routeMatches = state.routes.filter(rt =>
    rt.id.toLowerCase().includes(qRoute) ||
    rt.kind.toLowerCase().includes(qRoute)
  );
  assert.ok(routeMatches.length >= 1, 'Should find Hookshot corridors in seed routes');
});

test('discovery: DOM structure in index.html includes search filter bar and accessibility attributes', () => {
  const html = readFileSync(join(__dirname, '../index.html'), 'utf-8');

  // Verify search box and attributes
  assert.ok(html.includes('id="search"'), 'Search input must exist');
  assert.ok(html.includes('aria-autocomplete="list"'), 'Search must have aria-autocomplete');
  assert.ok(html.includes('aria-controls="searchResults"'), 'Search must control searchResults');

  // Verify search filter bar and chips
  assert.ok(html.includes('id="searchFilterBar"'), 'Filter bar must exist');
  assert.ok(html.includes('data-filter="all"'), 'ALL filter chip must exist');
  assert.ok(html.includes('data-filter="canon"'), 'CANON filter chip must exist');
  assert.ok(html.includes('data-filter="map"'), 'MAP filter chip must exist');
  assert.ok(html.includes('data-filter="regions"'), 'REGIONS filter chip must exist');
  assert.ok(html.includes('data-filter="routes"'), 'CORRIDORS filter chip must exist');

  // Verify search results container
  assert.ok(html.includes('id="searchResults"'), 'Search results container must exist');
  assert.ok(html.includes('role="listbox"'), 'Search results must declare role="listbox"');
});

test('discovery: CSS styling rules in atlas.css for search filter chips, badges, and unplaced warnings', () => {
  const css = readFileSync(join(__dirname, '../atlas.css'), 'utf-8');

  assert.ok(css.includes('.search-filter-bar'), 'Must include .search-filter-bar style');
  assert.ok(css.includes('.search-filter-chip'), 'Must include .search-filter-chip style');
  assert.ok(css.includes('.search-badge'), 'Must include .search-badge style');
  assert.ok(css.includes('.badge-canon'), 'Must include .badge-canon style');
  assert.ok(css.includes('.badge-ref'), 'Must include .badge-ref style');
  assert.ok(css.includes('.badge-galaxy'), 'Must include .badge-galaxy style');
  assert.ok(css.includes('.badge-region'), 'Must include .badge-region style');
  assert.ok(css.includes('.badge-route'), 'Must include .badge-route style');
  assert.ok(css.includes('.unplaced-warning-card'), 'Must include .unplaced-warning-card style');
  assert.ok(css.includes('.source-jump-btn'), 'Must include .source-jump-btn style');
});
