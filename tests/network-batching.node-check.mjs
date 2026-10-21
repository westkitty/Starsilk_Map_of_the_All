import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {dashedLineBatch} from '../network-geometry.js';

test('dashed network batches reuse one draw object for multiple independent edges',()=>{
  const p=(x,y,z)=>new THREE.Vector3(x,y,z);
  const batch=dashedLineBatch([
    p(0,0,0),p(3,4,0),p(10,0,0),p(10,0,7)
  ],0x38bdf8,.25);
  assert.equal(batch.isLineSegments,true);
  assert.equal(batch.geometry.getAttribute('position').count,4);
  const lengths=batch.geometry.getAttribute('lineDistance');
  assert.deepEqual(Array.from(lengths.array),[0,5,0,7]);
  assert.equal(batch.material.isLineDashedMaterial,true);
  assert.equal(batch.material.opacity,.25);
  assert.equal(batch.material.dashSize,3);
  assert.equal(batch.material.gapSize,2);
  assert.ok(batch.geometry.boundingSphere);
  batch.geometry.dispose();batch.material.dispose();
});
test('empty and malformed line batches are fail-closed',()=>{
  assert.equal(dashedLineBatch([],0x000000,.2),null);
  assert.throws(()=>dashedLineBatch([new THREE.Vector3()],0x000000,.2),RangeError);
});
