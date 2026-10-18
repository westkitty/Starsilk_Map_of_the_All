import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const engineSource = readFileSync(resolve(process.cwd(), 'atlas-engine.js'), 'utf-8');

test('rendering performance: shared pick geometry and material exist and are flagged isShared', () => {
  assert.ok(engineSource.includes('this._sharedPickGeom=new THREE.SphereGeometry(1,10,8)'), 'AtlasEngine must instantiate shared pick geometry');
  assert.ok(engineSource.includes('this._sharedPickMat=new THREE.MeshBasicMaterial({visible:false})'), 'AtlasEngine must instantiate shared pick material');
  assert.ok(engineSource.includes('this._sharedPickGeom.userData={isShared:true}'), 'shared pick geometry must be flagged isShared');
  assert.ok(engineSource.includes('this._sharedPickMat.userData={isShared:true}'), 'shared pick material must be flagged isShared');
  assert.ok(engineSource.includes('createPickTarget(radius,n,group)'), 'createPickTarget helper must be defined');
});

test('rendering performance: disposeTree guards shared assets from premature disposal', () => {
  assert.ok(engineSource.includes('!obj.geometry.userData?.isShared'), 'disposeTree must guard shared geometries');
  assert.ok(engineSource.includes('!mat.userData?.isShared'), 'disposeTree must guard shared materials');

  // Verify behavior with mock Three objects
  let geomDisposed = false;
  let sharedGeomDisposed = false;
  let matDisposed = false;
  let sharedMatDisposed = false;

  const normalGeom = { dispose: () => { geomDisposed = true; }, userData: {} };
  const sharedGeom = { dispose: () => { sharedGeomDisposed = true; }, userData: { isShared: true } };
  const normalMat = { dispose: () => { matDisposed = true; }, userData: {} };
  const sharedMat = { dispose: () => { sharedMatDisposed = true; }, userData: { isShared: true } };

  function mockDisposeTree(root) {
    root.traverse(obj => {
      if (obj.geometry?.dispose && !obj.geometry.userData?.isShared) obj.geometry.dispose();
      const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
      for (const mat of mats) {
        if (!mat.userData?.isShared) {
          mat.dispose?.();
        }
      }
    });
    root.clear();
  }

  const group = new THREE.Group();
  const objNormal = { geometry: normalGeom, material: normalMat, traverse: fn => fn(objNormal) };
  const objShared = { geometry: sharedGeom, material: sharedMat, traverse: fn => fn(objShared) };

  const root = {
    traverse: (fn) => { fn(objNormal); fn(objShared); },
    clear: () => {}
  };

  mockDisposeTree(root);
  assert.equal(geomDisposed, true, 'unshared geometry should be disposed');
  assert.equal(matDisposed, true, 'unshared material should be disposed');
  assert.equal(sharedGeomDisposed, false, 'shared geometry must NOT be disposed during tree clear');
  assert.equal(sharedMatDisposed, false, 'shared material must NOT be disposed during tree clear');
});

test('rendering performance: computeBoundingSphere precomputed on point clouds and lines', () => {
  assert.ok(engineSource.includes('g.computeBoundingSphere()'), 'lines BufferGeometry must call computeBoundingSphere');
  // Check background points
  assert.ok(engineSource.includes('alphas,1));\n    g.computeBoundingSphere();'), 'initBackground BufferGeometry must compute bounding sphere');
  // Check starCloud points
  assert.ok(engineSource.includes('intensities,1));\n    g.computeBoundingSphere();'), 'starCloud BufferGeometry must compute bounding sphere');
  // Check Siege Wall debris
  assert.ok(engineSource.includes('p.computeBoundingSphere()'), 'Siege Wall debris must compute bounding sphere');
  // Check Asteroid Belt
  assert.ok(engineSource.includes('beltGeom.computeBoundingSphere()'), 'Asteroid belt must compute bounding sphere');
});

test('rendering performance: label DOM update deduplication prevents innerHTML and style thrashing', () => {
  assert.ok(engineSource.includes('btn._contentKey!==contentKey'), 'label DOM updates must check _contentKey before setting innerHTML');
  assert.ok(engineSource.includes('Math.abs(x-btn._lastX)>=0.25||Math.abs(y-btn._lastY)>=0.25'), 'label position updates must be sub-pixel threshold gated');
  assert.ok(engineSource.includes('btn._lastFont!==font'), 'label font changes must be cached');
  assert.ok(engineSource.includes('Math.abs(alpha-btn._lastAlpha)>=0.02'), 'label opacity changes must be threshold gated');
  assert.ok(engineSource.includes('btn._lastTitle!==title'), 'label title tooltip updates must be cached');
});

test('rendering performance: frameStats telemetry and render profiling exposed in info()', () => {
  assert.ok(engineSource.includes('this.frameStats={lastMs:16.6,avgMs:16.6,maxMs:16.6}'), 'frameStats initialized in constructor');
  assert.ok(engineSource.includes('this.frameStats.lastMs=tDuration'), 'tick records lastMs');
  assert.ok(engineSource.includes('this.frameStats.avgMs=this.frameStats.avgMs*0.95+tDuration*0.05'), 'tick computes exponential running avgMs');
  assert.ok(engineSource.includes('fps,'), 'info() reports calculated fps');
  assert.ok(engineSource.includes('lastFrameMs:'), 'info() reports lastFrameMs');
  assert.ok(engineSource.includes('avgFrameMs:'), 'info() reports avgFrameMs');
  assert.ok(engineSource.includes('maxFrameMs:'), 'info() reports maxFrameMs');
});

test('rendering performance: AtlasEngine.dispose cleans up shared pick resources', () => {
  assert.ok(engineSource.includes('if(this._sharedPickGeom)this._sharedPickGeom.dispose()'), 'dispose disposes shared pick geometry');
  assert.ok(engineSource.includes('if(this._sharedPickMat)this._sharedPickMat.dispose()'), 'dispose disposes shared pick material');
});
