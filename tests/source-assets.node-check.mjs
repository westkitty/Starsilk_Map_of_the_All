import assert from 'node:assert/strict';
import test from 'node:test';
import { seedAtlas } from '../atlas-data.js';
import { getNodeSigilSvg, getAssetProvenance, clearSigilCache } from '../source-assets.js';
import { findCanonEntity } from '../canon-registry.js';

test('Source-Connected Assets & Insignia Suite', async (t) => {
  const atlas = seedAtlas();

  await t.test('graceful fallback on invalid / null / malformed inputs', () => {
    const nullSvg = getNodeSigilSvg(null);
    assert.ok(nullSvg.startsWith('<svg'), 'Null input must yield valid SVG fallback');
    assert.ok(nullSvg.includes('Unknown surveyor glyph'), 'Should identify as fallback');

    const undefSvg = getNodeSigilSvg(undefined);
    assert.ok(undefSvg.startsWith('<svg'));

    const bareSvg = getNodeSigilSvg({});
    assert.ok(bareSvg.startsWith('<svg'));

    const nullProv = getAssetProvenance(null);
    assert.equal(nullProv.assetId, 'sigil-unresolved');
    assert.equal(nullProv.canonStatus, 'NOT_CANON');
    assert.ok(nullProv.authorityNotice.includes('not canon'));
  });

  await t.test('SVG structural compliance and accessibility', () => {
    for (const node of atlas.nodes) {
      const svg = getNodeSigilSvg(node);
      assert.ok(svg.startsWith('<svg'), 'Must begin with <svg tag');
      assert.ok(svg.endsWith('</svg>'), 'Must terminate with </svg>');
      assert.ok(svg.includes('viewBox="0 0 64 64"'), 'Must have standardized 64x64 viewBox');
      assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'Must specify XML namespace');
      assert.ok(svg.includes('role="img"'), 'Must have role=img for accessibility');
      assert.ok(svg.includes('aria-label='), 'Must have aria-label');
      assert.ok(!svg.includes('<script'), 'Must never contain executable script tags');
    }
  });

  await t.test('provenance invariants and strict anti-canon-emblem safeguards', () => {
    for (const node of atlas.nodes) {
      const prov = getAssetProvenance(node);
      assert.ok(prov.assetId.startsWith('sigil-'), 'Asset ID must follow naming format');
      assert.ok(['canonical-reference-marker', 'procedural-vector-editorial'].includes(prov.provenanceType));
      assert.ok(['SOURCE_TOPOLOGY_MARKER', 'ILLUSTRATIVE_EDITORIAL_ONLY'].includes(prov.canonStatus));
      assert.ok(prov.authorityNotice.includes('NOT an official canon emblem'), 'Must strictly disclaim official emblem status');

      if (node.status === 'reference') {
        assert.equal(prov.provenanceType, 'canonical-reference-marker');
        assert.equal(prov.canonStatus, 'SOURCE_TOPOLOGY_MARKER');
      } else {
        assert.equal(prov.provenanceType, 'procedural-vector-editorial');
        assert.equal(prov.canonStatus, 'ILLUSTRATIVE_EDITORIAL_ONLY');
      }
    }
  });

  await t.test('canonical reference landmark specific silhouettes', () => {
    const wvNode = atlas.nodes.find(n => n.id === 'worldsvault');
    assert.ok(wvNode, 'Must have WorldsVault in seed atlas');
    const wvSvg = getNodeSigilSvg(wvNode);
    assert.ok(wvSvg.includes('polygon points="32,6'), 'WorldsVault must use containment lattice polygon');

    const motherNode = atlas.nodes.find(n => n.id === 'mother');
    assert.ok(motherNode, 'Must have Mother in seed atlas');
    const motherSvg = getNodeSigilSvg(motherNode);
    assert.ok(motherSvg.includes('ellipse'), 'Mother must render Aureal Nebula ellipses');

    const wallNode = { id: 'wall-concept', name: 'Siege Wall', color: '#526573', kind: 'landmark' };
    const wallSvg = getNodeSigilSvg(wallNode);
    assert.ok(wallSvg.includes('polygon points="32,8'), 'Siege Wall must render octagonal barrier lines');

    const bloodNode = { id: 'blood-rings-concept', name: 'Blood Rings', color: '#fb7185', kind: 'landmark' };
    const bloodSvg = getNodeSigilSvg(bloodNode);
    assert.ok(bloodSvg.includes('stroke-dasharray="14 6"'), 'Blood rings must render shattered ring arcs');
  });

  await t.test('Drakken strain bio-weapon sigil generation', () => {
    const drakkenNode = { id: 'drakken-bio-strain', name: 'Drakken Spore S4', color: '#f43f5e', kind: 'landmark' };
    // Simulated strain
    const drakkenEntity = findCanonEntity('drakken');
    if (drakkenEntity) {
      const drakkenSvg = getNodeSigilSvg({ id: drakkenEntity.id, name: drakkenEntity.name, color: '#f43f5e', kind: 'landmark' });
      assert.ok(drakkenSvg.includes('polygon points="32,8 50,48'), 'Drakken strain must render biological spike crest');
    }
  });

  await t.test('cache lifecycle and deterministic reuse', () => {
    clearSigilCache();
    const node = atlas.nodes[0];
    const firstCall = getNodeSigilSvg(node);
    const secondCall = getNodeSigilSvg(node);
    assert.equal(firstCall, secondCall, 'Must return cached identical string');

    clearSigilCache();
    const thirdCall = getNodeSigilSvg(node);
    assert.equal(firstCall, thirdCall, 'Must regenerate identical output after cache clear');
  });
});
