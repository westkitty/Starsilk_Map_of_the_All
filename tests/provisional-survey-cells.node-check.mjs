import test from 'node:test';
import assert from 'node:assert/strict';
import {seedAtlas} from '../atlas-data.js';
import {pointInPolygon,polygonArea} from '../strategic-model.js';
import {provisionalSurveyCells,MAX_SURVEY_SITES} from '../survey-sectors.js';
const galaxies=()=>seedAtlas().nodes.filter(n=>n.kind==='galaxy');

test('provisional cells form positive-area proximity sectors without altering saved draft models',()=>{
  const data=seedAtlas(),before=JSON.stringify(data);
  const nodes=data.nodes.filter(n=>n.kind==='galaxy');
  const cells=provisionalSurveyCells(nodes);
  assert.equal(cells.length,nodes.length);
  assert.deepEqual(cells.map(c=>c.id),[...nodes.map(n=>n.id)].sort());
  for(const c of cells){
    const site=nodes.find(n=>n.id===c.id);
    assert.ok(polygonArea(c.points)>100,'meaningful cell around '+site.id);
    assert.ok(pointInPolygon([site.position[0],site.position[2]],c.points),'site inside its proximity cell');
    assert.ok(c.points.every(p=>p.length===2&&p.every(Number.isFinite)));
    assert.equal(Object.hasOwn(c,'status'),false);
    assert.equal(Object.hasOwn(c,'affiliation'),false);
  }
  assert.equal(JSON.stringify(data),before,'renderer derivation must never mutate authoritative v1 storage');
  assert.equal(data.regions.length,0,'generated cells must never enter editable region data');
});
test('site order does not change deterministic partition; moving a draft recomputes bounds',()=>{
  const sites=galaxies();
  const first=provisionalSurveyCells(sites);
  assert.deepEqual(first,provisionalSurveyCells([...sites].reverse()));
  const relocated=structuredClone(sites);
  relocated.find(s=>s.id==='ember-span').position[0]+=35;
  const next=provisionalSurveyCells(relocated);
  assert.notDeepEqual(first,next);
  assert.deepEqual(provisionalSurveyCells(sites),first);
});
test('cells are nonoverlapping in the actual seeded continuum interior',()=>{
  const sites=galaxies(),cells=provisionalSurveyCells(sites);
  // Distance-based ownership: strict interiors cannot be claimed by two sites.
  for(let x=-135;x<=155;x+=13)for(let z=-80;z<=90;z+=11){
    const owners=cells.filter(c=>pointInPolygon([x,z],c.points));
    assert.ok(owners.length<=1,'overlap at '+x+','+z);
    if(owners.length){
      const owner=sites.find(n=>n.id===owners[0].id);
      const ownerDist=(x-owner.position[0])**2+(z-owner.position[2])**2;
      for(const n of sites)assert.ok(ownerDist<=(x-n.position[0])**2+(z-n.position[2])**2+1e-6);
    }
  }
});
test('single/paired site cases retain readable, bounded cells',()=>{
  const sites=galaxies();
  assert.deepEqual(provisionalSurveyCells([]),[]);
  for(const sample of [sites.slice(0,1),sites.slice(0,2)]){
    const cells=provisionalSurveyCells(sample);
    assert.equal(cells.length,sample.length);
    assert.ok(cells.every(c=>polygonArea(c.points)>1));
  }
});
test('ambiguous, unsafe or oversized site sets fail closed to original halo fallback',()=>{
  const sites=galaxies();
  assert.equal(provisionalSurveyCells([...sites,structuredClone(sites[0])]),null);
  const copies=Array.from({length:MAX_SURVEY_SITES+1},(_,i)=>({
    id:'galaxy-'+i,position:[i*20,0,i*5]
  }));
  assert.equal(provisionalSurveyCells(copies),null);
  assert.equal(provisionalSurveyCells([{id:'invalid',position:[Infinity,0,0]}]),null);
  assert.equal(provisionalSurveyCells(sites,-1),null);
  assert.equal(provisionalSurveyCells(sites,1000),null);
  assert.equal(provisionalSurveyCells(undefined),null);
});
