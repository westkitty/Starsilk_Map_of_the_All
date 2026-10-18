import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANON_IDENTITIES,
  CANON_INVARIANTS,
  CANON_REPAIR_HIGHLIGHTS,
  findCanonEntity,
  searchCanonEntities,
  listCanonGroups
} from '../canon-registry.js';

test('canon registry contains exactly 127 authoritative stable identities', () => {
  assert.equal(CANON_IDENTITIES.length, 127);
  const groups = listCanonGroups();
  assert.equal(groups.find(g => g.id === 'principal').count, 6);
  assert.equal(groups.find(g => g.id === 'peripheral').count, 41);
  assert.equal(groups.find(g => g.id === 'drakken').count, 60);
  assert.equal(groups.find(g => g.id === 'supporting').count, 20);
});

test('canonical identities strictly declare unauthored coordinates and no fabricated positions', () => {
  for (const item of CANON_IDENTITIES) {
    assert.equal(item.coordinateStatus, 'unauthored', `${item.id} must declare unauthored coordinates`);
    assert.equal('position' in item, false, `${item.id} must never assert physical position`);
    assert.equal('coordinates' in item, false, `${item.id} must never assert spatial coordinates`);
    assert.ok(item.humanUrl.startsWith('https://westkitty.github.io/Starsilk_Character_Dossier/entities/'));
    assert.ok(item.sourcePath.startsWith('src/content/sections/'));
    assert.ok(item.sourcePath.endsWith('.body.html'));
  }
});

test('canon invariants lock non-negotiable narrative requirements', () => {
  assert.equal(CANON_INVARIANTS.bloodEclipseWarDurationYears, 170);
  assert.equal(CANON_INVARIANTS.bloodEclipseWarRejectedYears, 17);
  assert.equal(CANON_INVARIANTS.rubyEclipseYear, 121);
  assert.ok(CANON_INVARIANTS.siegeWallNature.includes('black-hole containment lattice'));
  assert.ok(CANON_INVARIANTS.starsilkNature.includes('Programmable cosmological substrate'));
  assert.equal(CANON_INVARIANTS.causalSequence.length, 3);
  assert.ok(CANON_INVARIANTS.causalSequence[0].includes('weaponize Starsilk'));
  assert.ok(CANON_INVARIANTS.causalSequence[1].includes('heliocide'));
  assert.ok(CANON_INVARIANTS.causalSequence[2].includes('Siege Wall'));
});

test('canon search resolves entities cleanly by ID, partial query and category filter', () => {
  const god = findCanonEntity('shard-god');
  assert.ok(god);
  assert.equal(god.group, 'principal');

  const drakkenMatches = searchCanonEntities('granithelion', 'drakken');
  assert.equal(drakkenMatches.length, 1);
  assert.equal(drakkenMatches[0].id, 'drk-granithelion');

  const peripheralAll = searchCanonEntities('', 'peripheral');
  assert.equal(peripheralAll.length, 41);

  const repairCritical = CANON_REPAIR_HIGHLIGHTS.filter(r => r.severity === 'CRITICAL');
  assert.ok(repairCritical.length >= 3);
});

test('mother entity resolves as physical homeworld with canonical Dossier provenance', () => {
  const mother = findCanonEntity('mother');
  assert.ok(mother);
  assert.equal(mother.id, 'mother');
  assert.equal(mother.group, 'drakken');
  assert.equal(mother.humanUrl, 'https://westkitty.github.io/Starsilk_Character_Dossier/entities/mother/');
  assert.equal(mother.sourcePath, 'src/content/sections/mother.body.html');
  assert.equal(mother.coordinateStatus, 'unauthored');

  const repairMother = CANON_REPAIR_HIGHLIGHTS.find(r => r.id === 'AT-010');
  assert.ok(repairMother);
  assert.ok(repairMother.subject.includes('Mother is a physical homeworld'));

  const repair170 = CANON_REPAIR_HIGHLIGHTS.find(r => r.id === 'AT-001');
  assert.ok(repair170);
  assert.ok(repair170.subject.includes('170-year Blood Eclipse War duration'));
});
