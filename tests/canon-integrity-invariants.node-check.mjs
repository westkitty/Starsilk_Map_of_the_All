import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CANON_INVARIANTS,
  CANON_IDENTITIES,
  WORLDSVAULT_IDENTITIES,
  CANON_REVISION_METADATA,
  DRAKKEN_CROSSWALK,
  findCanonEntity,
  searchCanonEntities,
  getCanonicalRelations,
  DOSSIER_URL_BASE
} from '../canon-registry.js';
import { sanitizeAtlas, seedAtlas } from '../atlas-data.js';
import { TOPOLOGY, validateSourceTopology } from '../source-topology.js';

const mainSource = readFileSync(resolve(process.cwd(), 'main.js'), 'utf-8');
const cssSource = readFileSync(resolve(process.cwd(), 'atlas.css'), 'utf-8');

test('canon integrity: strictly locks 170-year War duration and rejects 17 years', () => {
  assert.equal(CANON_INVARIANTS.bloodEclipseWarDurationYears, 170);
  assert.equal(CANON_INVARIANTS.bloodEclipseWarRejectedYears, 17);
  assert.equal(CANON_REVISION_METADATA.authoritativeChronology, '170-year Blood Eclipse War (Years 0–170)');
  assert.doesNotMatch(mainSource, /17-year war/i, 'main.js must never reference invalid 17-year war duration');
});

test('canon integrity: Siege Wall is starless black-hole containment lattice and cosmic absence', () => {
  assert.ok(CANON_INVARIANTS.siegeWallNature.includes('black-hole containment lattice'));
  assert.ok(CANON_INVARIANTS.siegeWallNature.includes('cosmic absence'));
  assert.ok(CANON_INVARIANTS.siegeWallNature.includes('never a glowing magical barrier'));
});

test('canon integrity: Starsilk substrate is programmable, never sentient glow', () => {
  assert.ok(CANON_INVARIANTS.starsilkNature.includes('Programmable cosmological substrate'));
  assert.ok(CANON_INVARIANTS.starsilkNature.includes('never sentient decorative energy'));
});

test('canon integrity: WorldsVault identities maintain unauthored coordinates and valid Dossier provenance', () => {
  assert.equal(WORLDSVAULT_IDENTITIES.length, 11);
  assert.equal(validateSourceTopology().length, 0, 'source topology validation must pass with 0 errors');
  for (const item of WORLDSVAULT_IDENTITIES) {
    assert.equal(item.coordinateStatus, 'unauthored', `${item.id} must have unauthored coordinates`);
    assert.equal(item.group, 'worldsvault');
    assert.ok(item.humanUrl.startsWith(DOSSIER_URL_BASE), `${item.id} must have valid Dossier URL`);
    assert.equal('position' in item, false);
    assert.equal('coordinates' in item, false);
  }
});

test('canon integrity: Drakken bio-weapon crosswalk enforces canonApproved: null invariant', () => {
  assert.equal(Object.keys(DRAKKEN_CROSSWALK).length, 58);
  for (const item of CANON_IDENTITIES) {
    if (item.drakkenMetadata) {
      assert.equal(item.drakkenMetadata.canonApproved, null, `${item.id} matching must not imply canon approval`);
      assert.ok(['OMEGA','HIGH','MEDIUM','EXTREME','MODERATE','LOW','MYTHIC','VARIABLE','HYPERCRITICAL','TRAGIC','MAXIMUM','UNKNOWN'].includes(item.drakkenMetadata.threatTier));
    }
  }
});

test('canon integrity: sanitizeAtlas demotes reference status and prevents imported canon authority', () => {
  const seeded = seedAtlas();
  const refNode = seeded.nodes.find(n => n.status === 'reference');
  assert.ok(refNode, 'seeded atlas must contain a reference node');
  assert.ok(refNode.sourceUrl, 'reference node must have sourceUrl');

  const sanitized = sanitizeAtlas(seeded);
  for (const n of sanitized.nodes) {
    assert.equal(n.status, 'draft', `node ${n.id} must be demoted to draft`);
    assert.equal(n.sourceUrl, null, `node ${n.id} sourceUrl must be cleared`);
  }
});

test('canon integrity: searchCanonEntities and getCanonicalRelations resolve direct-authored topology', () => {
  const vaultHit = searchCanonEntities('WorldsVault');
  assert.ok(vaultHit.some(h => h.id === 'worldsvault'));
  const rels = getCanonicalRelations('mother');
  assert.ok(rels.length > 0);
  assert.equal(rels[0].targetId, 'aureal-nebula');
  assert.equal(rels[0].certainty, 'direct-authored');
});

test('canon integrity: source completeness and cartographic honesty cards present in UI and CSS', () => {
  assert.ok(mainSource.includes('source-integrity-card'), 'main.js must render source-integrity-card');
  assert.ok(mainSource.includes('SOURCE COMPLETENESS & CARTOGRAPHIC HONESTY'), 'main.js must render cartographic honesty title');
  assert.ok(cssSource.includes('.source-integrity-card'), 'atlas.css must define .source-integrity-card style');
  assert.ok(cssSource.includes('.source-repair-badge'), 'atlas.css must define .source-repair-badge style');
});
