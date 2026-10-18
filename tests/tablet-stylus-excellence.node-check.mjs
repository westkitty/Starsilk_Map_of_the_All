import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('tablet & stylus: differentiated pointer slop thresholds in atlas-engine.js', () => {
  const code = fs.readFileSync(path.join(rootDir, 'atlas-engine.js'), 'utf8');

  // Verify differentiated thresholds
  assert.ok(code.includes("start.type==='pen'?6:(start.type==='touch'?16:8)"),
    'Must differentiate slop tolerance: pen 6px, touch 16px, mouse 8px');
  assert.ok(code.includes('this.lastPointerType='), 'Must track active pointer type');
});

test('tablet double-tap gesture recognition for system and galaxy entry', () => {
  const code = fs.readFileSync(path.join(rootDir, 'atlas-engine.js'), 'utf8');

  // Verify double-tap detection logic for touch and pen
  assert.ok(code.includes("(start.type==='touch'||start.type==='pen')"),
    'Must detect double tap for touch and pen inputs');
  assert.ok(code.includes('this.pick(ev,true)'),
    'Double tap must trigger entry pick(ev, true)');
  assert.ok(code.includes('timeSinceLast>50&&timeSinceLast<360'),
    'Double tap timing window must be bounded (50ms - 360ms)');
  assert.ok(code.includes('this.lastTapTime=0;'),
    'Double tap must consume tap timestamp to prevent triple-tap entry cascading');
});

test('stylus barrel secondary actions in spatial and strategic studios', () => {
  const spatialCode = fs.readFileSync(path.join(rootDir, 'spatial-studio.js'), 'utf8');
  const strategicCode = fs.readFileSync(path.join(rootDir, 'strategic-studio.js'), 'utf8');

  // Spatial studio: barrel click or right-click resets label offset
  assert.ok(spatialCode.includes('e.button===2||e.buttons===2'),
    'Spatial studio must handle barrel button / secondary click');
  assert.ok(spatialCode.includes('this.onLabelMoveCommit(id,[0,0])'),
    'Secondary stylus tap on label must reset offset to [0, 0]');

  // Strategic studio: barrel button on vertex triggers deletion
  assert.ok(strategicCode.includes("(e.pointerType==='pen'&&(e.button===2||e.buttons===2))"),
    'Strategic studio must treat stylus barrel tap as vertex eraser');
});

test('gesture cancel recovery restores camera controls and clears drag states', () => {
  const engineCode = fs.readFileSync(path.join(rootDir, 'atlas-engine.js'), 'utf8');
  const spatialCode = fs.readFileSync(path.join(rootDir, 'spatial-studio.js'), 'utf8');
  const strategicCode = fs.readFileSync(path.join(rootDir, 'strategic-studio.js'), 'utf8');

  // Engine cancel
  assert.ok(engineCode.includes("canvas.addEventListener('pointercancel'"),
    'Atlas engine must listen for pointercancel');
  assert.ok(engineCode.includes('this.lastTapTime=0'),
    'pointercancel must clear tap memory');

  // Spatial studio cancel
  assert.ok(spatialCode.includes('this.engine.controls.enabled=this.drag.controlsEnabled'),
    'Spatial studio cancel must restore camera controls');

  // Strategic studio cancel
  assert.ok(strategicCode.includes('if(this.engine)this.engine.controls.enabled='),
    'Strategic studio cancel must safely restore controls');
});

test('tablet touch target sizing and tactile active states in atlas.css', () => {
  const css = fs.readFileSync(path.join(rootDir, 'atlas.css'), 'utf8');

  assert.ok(css.includes('@media(hover:none) and (pointer:coarse)'),
    'Must include coarse pointer media query for tablets and touchscreens');
  assert.ok(css.includes('.atlas-pull-tab{min-height:44px!important;padding:10px 12px!important}'),
    'Drawer pull tabs must meet 44px touch target on coarse pointers');
  assert.ok(css.includes('.search-result{min-height:44px'),
    'Search results must provide 44px touch targets');
  assert.ok(css.includes('.strategy-vertex{width:48px;height:48px}'),
    'Polygon vertices must expand to at least 48px on coarse touch devices');
  assert.ok(css.includes('transform:scale(.98);filter:brightness(1.15)'),
    'Active touch states must provide immediate visual tactile feedback');
});
