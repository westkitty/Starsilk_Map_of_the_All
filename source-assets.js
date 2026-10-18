/**
 * source-assets.js
 * High-performance, offline-first procedural vector asset and insignia engine.
 * EDITORIAL ILLUSTRATION ONLY — NEVER AUTHORS OR IMPLIES OFFICIAL CANON EMBLEMS.
 */

import { getGalaxyMorphology } from './galaxy-morphology.js';
import { getStarClassification, getPlanetClassification } from './stellar-telemetry.js';
import { findCanonEntity } from './canon-registry.js';

const sigilCache = new Map();

function hash(t) {
  let h = 2166136261;
  const str = String(t || '');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
}

function buildWorldsVaultSigil(color) {
  return `
    <polygon points="32,6 54,19 54,45 32,58 10,45 10,19" stroke="${color}" stroke-width="1.8" fill="none" opacity="0.9"/>
    <circle cx="32" cy="32" r="16" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 3" fill="none" opacity="0.75"/>
    <circle cx="32" cy="32" r="7" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.85"/>
    <circle cx="32" cy="32" r="3" fill="${color}"/>
    <line x1="32" y1="6" x2="32" y2="16" stroke="${color}" stroke-width="1.2"/>
    <line x1="32" y1="48" x2="32" y2="58" stroke="${color}" stroke-width="1.2"/>
    <line x1="10" y1="19" x2="19" y2="24" stroke="${color}" stroke-width="1.2"/>
    <line x1="45" y1="40" x2="54" y2="45" stroke="${color}" stroke-width="1.2"/>
  `;
}

function buildMotherSigil(color) {
  return `
    <ellipse cx="32" cy="32" rx="24" ry="14" stroke="${color}" stroke-width="1.5" fill="none" transform="rotate(-30 32 32)" opacity="0.7"/>
    <ellipse cx="32" cy="32" rx="24" ry="14" stroke="${color}" stroke-width="1.5" fill="none" transform="rotate(30 32 32)" opacity="0.7"/>
    <circle cx="32" cy="32" r="9" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.9"/>
    <polygon points="32,18 36,32 50,32 38,38 43,51 32,41 21,51 26,38 14,32 28,32" fill="${color}" opacity="0.85"/>
  `;
}

function buildSiegeWallSigil(color) {
  return `
    <polygon points="32,8 49,15 56,32 49,49 32,56 15,49 8,32 15,15" stroke="${color}" stroke-width="2" fill="none" opacity="0.9"/>
    <circle cx="32" cy="32" r="14" fill="#01040a" stroke="${color}" stroke-width="1.6"/>
    <circle cx="32" cy="32" r="6" fill="#000" stroke="#38bdf8" stroke-width="1.2"/>
    <line x1="4" y1="32" x2="16" y2="32" stroke="${color}" stroke-width="2"/>
    <line x1="48" y1="32" x2="60" y2="32" stroke="${color}" stroke-width="2"/>
    <line x1="32" y1="4" x2="32" y2="16" stroke="${color}" stroke-width="2"/>
    <line x1="32" y1="48" x2="32" y2="60" stroke="${color}" stroke-width="2"/>
  `;
}

function buildBloodRingsSigil(color) {
  return `
    <circle cx="32" cy="32" r="22" stroke="${color}" stroke-width="1.8" stroke-dasharray="14 6" fill="none" opacity="0.85"/>
    <circle cx="32" cy="32" r="15" stroke="${color}" stroke-width="1.4" stroke-dasharray="9 4" fill="none" opacity="0.7"/>
    <circle cx="32" cy="32" r="8" stroke="${color}" stroke-width="1.2" fill="none" opacity="0.6"/>
    <circle cx="32" cy="32" r="3.5" fill="#f43f5e"/>
    <line x1="12" y1="20" x2="52" y2="44" stroke="${color}" stroke-width="1.2" opacity="0.5"/>
  `;
}

