import assert from 'node:assert/strict';
import test from 'node:test';
import { seedAtlas, childNodes } from '../atlas-data.js';
import { getStarClassification, getPlanetClassification } from '../stellar-telemetry.js';

test('Deep Stellar Telemetry Suite', async (t) => {
  const atlas = seedAtlas();

  await t.test('graceful fallback on empty / null / malformed inputs', () => {
    assert.equal(getStarClassification(null), null);
    assert.equal(getStarClassification(undefined), null);
    assert.equal(getStarClassification('not-an-object'), null);

    assert.equal(getPlanetClassification(null), null);
    assert.equal(getPlanetClassification(undefined), null);
    assert.equal(getPlanetClassification(42), null);
  });

  await t.test('star classification determinism and spectral parameters', () => {
    const systems = atlas.nodes.filter(n => n.kind === 'system');
    assert.ok(systems.length > 0, 'Must have seed systems');

    for (const sys of systems) {
      const c1 = getStarClassification(sys);
      const c2 = getStarClassification(sys);
      assert.deepEqual(c1, c2, 'Classification must be purely deterministic');
      assert.equal(c1.id, sys.id);
      assert.ok(c1.starName.includes(sys.name));
      assert.ok(typeof c1.spectralType === 'string' && c1.spectralType.length > 5);
      assert.ok(Number.isFinite(c1.temperatureK) && c1.temperatureK >= 3000);
      assert.ok(Number.isFinite(c1.luminositySol) && c1.luminositySol > 0);
      assert.ok(c1.coronaColor.startsWith('#'));
      assert.ok(c1.notice.includes('not canon'), 'Must include non-canon disclaimer');
    }
  });

  await t.test('planet classification across orbital hierarchies', () => {
    const planets = atlas.nodes.filter(n => n.kind === 'planet');
    assert.ok(planets.length > 0, 'Must have seed planets');

    for (const [idx, planet] of planets.entries()) {
      const p1 = getPlanetClassification(planet, idx);
      const p2 = getPlanetClassification(planet, idx);
      assert.deepEqual(p1, p2, 'Planet telemetry must be deterministic');
      assert.equal(p1.id, planet.id);
      assert.equal(p1.planetName, planet.name);
      assert.ok(['TERRESTRIAL', 'GAS GIANT', 'ICE GIANT', 'CHTHONIAN', 'CRYO WORLD'].includes(p1.badge));
      assert.ok(Number(p1.approxAU) > 0);
      assert.ok(Number(p1.approxPeriodDays) > 0);
      assert.ok(typeof p1.hasMoons === 'boolean');
      assert.ok(typeof p1.hasRings === 'boolean');
      assert.ok(p1.notice.includes('not canon'), 'Must disclaim canon authority');
    }
  });

  await t.test('system children consistency with parent relationships', () => {
    const systems = atlas.nodes.filter(n => n.kind === 'system');
    for (const sys of systems) {
      const planetsInSys = childNodes(atlas, sys.id, 'planet');
      for (const [idx, planet] of planetsInSys.entries()) {
        const info = getPlanetClassification(planet, idx);
        assert.ok(info, 'Each child planet must have valid telemetry');
        if (idx === 1) {
          assert.equal(info.hasRings, true, 'Second planet slot should exhibit ring structure');
        }
      }
    }
  });
});
