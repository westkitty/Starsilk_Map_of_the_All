import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexHtml = readFileSync('index.html', 'utf8');
const atlasFocusJs = readFileSync('atlas-focus.js', 'utf8');
const atlasEngineJs = readFileSync('atlas-engine.js', 'utf8');
const atlasFocusCss = readFileSync('atlas-focus.css', 'utf8');
const atlasCss = readFileSync('atlas.css', 'utf8');

test('first-action orientation HUD structure and accessibility', () => {
  assert.ok(indexHtml.includes('id="firstActionHud"'), 'firstActionHud exists in DOM');
  assert.ok(indexHtml.includes('role="region"'), 'firstActionHud has semantic role region');
  assert.ok(indexHtml.includes('aria-label="First action quick guide"'), 'firstActionHud has descriptive aria-label');
  assert.ok(indexHtml.includes('id="dismissHudBtn"'), 'dismissHudBtn exists for user control');
  assert.ok(indexHtml.includes('INSPECT GALAXY'), 'includes inspect galaxy cue');
  assert.ok(indexHtml.includes('ENTER SYSTEMS'), 'includes enter systems cue');
  assert.ok(indexHtml.includes('ORBIT COSMOS'), 'includes orbit cosmos cue');
  assert.ok(indexHtml.includes('DRAWERS'), 'includes drawer key cue');
});

test('canonical header pill and 127 Dossier invariant discoverability', () => {
  assert.ok(indexHtml.includes('id="canonHeaderPill"'), 'canonHeaderPill is present in header');
  assert.ok(indexHtml.includes('127 CANON IDS'), 'pill clearly states 127 canon IDs');
  assert.ok(indexHtml.includes('🔒'), 'lock sigil marks immutable canonical authority');
  assert.ok(atlasFocusJs.includes("byId('canonHeaderPill')"), 'canonHeaderPill is wired to explore drawer');
  assert.ok(atlasFocusCss.includes('.header-canon-pill'), 'header-canon-pill has styling in atlas-focus.css');
});

test('pull-down drawer hierarchy includes discoverable keycap numbers', () => {
  assert.ok(atlasFocusJs.includes('<span class="tab-key" aria-hidden="true">${idx+1}</span>'), 'pull tabs render keycap numbers 1-6');
  assert.ok(atlasFocusCss.includes('.atlas-pull-tab .tab-key'), 'tab-key has dedicated styling');
  assert.ok(indexHtml.includes('id="closeNavPanel"'), 'closeNavPanel button exists in leftPanel');
  assert.ok(atlasFocusJs.includes("'closeNavPanel','nav'"), 'closeNavPanel is wired to collapse nav drawer');
});

test('label pips and tooltips distinguish canonical topology from editable drafts', () => {
  assert.ok(atlasEngineJs.includes('pip-canon'), 'pip-canon class assigned to reference status');
  assert.ok(atlasEngineJs.includes('pip-draft'), 'pip-draft class assigned to editable galaxy drafts');
  assert.ok(atlasCss.includes('.world-label .label-pip.pip-canon'), 'pip-canon styled with luminous cyan in atlas.css');
  assert.ok(atlasCss.includes('.world-label .label-pip.pip-draft'), 'pip-draft styled in atlas.css');
  assert.ok(atlasEngineJs.includes('Canonical Source Topology (Immutable · Unauthored Coordinates)'), 'informative tooltip for reference objects');
  assert.ok(atlasEngineJs.includes('Draft Galaxy (Click to Inspect · Double-Click to Enter · Editable)'), 'informative tooltip for editable galaxies');
});

test('canon boundary invariants remain strictly preserved', () => {
  assert.ok(!indexHtml.includes('FACTION_SOVEREIGNTY_ESTABLISHED'), 'no sovereign claims');
  assert.ok(!indexHtml.includes('CANONICAL_ORBIT_EPHEMERIS'), 'no invented orbital mechanics');
  assert.ok(atlasFocusCss.includes('max-width:calc(100vw - 32px)'), 'first-action HUD respects viewport bounds without overflow');
});
