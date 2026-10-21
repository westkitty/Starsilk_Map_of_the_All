import test from 'node:test';
import assert from 'node:assert/strict';
import {SYSTEM_ZOOM_RADIUS,findSystemZoomTarget} from '../system-zoom.js';
const good=(id='sys-a',distance=8)=>({id,kind:'system',visible:true,distance,screenX:.1,screenY:-.1});
test('stellar inward-dolly limit never infers physical distance',()=>assert.equal(SYSTEM_ZOOM_RADIUS,17));
test('no automatic descent outside galaxy tier, outward zoom, or blocked editors',()=>{
 const c=[good()];
 for(const args of [
 {viewKind:'all',zooming:true,blocked:false},
 {viewKind:'system',zooming:true,blocked:false},
 {viewKind:'galaxy',zooming:false,blocked:false},
 {viewKind:'galaxy',zooming:true,blocked:true}
 ])assert.equal(findSystemZoomTarget({...args,candidates:c} ),null);
});
test('never enter off-camera, invisible, malformed, or farther-than-threshold systems',()=>{
 for(const candidate of [
 {...good(),kind:'planet'},
 {...good(),visible:false},
 {...good(),screenX:.9},
 {...good(),screenY:-.9},
 {...good(),distance:17},
 {...good(),distance:NaN},
 {...good(),screenX:Infinity}
 ])assert.equal(findSystemZoomTarget({viewKind:'galaxy',zooming:true,blocked:false,candidates:[candidate]}),null);
});
test('prefer selected eligible system; otherwise choose nearest eligible',()=>{
 const candidates=[good('a',6),good('b',12),good('c',4)];
 assert.equal(findSystemZoomTarget({viewKind:'galaxy',zooming:true,blocked:false,candidates,selectedId:'b'}),'b');
 assert.equal(findSystemZoomTarget({viewKind:'galaxy',zooming:true,blocked:false,candidates,selectedId:'outside'}),'c');
});
