import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANON_IDENTITIES,
  DRAKKEN_CROSSWALK,
  getCanonicalRelations,
  findCanonEntity
} from '../canon-registry.js';
import { TOPOLOGY } from '../source-topology.js';

test('source crosswalk: all 127 canonical identities provide valid Dossier URLs and unauthored coordinates', () => {
  assert.equal(CANON_IDENTITIES.length, 127);
  for (const entity of CANON_IDENTITIES) {
    assert.ok(entity.id && typeof entity.id === 'string');
    assert.ok(entity.humanUrl.startsWith('https://westkitty.github.io/Starsilk_Character_Dossier/entities/'));
    assert.equal(entity.coordinateStatus, 'unauthored');
    assert.equal('position' in entity, false);
    assert.equal('coordinates' in entity, false);
  }
});

test('source crosswalk: exactly 58 published Drakken strains mapped with strict non-approval invariant', () => {
  const crosswalkKeys = Object.keys(DRAKKEN_CROSSWALK);
  assert.equal(crosswalkKeys.length, 58, 'DRAKKEN_CROSSWALK must contain exactly 58 published strains');

  let mappedDrakkenCount = 0;
  for (const entity of CANON_IDENTITIES) {
    if (entity.drakkenMetadata) {
      mappedDrakkenCount++;
      assert.ok(entity.drakkenMetadata.candidateId.startsWith('DRK-F'), 'Candidate ID must follow DRK-Fxxx format');
      assert.ok(entity.drakkenMetadata.threatTier, 'Threat tier must be declared');
      assert.ok(entity.drakkenMetadata.affinity, 'Affinity must be declared');
      assert.ok(entity.drakkenMetadata.sourceAnchor.startsWith('S4 L'), 'Source anchor must cite S4 line');
      assert.equal(entity.drakkenMetadata.canonApproved, null, 'Invariant: candidate crosswalk match is NOT canon approval');
    }
  }
  assert.equal(mappedDrakkenCount, 58);
});

test('source crosswalk: specific bioweapon strains verify with expected metadata', () => {
  const magma = findCanonEntity('drk-magma-pleuron');
  assert.ok(magma);
  assert.equal(magma.drakkenMetadata.candidateId, 'DRK-F001');
  assert.equal(magma.drakkenMetadata.threatTier, 'OMEGA');
  assert.equal(magma.drakkenMetadata.affinity, 'THERMOFERROUS');
  assert.equal(magma.drakkenMetadata.sourceAnchor, 'S4 L173');

  const viral = findCanonEntity('drk-viral-bastion');
  assert.ok(viral);
  assert.equal(viral.drakkenMetadata.candidateId, 'DRK-F058');
  assert.equal(viral.drakkenMetadata.threatTier, 'MAXIMUM');
});

test('source crosswalk: getCanonicalRelations resolves direct-authored topology edges without coordinates', () => {
  // Test Mother
  const motherRels = getCanonicalRelations('mother');
  assert.ok(motherRels.length > 0, 'Mother should have at least one canonical relation');
  const motherNebulaRel = motherRels.find(r => r.targetId === 'aureal-nebula' && r.relation === 'located-in');
  assert.ok(motherNebulaRel, 'Mother must link to Aureal Nebula with located-in');
  for (const r of motherRels) {
    assert.equal(r.geometryStatus, 'unknown');
    assert.equal('position' in r, false);
    assert.equal('distance' in r, false);
  }

  // Test WorldsVault
  const wvRels = getCanonicalRelations('worldsvault');
  assert.ok(wvRels.length > 0, 'WorldsVault should have direct authored relations');
  const containsTemplate = wvRels.find(r => r.targetId === 'extinct-template-set' && r.relation === 'contains');
  assert.ok(containsTemplate, 'WorldsVault must contain extinct-template-set');

  // Test invalid or missing ID queries
  assert.deepEqual(getCanonicalRelations(''), []);
  assert.deepEqual(getCanonicalRelations(null), []);
  assert.deepEqual(getCanonicalRelations('unknown-nonexistent-entity-999'), []);
});

test('source crosswalk: TOPOLOGY integrity check reflects author-defined nodes and edges', () => {
  assert.equal(TOPOLOGY.nodes.length, 11);
  assert.equal(TOPOLOGY.edges.length, 6);
  for (const edge of TOPOLOGY.edges) {
    assert.ok(edge.from);
    assert.ok(edge.to);
    assert.ok(edge.relation);
    assert.equal(edge.geometryStatus, 'unknown');
  }
});
