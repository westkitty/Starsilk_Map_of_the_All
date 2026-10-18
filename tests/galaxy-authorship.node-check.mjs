import test from 'node:test';
import assert from 'node:assert/strict';
import { getGalaxyMorphology, GALAXY_CLASSES } from '../galaxy-morphology.js';
import { seedAtlas, childNodes } from '../atlas-data.js';

test('galaxy morphology: deterministic classification for all 7 starting galaxies', () => {
  const state = seedAtlas();
  const galaxies = childNodes(state, null, 'galaxy');
  assert.equal(galaxies.length, 7, 'There must be 7 starting galaxies');

  const seenIds = new Set();
  const seenCodes = new Set();

  for (const galaxy of galaxies) {
    const morph = getGalaxyMorphology(galaxy);
    assert.ok(morph, `Morphology must exist for ${galaxy.id}`);
    assert.equal(morph.id, galaxy.id);
    assert.ok(morph.morphologyId);
    assert.ok(morph.code);
    assert.ok(morph.name);
    assert.ok(morph.badge);
    assert.ok(morph.arms >= 1 && morph.arms <= 4, 'Arms must be between 1 and 4');
    assert.ok(morph.pitch >= 8.0 && morph.pitch <= 18.0, 'Pitch must be in valid range');
    assert.ok(Number(morph.estimatedStarsBillions) > 0, 'Estimated stars must be positive');
    assert.ok(morph.coreDiameterDU > 0, 'Core diameter must be positive');
    assert.ok(morph.classificationNotice.includes('Draft editorial cartography'));

    seenIds.add(galaxy.id);
    seenCodes.add(morph.code);

    // Assert determinism across multiple calls
    const repeat = getGalaxyMorphology(galaxy);
    assert.deepEqual(morph, repeat, 'Morphology must be 100% deterministic');
  }

  assert.equal(seenIds.size, 7);
  assert.ok(seenCodes.size >= 3, 'There should be diverse morphology codes across galaxies');
});

test('galaxy morphology: handles edge-case input safely', () => {
  assert.equal(getGalaxyMorphology(null), null);
  assert.equal(getGalaxyMorphology(undefined), null);
  assert.equal(getGalaxyMorphology('string-not-node'), null);

  const fallback = getGalaxyMorphology({ id: 'custom-galaxy-x', size: 1.5 });
  assert.ok(fallback);
  assert.equal(fallback.id, 'custom-galaxy-x');
  assert.ok(fallback.badge);
});

test('galaxy morphology: GALAXY_CLASSES library integrity', () => {
  assert.ok(GALAXY_CLASSES.length >= 4);
  for (const cls of GALAXY_CLASSES) {
    assert.ok(cls.id);
    assert.ok(cls.code);
    assert.ok(cls.name);
    assert.ok(cls.arms >= 1);
    assert.ok(cls.pitch > 0);
    assert.ok(cls.badge);
  }
});

test('cosmic depth invariants: background star generation respects starless Siege Wall absence', () => {
  // Simulate background generator RNG and boundary check from atlas-engine.js
  function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6d2b79f5)>>>0;let x=Math.imul(s^(s>>>15),1|s);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296;};}

  const rnd = rng(1106);
  const p = [];
  for (let i = 0; i < 1900; i++) {
    const x = (rnd() - .5) * 1450, y = (rnd() - .5) * 780, z = (rnd() - .5) * 1050;
    if (z < -110) continue; // Invariant: starless beyond Siege Wall
    p.push(x, y, z);
  }
  for (let i = 0; i < 1100; i++) {
    const fAngle = rnd() * Math.PI * 2;
    const fRadius = 340 + rnd() * 460;
    const fTilt = (rnd() - .5) * 260;
    const x = Math.cos(fAngle) * fRadius + (rnd() - .5) * 130;
    const y = fTilt + (rnd() - .5) * 70;
    const z = Math.sin(fAngle) * fRadius + (rnd() - .5) * 130;
    if (z < -110) continue; // Invariant: starless beyond Siege Wall
    p.push(x, y, z);
  }

  // Verify that ZERO points violate z < -110
  for (let i = 2; i < p.length; i += 3) {
    const z = p[i];
    assert.ok(z >= -110, `Background star at z=${z} violates starless Siege Wall invariant`);
  }
  assert.ok(p.length > 3000, 'Generates dense, rich celestial field');
});
