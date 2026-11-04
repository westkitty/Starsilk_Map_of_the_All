import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanetSurface} from '../atlas-engine.js';

const node={id:'provisional-study-world',name:'Study World',color:'#76b9e8',size:.65};
const sample=badge=>makePlanetSurface(node,{badge},1.85,'standard');
test('procedural planet material has finite, varied vertex colors and preserved mesh ownership',()=>{
  for(const badge of ['GAS GIANT','ICE GIANT','TERRESTRIAL','CRYO WORLD']){
    const mesh=sample(badge),color=mesh.geometry.getAttribute('color');
    assert.equal(mesh.isMesh,true);
    assert.equal(mesh.material.vertexColors,true);
    assert.equal(color.itemSize,3);
    assert.ok(color.count>100);
    const values=Array.from(color.array);
    assert.ok(values.every(Number.isFinite),'shader input must remain finite');
    assert.ok(Math.max(...values)-Math.min(...values)>.05,'planet should not be flat colored');
    mesh.geometry.dispose();mesh.material.dispose();
  }
});
test('planet visuals are deterministic, independent of save data, and quality bounded',()=>{
  const a=sample('GAS GIANT'),b=sample('GAS GIANT');
  assert.deepEqual(Array.from(a.geometry.getAttribute('color').array),Array.from(b.geometry.getAttribute('color').array));
  assert.deepEqual(node,{id:'provisional-study-world',name:'Study World',color:'#76b9e8',size:.65});
  const low=makePlanetSurface(node,{badge:'TERRESTRIAL'},1.85,'battery');
  const high=makePlanetSurface(node,{badge:'TERRESTRIAL'},1.85,'cinematic');
  assert.ok(low.geometry.getAttribute('position').count<high.geometry.getAttribute('position').count);
  for(const mesh of [a,b,low,high]){mesh.geometry.dispose();mesh.material.dispose();}
});
