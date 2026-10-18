/**
 * Deterministic stellar system and planetary classification telemetry.
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

export function getStarClassification(sysNode) {
  if (!sysNode || typeof sysNode !== 'object') return null;
  const h = hash(sysNode.id || 'default');
  const isBlue = (h % 3 === 0) || (sysNode.color && sysNode.color.toLowerCase().includes('91c4ff'));
  const spectralType = isBlue ? 'Class A2V (White-Azure)' : (h % 2 === 0 ? 'Class G2V (Yellow Dwarf)' : 'Class K1V (Orange Subgiant)');
  const temperatureK = isBlue ? 8900 : (h % 2 === 0 ? 5778 : 4900);
  const luminositySol = isBlue ? 14.5 : (h % 2 === 0 ? 1.0 : 0.62);
  const coronaColor = isBlue ? '#a5f3fc' : '#fed7aa';

  return Object.freeze({
    id: sysNode.id,
    starName: `${sysNode.name} PRIME`,
    spectralType,
    temperatureK,
    luminositySol,
    coronaColor,
    isBlue,
    notice: 'Editorial sandbox classification for System Planner orbital handoff; not canon.',
  });
}

export function getPlanetClassification(planetNode, orbitalIndex = 0) {
  if (!planetNode || typeof planetNode !== 'object') return null;
  const size = planetNode.size || 0.6;
  let type = 'Terrestrial Silicate';
  let badge = 'TERRESTRIAL';
  if (size >= 1.2) {
    type = 'Gas Giant (Jovian)';
    badge = 'GAS GIANT';
  } else if (size >= 0.9) {
    type = 'Ice Giant (Neptunian)';
    badge = 'ICE GIANT';
  } else if (orbitalIndex === 0) {
    type = 'Chthonian Metallic';
    badge = 'CHTHONIAN';
  } else if (orbitalIndex >= 2) {
    type = 'Cryo-Ocean / Permafrost';
    badge = 'CRYO WORLD';
  }

  const au = (0.5 + orbitalIndex * 0.72).toFixed(2);
  const periodDays = Math.round(365.25 * Math.pow(Number(au), 1.5));

  return Object.freeze({
    id: planetNode.id,
    planetName: planetNode.name,
    classification: type,
    badge,
    approxAU: au,
    approxPeriodDays: periodDays,
    hasMoons: size >= 0.8,
    hasRings: orbitalIndex === 1,
    notice: 'Illustrative planetary classification; not canon.',
  });
}
