import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const engineSource = readFileSync(resolve(process.cwd(), 'atlas-engine.js'), 'utf-8');
const mainSource = readFileSync(resolve(process.cwd(), 'main.js'), 'utf-8');
const spatialSource = readFileSync(resolve(process.cwd(), 'spatial-studio.js'), 'utf-8');
const strategicSource = readFileSync(resolve(process.cwd(), 'strategic-studio.js'), 'utf-8');
const networkSource = readFileSync(resolve(process.cwd(), 'network-lab.js'), 'utf-8');
const temporalSource = readFileSync(resolve(process.cwd(), 'temporal-lab.js'), 'utf-8');

test('architectural reliability: AtlasEngine teardown and resource disposal', () => {
  assert.ok(engineSource.includes('dispose(){'), 'AtlasEngine must implement dispose()');
  assert.ok(engineSource.includes('this.renderer.setAnimationLoop(null)'), 'dispose must stop the renderer animation loop');
  assert.ok(engineSource.includes('this.resizeObserver.disconnect()'), 'dispose must disconnect ResizeObserver');
  assert.ok(engineSource.includes('this.controls.dispose()'), 'dispose must dispose OrbitControls');
  assert.ok(engineSource.includes('this.renderer.dispose()'), 'dispose must dispose WebGLRenderer');
  assert.ok(engineSource.includes('this.renderer.forceContextLoss()'), 'dispose must force WebGL context loss');
  assert.ok(engineSource.includes('_glowTextureCache.clear()'), 'dispose must clear and release glow texture cache');
});

test('architectural reliability: single render loop ownership and hidden-document throttling', () => {
  const matchSetAnimationLoop = engineSource.match(/setAnimationLoop/g);
  assert.equal(matchSetAnimationLoop?.length, 2, 'setAnimationLoop must appear exactly twice (start and null stop)');
  assert.ok(engineSource.includes('tick(now){if(this.disposed||document.hidden)return;'), 'tick must abort early when tab/document is hidden to eliminate battery and GPU drain');
});

test('architectural reliability: glow canvas texture deduplication via cache', () => {
  assert.ok(engineSource.includes('const _glowTextureCache=new Map()'), 'AtlasEngine must define _glowTextureCache');
  assert.ok(engineSource.includes('if(_glowTextureCache.has(key))return _glowTextureCache.get(key)'), 'makeGlow must return cached CanvasTexture');
  assert.ok(engineSource.includes('t.userData={isShared:true}'), 'cached glow texture must be flagged isShared to protect from disposeTree');
});

test('architectural reliability: complete studio module dispose lifecycle contracts', () => {
  assert.ok(spatialSource.includes('dispose(){'), 'SpatialStudio must implement dispose()');
  assert.ok(spatialSource.includes('controls.removeEventListener(\'change\',this.engineChange)'), 'SpatialStudio must remove engine controls listener');

  assert.ok(strategicSource.includes('dispose(){'), 'StrategicStudio must implement dispose()');
  assert.ok(strategicSource.includes('controls.removeEventListener(\'change\',this._onCamera)'), 'StrategicStudio must remove engine controls listener');

  assert.ok(networkSource.includes('dispose(){'), 'NetworkLab must implement dispose()');
  assert.ok(networkSource.includes('controls.removeEventListener(\'change\',this._onCamera)'), 'NetworkLab must remove engine controls listener');

  assert.ok(temporalSource.includes('dispose(){'), 'TemporalLab must implement dispose()');
  assert.ok(temporalSource.includes('controls.removeEventListener(\'change\',this.changeHandler)'), 'TemporalLab must remove engine controls listener');
});

test('architectural reliability: global async unhandled rejection and runtime error recovery', () => {
  assert.ok(mainSource.includes('window.addEventListener(\'unhandledrejection\''), 'main.js must register unhandledrejection listener');
  assert.ok(mainSource.includes('window.addEventListener(\'error\''), 'main.js must register global error listener');
  assert.ok(mainSource.includes('message(\'Operation failed: \''), 'unhandled rejection must provide user-facing recovery notice');
});