function buildDrakkenSigil(color, threatTier) {
  const isApex = String(threatTier || '').toUpperCase().includes('EXTINCTION') || String(threatTier || '').toUpperCase().includes('COSMIC');
  const accent = isApex ? '#f43f5e' : color;
  return `
    <polygon points="32,8 50,48 32,38 14,48" stroke="${accent}" stroke-width="1.8" fill="none" opacity="0.9"/>
    <circle cx="32" cy="28" r="5" fill="${accent}" opacity="0.8"/>
    <line x1="32" y1="8" x2="32" y2="38" stroke="${accent}" stroke-width="1.4" stroke-dasharray="2 2"/>
    <path d="M18,36 Q32,22 46,36" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.75"/>
  `;
}

function buildGalaxySigil(morph, color) {
  const arms = morph?.arms || 2;
  const isBarred = morph?.isBarred;
  let paths = '';
  if (isBarred) {
    paths += `<line x1="14" y1="32" x2="50" y2="32" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>`;
    paths += `<path d="M14,32 C12,18 24,12 34,10" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    paths += `<path d="M50,32 C52,46 40,52 30,54" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  } else if (arms >= 4) {
    for (let i = 0; i < arms; i++) {
      const angle = (i * 360) / arms;
      paths += `<path d="M32,32 C38,26 44,22 48,12" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round" transform="rotate(${angle} 32 32)" opacity="0.75"/>`;
    }
  } else {
    paths += `<path d="M32,32 C40,24 48,22 52,14" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85"/>`;
    paths += `<path d="M32,32 C24,40 16,42 12,50" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  }
  return `
    <circle cx="32" cy="32" r="23" stroke="${color}" stroke-width="0.8" stroke-dasharray="2 4" fill="none" opacity="0.4"/>
    ${paths}
    <circle cx="32" cy="32" r="4.5" fill="${color}" opacity="0.95"/>
  `;
}

function buildSystemSigil(starInfo, color) {
  const isBlue = starInfo?.isBlue;
  const rayColor = isBlue ? '#38bdf8' : color;
  return `
    <circle cx="32" cy="32" r="10" fill="${rayColor}" opacity="0.9"/>
    <circle cx="32" cy="32" r="18" stroke="${rayColor}" stroke-width="1.2" stroke-dasharray="3 3" fill="none" opacity="0.6"/>
    <circle cx="32" cy="32" r="24" stroke="${rayColor}" stroke-width="0.8" fill="none" opacity="0.35"/>
    <line x1="32" y1="6" x2="32" y2="16" stroke="${rayColor}" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="32" y1="48" x2="32" y2="58" stroke="${rayColor}" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="6" y1="32" x2="16" y2="32" stroke="${rayColor}" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="48" y1="32" x2="58" y2="32" stroke="${rayColor}" stroke-width="1.6" stroke-linecap="round"/>
  `;
}

function buildPlanetSigil(planetInfo, color) {
  const hasRings = planetInfo?.hasRings;
  const hasMoons = planetInfo?.hasMoons;
  return `
    <circle cx="32" cy="32" r="11" fill="${color}" opacity="0.85"/>
    <circle cx="32" cy="32" r="13" stroke="${color}" stroke-width="1.2" fill="none" opacity="0.4"/>
    ${hasRings ? `<ellipse cx="32" cy="32" rx="23" ry="7" stroke="${color}" stroke-width="1.6" fill="none" transform="rotate(-20 32 32)" opacity="0.75"/>` : ''}
    ${hasMoons ? `<circle cx="48" cy="22" r="2.8" fill="#d1d5db" opacity="0.85"/><circle cx="32" cy="32" r="19" stroke="#9ca3af" stroke-width="0.7" stroke-dasharray="2 3" fill="none" opacity="0.4"/>` : ''}
  `;
}

function buildDefaultSigil(node, color) {
  const h = hash(node?.id || 'default');
  const points = (h % 3 === 0) ? '32,10 52,50 12,50' : (h % 2 === 0 ? '32,10 52,32 32,54 12,32' : '32,8 54,24 45,52 19,52 10,24');
  return `
    <polygon points="${points}" stroke="${color}" stroke-width="1.6" fill="none" opacity="0.8"/>
    <circle cx="32" cy="32" r="14" stroke="${color}" stroke-width="1.1" stroke-dasharray="3 3" fill="none" opacity="0.6"/>
    <circle cx="32" cy="32" r="4" fill="${color}" opacity="0.85"/>
  `;
}

export function getNodeSigilSvg(node) {
  if (!node || typeof node !== 'object') {
    return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unknown surveyor glyph"><circle cx="32" cy="32" r="12" stroke="#64748b" stroke-width="1.5" fill="none"/><line x1="32" y1="12" x2="32" y2="52" stroke="#64748b" stroke-width="1"/><line x1="12" y1="32" x2="52" y2="32" stroke="#64748b" stroke-width="1"/></svg>`;
  }

  const id = node.id || 'anonymous';
  const color = escapeXml(node.color || '#38bdf8');
  const kind = node.kind || 'unknown';
  const cacheKey = `${id}:${color}:${kind}`;

  if (sigilCache.has(cacheKey)) {
    return sigilCache.get(cacheKey);
  }

  let body = '';
  const canonMatch = findCanonEntity(id) || findCanonEntity(node.name || '');

  if (id === 'worldsvault') {
    body = buildWorldsVaultSigil(color);
  } else if (id === 'mother' || id.includes('aureal')) {
    body = buildMotherSigil(color);
  } else if (id === 'wall-concept' || id.includes('siege') || id.includes('wall')) {
    body = buildSiegeWallSigil(color);
  } else if (id.includes('blood') || id.includes('ring')) {
    body = buildBloodRingsSigil(color);
  } else if (canonMatch?.drakkenMetadata) {
    body = buildDrakkenSigil(color, canonMatch.drakkenMetadata.threatTier);
  } else if (kind === 'galaxy') {
    const morph = getGalaxyMorphology(node);
    body = buildGalaxySigil(morph, color);
  } else if (kind === 'system') {
    const starInfo = getStarClassification(node);
    body = buildSystemSigil(starInfo, color);
  } else if (kind === 'planet') {
    const planetInfo = getPlanetClassification(node, 0);
    body = buildPlanetSigil(planetInfo, color);
  } else {
    body = buildDefaultSigil(node, color);
  }

  const svg = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(node.name || id)} cartographic insignia" data-sigil-id="${escapeXml(id)}">${body}</svg>`.trim();
  sigilCache.set(cacheKey, svg);
  return svg;
}

export function getAssetProvenance(node) {
  if (!node || typeof node !== 'object') {
    return Object.freeze({
      assetId: 'sigil-unresolved',
      provenanceType: 'procedural-vector-fallback',
      sourceAnchor: 'None',
      canonStatus: 'NOT_CANON',
      authorityNotice: 'Illustrative fallback glyph; not canon.',
    });
  }

  const canonMatch = findCanonEntity(node.id) || findCanonEntity(node.name || '');
  const isReference = node.status === 'reference' || !!canonMatch;
  const assetId = `sigil-${node.id || 'draft'}`;

  return Object.freeze({
    assetId,
    provenanceType: isReference ? 'canonical-reference-marker' : 'procedural-vector-editorial',
    sourceAnchor: canonMatch ? canonMatch.sourcePath : (node.sourceUrl ? 'Dossier Source Record' : 'Editorial Cartographic Procedural'),
    canonStatus: isReference ? 'SOURCE_TOPOLOGY_MARKER' : 'ILLUSTRATIVE_EDITORIAL_ONLY',
    authorityNotice: 'Visual insignia is a procedural vector rendering generated for cartographic UI differentiation; NOT an official canon emblem or verified historical flag.',
  });
}

export function clearSigilCache() {
  sigilCache.clear();
}
