import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameTimingWindow} from '../frame-timing.js';

test('reported FPS is actual frame cadence, not a small rendering callback time',()=>{
  const t=new FrameTimingWindow();
  for(let i=0;i<101;i++)t.record(i*(1000/60),2);
  const s=t.snapshot();
  assert.equal(s.sampleCount,100);
  assert.equal(s.fps,60);
  assert.equal(s.medianFps,60);
  assert.ok(Math.abs(s.frameP50Ms-16.67)<.02);
  assert.ok(Math.abs(s.frameP95Ms-16.67)<.02);
  assert.equal(s.callbackP95Ms,2);
  assert.equal(s.slowFramePct,0);
});
test('percentiles and slow-frame percentage reflect real time gaps',()=>{
  const t=new FrameTimingWindow(10);
  t.record(0,1);
  let stamp=0;
  for(const gap of [10,16,20,33,34,40,60,80,100,125]){
    stamp+=gap;t.record(stamp,3);
  }
  const s=t.snapshot();
  assert.equal(s.sampleCount,10);
  assert.equal(s.frameP50Ms,34);
  assert.equal(s.frameP95Ms,125);
  assert.equal(s.frameP99Ms,125);
  assert.equal(s.slowFramePct,60);
  assert.equal(s.fps,Number((1000/51.8).toFixed(2)));
});
test('bounded ring keeps latest timestamps, never all historical samples',()=>{
  const t=new FrameTimingWindow(5);
  t.record(0,1);
  for(let i=1;i<=8;i++)t.record(i*10,i);
  assert.equal(t.snapshot().sampleCount,5);
  assert.equal(t.snapshot().frameP95Ms,10);
  assert.equal(t.snapshot().callbackP95Ms,8);
});
test('a long visible GPU stall is counted instead of mislabeled as a resume',()=>{
  const t=new FrameTimingWindow(12);
  t.record(0,1);
  for(let i=1;i<=7;i++)t.record(i*20,5);
  assert.equal(t.snapshot().fps,50);
  assert.equal(t.record(2000,2),true);
  assert.ok(t.snapshot().fps<10);
  assert.ok(t.snapshot().frameP99Ms>1000);
  assert.equal(t.snapshot().pauseCount,0);
});
test('actual visibility suspension excludes hidden-tab gaps only',()=>{
  const t=new FrameTimingWindow(12);
  t.record(0,1);
  for(let i=1;i<=7;i++)t.record(i*20,5);
  t.suspend();
  assert.equal(t.snapshot().sampleCount,0);
  assert.equal(t.snapshot().fps,null);
  assert.equal(t.snapshot().pauseCount,1);
  assert.equal(t.record(2000,2),false);
  for(let i=1;i<=8;i++)t.record(2000+i*25,3);
  assert.equal(t.snapshot().fps,40);
});
test('invalid samples and options do not produce NaN or invented 60 FPS',()=>{
  assert.throws(()=>new FrameTimingWindow(4),RangeError);
  const t=new FrameTimingWindow();
  assert.equal(t.snapshot().fps,null);
  assert.equal(t.record(NaN,3),false);
  assert.equal(t.record(0,-1),false);
  assert.equal(t.record(0,1),false);
  assert.equal(t.record(0,1),false);
  assert.equal(t.record(100,1),true);
  assert.equal(t.snapshot().fps,null,'four observations are not enough to assert FPS');
});
