/**
 * Deterministic galaxy morphology classifier and structural telemetry generator.
 * EDITORIAL ILLUSTRATION ONLY — NEVER AUTHORS OFFICIAL CANON ASTRONOMY.
 */

function hash(t) {
  let h = 2166136261;
  for (const c of t) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const GALAXY_CLASSES = Object.freeze([
  { id: 'grand-design', code: 'Sc', name: 'Grand Design Spiral', arms: 2, pitch: 12.0, bar: 0.0, badge: 'GRAND DESIGN Sc' },
  { id: 'barred-spiral', code: 'SBb', name: 'Barred Spiral', arms: 2, pitch: 14.5, bar: 0.45, badge: 'BARRED SPIRAL SBb' },
  { id: 'flocculent-spiral', code: 'SAc', name: 'Flocculent Spiral', arms: 4, pitch: 16.0, bar: 0.0, badge: 'FLOCCULENT SAc' },
  { id: 'pinwheel-spiral', code: 'SABc', name: 'Intermediate Pinwheel', arms: 3, pitch: 13.0, bar: 0.2, badge: 'PINWHEEL SABc' },
  { id: 'lenticular', code: 'S0', name: 'Lenticular Disc', arms: 1, pitch: 8.0, bar: 0.0, badge: 'LENTICULAR S0' },
]);

export function getGalaxyMorphology(node) {
  if (!node || typeof node !== 'object') return null;
  const h = hash(node.id || 'default');
  const morphClass = GALAXY_CLASSES[h % GALAXY_CLASSES.length];
  const size = Number.isFinite(node.size) ? node.size : 1.0;
  const estStarsBln = (Math.round((0.8 + (h % 35) * 0.1) * size * 10) / 10).toFixed(1);
  const haloRadius = Math.round(size * 22);

  return Object.freeze({
    id: node.id,
    morphologyId: morphClass.id,
    code: morphClass.code,
    name: morphClass.name,
    badge: morphClass.badge,
    arms: morphClass.arms,
    pitch: morphClass.pitch,
    barStrength: morphClass.bar,
    estimatedStarsBillions: estStarsBln,
    coreDiameterDU: haloRadius,
    classificationNotice: 'Draft editorial cartography; exact morphology is an illustrative model.',
  });
}
