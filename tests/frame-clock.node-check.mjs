import {test} from 'node:test';
import assert from 'node:assert/strict';
import {frameDelta,wrapCurvePhase,easeOutCubic,easeInOutCubic} from '../frame-clock.js';
test('first RAF timestamp earlier than construction cannot rewind particles',()=>{assert.equal(frameDelta(98,105),0)});
test('RAF frame jumps cap at 80ms',()=>{assert.equal(frameDelta(12000,100),80)});
test('normal frame delta',()=>{assert.equal(frameDelta(116,100),16)});
test('NaN/undefined timestamps are treated as zero',()=>{assert.equal(frameDelta(NaN,100),0);assert.equal(frameDelta(123,undefined),0)});
test('negative phase wraps into Catmull-Rom valid domain',()=>{const phase=wrapCurvePhase(-0.0005);assert.ok(phase>0&&phase<1)});
test('positive overshoot wraps without exceeding domain',()=>{assert.equal(wrapCurvePhase(1.25),.25)});
test('nonfinite phase safely returns beginning',()=>{assert.equal(wrapCurvePhase(Infinity),0)});
test('cubic easing clamps safely within 0 to 1 and evaluates endpoints exactly',()=>{
  assert.equal(easeOutCubic(0),0);
  assert.equal(easeOutCubic(1),1);
  assert.equal(easeOutCubic(-1),0);
  assert.equal(easeOutCubic(2),1);
  assert.equal(easeOutCubic(NaN),0);
  assert.equal(easeInOutCubic(0),0);
  assert.equal(easeInOutCubic(0.5),0.5);
  assert.equal(easeInOutCubic(1),1);
  assert.equal(easeInOutCubic(-0.5),0);
  assert.equal(easeInOutCubic(1.5),1);
  assert.equal(easeInOutCubic(Infinity),0);
  assert.ok(easeInOutCubic(0.25)<0.25,'ease-in decelerates start');
  assert.ok(easeInOutCubic(0.75)>0.75,'ease-out decelerates end');
});

