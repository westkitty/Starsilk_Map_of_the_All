import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const mainSource = readFileSync(resolve(process.cwd(), 'main.js'), 'utf-8');
const indexSource = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');
const cssSource = readFileSync(resolve(process.cwd(), 'atlas.css'), 'utf-8');
const engineSource = readFileSync(resolve(process.cwd(), 'atlas-engine.js'), 'utf-8');

test('accessibility & resilience: comprehensive keyboard traversal and node cycling', () => {
  assert.ok(mainSource.includes('function cycleSelection(delta=1)'), 'main.js must define cycleSelection helper');
  assert.ok(mainSource.includes('ev.key===\'[\'||ev.key.toLowerCase()===\'j\''), 'bracket [ or J must cycle previous node');
  assert.ok(mainSource.includes('ev.key===\']\'||ev.key.toLowerCase()===\'k\''), 'bracket ] or K must cycle next node');
  assert.ok(mainSource.includes('ev.key===\'Enter\'&&state.selected'), 'Enter must descend into selected system or galaxy');
  assert.ok(mainSource.includes('ev.key===\'/\'||ev.key===\'?\''), '/ must focus search, ? must open help dialog');
  assert.ok(mainSource.includes('ev.key===\'0\''), '0 must reset camera framing');
  assert.ok(mainSource.includes('ev.key===\'Home\''), 'Home must ascend to The All');
});

test('accessibility & resilience: semantic status and live announcements for source vs draft identities', () => {
  assert.ok(indexSource.includes('id="inspectorStatus"'), 'index.html must have inspectorStatus element');
  assert.ok(mainSource.includes('CANONICAL SOURCE TOPOLOGY · IMMUTABLE · UNAUTHORED COORDINATES'), 'inspectorStatus must state immutable source topology');
  assert.ok(mainSource.includes('PROVISIONAL DRAFT'), 'inspectorStatus must distinguish provisional drafts');
  assert.ok(mainSource.includes('Canonical source topology. Immutable read-only reference from Starsilk Dossier.'), 'inspectorStatus must provide descriptive aria-label');
  assert.ok(indexSource.includes('id="savedStatus" role="status"'), 'savedStatus must have role="status"');
});

test('accessibility & resilience: forced-colors active support and high contrast boundaries in atlas.css', () => {
  assert.ok(cssSource.includes('@media(forced-colors:active)'), 'atlas.css must define forced-colors active media query');
  assert.ok(cssSource.includes('forced-color-adjust:none'), 'forced-color-adjust must be controlled');
  assert.ok(cssSource.includes('border:2px solid ButtonText!important'), 'buttons and labels must have ButtonText borders');
  assert.ok(cssSource.includes('.world-label.selected{outline:3px solid Highlight!important}'), 'selected labels must have Highlight outline');
});

test('accessibility & resilience: non-color-only distinctions across cartographic symbols and badges', () => {
  assert.ok(indexSource.includes('glyph-ref">◆</span>'), 'source topology must have diamond glyph symbol');
  assert.ok(indexSource.includes('glyph-draft">●</span>'), 'draft objects must have circle glyph symbol');
  assert.ok(indexSource.includes('glyph-wall">■</span>'), 'Siege Wall must have square glyph symbol');
  assert.ok(indexSource.includes('glyph-strand">—</span>'), 'Starsilk strand must have dash glyph symbol');
});

test('accessibility & resilience: reduced-motion preference synchronization across engine and UI', () => {
  assert.ok(mainSource.includes('document.body.classList.add(\'reduced-motion\')'), 'main.js must add reduced-motion class when motion is disabled');
  assert.ok(mainSource.includes('document.body.classList.remove(\'reduced-motion\')'), 'main.js must remove reduced-motion class when motion is enabled');
  assert.ok(cssSource.includes('body.reduced-motion *'), 'atlas.css must define zero-duration animation rules for body.reduced-motion');
  assert.ok(engineSource.includes('(state&&state.motion===false)'), 'AtlasEngine must respect state.motion in reducedMotion check');
});

test('accessibility & resilience: WebGL context creation guard and accessible fallback UI', () => {
  assert.ok(engineSource.includes('WebGL context creation failed:'), 'AtlasEngine must guard WebGLRenderer creation');
  assert.ok(mainSource.includes('3D WEBGL ACCELERATION UNAVAILABLE'), 'main.js must display clear heading if WebGL fails');
  assert.ok(mainSource.includes('EXPORT ATLAS JSON ↗'), 'fallback UI must offer data export');
  assert.ok(mainSource.includes('OPEN CANON REGISTRY ◆'), 'fallback UI must allow browsing canonical records without WebGL');
  assert.ok(mainSource.includes('RETRY INITIALIZATION ↻'), 'fallback UI must allow retrying');
});
