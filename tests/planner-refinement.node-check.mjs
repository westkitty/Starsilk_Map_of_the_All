import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  createPlannerHandoff,
  validateHandoff,
  makeHandoffFilename,
  getHandoffSystemMetadata
} from '../planner-handoff.js';
import { seedAtlas, nodeById, addNode } from '../atlas-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('planner refinement: getHandoffSystemMetadata returns structured telemetry for draft systems', () => {
  const state = seedAtlas();
  const system = state.nodes.find(n => n.kind === 'system' && n.status === 'draft');
  assert.ok(system, 'Seed atlas must contain at least one draft system');

  const meta = getHandoffSystemMetadata(state, system.id);
  assert.ok(meta);
  assert.equal(meta.systemId, system.id);
  assert.equal(meta.systemName, system.name);
  assert.ok(meta.planetCount >= 0);
  assert.equal(meta.primaryMassSolar, '1.00 M☉ (SOLAR ANALOG)');
  assert.equal(meta.schemaVersion, '1.1.0');
  assert.ok(meta.orbitalSpanAu.includes('AU'));
  assert.ok(meta.disclaimer.includes('NON-CANON SANDBOX'));
  assert.equal(meta.steps.length, 4);

  // Rejection of reference or nonexistent entities
  assert.equal(getHandoffSystemMetadata(state, 'worldsvault'), null);
  assert.equal(getHandoffSystemMetadata(state, 'mother'), null);
  assert.equal(getHandoffSystemMetadata(state, 'nonexistent-id-999'), null);
});

test('planner refinement: handoff file preserves strict non-canon metadata and Keplerian speeds', () => {
  const state = seedAtlas();
  const system = state.nodes.find(n => n.kind === 'system' && n.status === 'draft');
  assert.ok(system);

  const project = createPlannerHandoff(state, system.id);
  const errors = validateHandoff(project);
  assert.deepEqual(errors, []);

  assert.equal(project.schemaVersion, '1.1.0');
  assert.ok(project.projectName.includes('ATLAS SANDBOX'));

  const bodies = project.branches[0].snapshot.bodies;
  const primary = bodies[0];
  assert.equal(primary.type, 'star');
  assert.equal(primary.fixed, true);
  assert.equal(primary.sourceCanonStatus, 'unknown');
  assert.equal(primary.plannerClassification, 'NON-CANON SANDBOX');
  assert.equal(primary.unauthored_in_source, true);

  for (let i = 1; i < bodies.length; i++) {
    const planet = bodies[i];
    assert.equal(planet.type, 'planet');
    assert.equal(planet.primaryId, primary.id);
    assert.equal(planet.sourceCanonStatus, 'unknown');
    assert.equal(planet.plannerClassification, 'NON-CANON SANDBOX');
    assert.equal(planet.unauthored_in_source, true);

    const posDist = Math.hypot(planet.position.x, planet.position.y, planet.position.z);
    const speed = Math.hypot(planet.velocity.x, planet.velocity.y, planet.velocity.z);
    const expectedSpeed = Math.sqrt(1.32712440018e11 / posDist);
    assert.ok(Math.abs(speed - expectedSpeed) < 1e-9, 'Planet velocity must match circular Keplerian orbital speed');
  }
});

test('planner refinement: validateHandoff catches corrupted physics and upper limits', () => {
  const state = seedAtlas();
  const system = state.nodes.find(n => n.kind === 'system' && n.status === 'draft');
  assert.ok(system);

  // Incompatible schema version
  const badVersion = createPlannerHandoff(state, system.id);
  badVersion.schemaVersion = '2.0.0';
  assert.ok(validateHandoff(badVersion).includes('Incompatible project format'));

  // Corrupted negative mass
  const badMass = createPlannerHandoff(state, system.id);
  badMass.branches[0].snapshot.bodies[0].massKg = -100;
  assert.ok(validateHandoff(badMass).includes('Invalid physical dimensions'));

  // Non-finite velocity vector
  const badVel = createPlannerHandoff(state, system.id);
  badVel.branches[0].snapshot.bodies[0].velocity.x = NaN;
  assert.ok(validateHandoff(badVel).includes('Invalid physical vector'));

  // Canon promotion attempt (falsifying sourceCanonStatus)
  const canonAttempt = createPlannerHandoff(state, system.id);
  canonAttempt.branches[0].snapshot.bodies[0].sourceCanonStatus = 'authoritative-canon';
  assert.ok(validateHandoff(canonAttempt).includes('Improper canon promotion'));
});

test('planner refinement: DOM integration in index.html for handoff presentation and instructions', () => {
  const html = readFileSync(join(__dirname, '../index.html'), 'utf-8');

  // Verify handoff section and elements
  assert.ok(html.includes('id="plannerHandoffInfo"'), 'Must have plannerHandoffInfo element');
  assert.ok(html.includes('id="handoffSystemSummary"'), 'Must have handoffSystemSummary grid');
  assert.ok(html.includes('id="handoffExportBtn"'), 'Must have handoffExportBtn button');
  assert.ok(html.includes('id="handoffHelpBtn"'), 'Must have handoffHelpBtn button');
  assert.ok(html.includes('id="handoffOpenPlanner"'), 'Must have handoffOpenPlanner link');

  // Verify external planner link points to correct URL
  assert.ok(
    html.includes('href="https://westkitty.github.io/Star_System_Planner/"'),
    'Link must target the sibling Star_System_Planner project URL'
  );

  // Verify instructions dialog
  assert.ok(html.includes('id="handoffInstructionsDialog"'), 'Must include handoffInstructionsDialog modal');
  assert.ok(html.includes('id="closeHandoffInstructions"'), 'Must include close button for handoff instructions');
  assert.ok(html.includes('ATLAS → STAR SYSTEM PLANNER HANDOFF'), 'Must display clear handoff title');
});

test('planner refinement: CSS rules in atlas.css for handoff pills, warnings, and dialogs', () => {
  const css = readFileSync(join(__dirname, '../atlas.css'), 'utf-8');

  assert.ok(css.includes('.orbital-handoff'), 'Must style .orbital-handoff');
  assert.ok(css.includes('.handoff-pill-bar'), 'Must style .handoff-pill-bar');
  assert.ok(css.includes('.handoff-summary-grid'), 'Must style .handoff-summary-grid');
  assert.ok(css.includes('.handoff-warning-notice'), 'Must style .handoff-warning-notice');
  assert.ok(css.includes('.handoff-step-grid'), 'Must style .handoff-step-grid');
  assert.ok(css.includes('.handoff-step-card'), 'Must style .handoff-step-card');
});
