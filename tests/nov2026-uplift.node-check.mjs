import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seedAtlas,addNode,validateAtlas} from '../atlas-data.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('source identity requires a verified reference ID, never a draft name match',()=>{
 const main=source('main.js');
 assert.ok(main.includes("const mapMatch=state.nodes.find(n=>n.status==='reference'&&n.id===c.id);"));
 assert.ok(main.includes("const placedTarget=state.nodes.find(n=>n.status==='reference'&&n.id===r.targetId);"));
 assert.ok(main.includes("const targetNode=state.nodes.find(n=>n.status==='reference'&&n.id===id);"));
 assert.ok(!main.includes('n.name.toLowerCase()===c.name.toLowerCase()'));
 assert.ok(!main.includes('n.name.toLowerCase()===r.targetName.toLowerCase()'));
 assert.ok(!main.includes("'◆ PLACED CANON'"));
});

test('hypothetical study is a schema-v1 draft annotation, not a canonical placement',()=>{
 const state=seedAtlas();const before=state.nodes.filter(n=>n.status==='reference').map(n=>[n.id,n.sourceUrl]);
 const study=addNode(state,'annotation',null);
 study.name='STUDY / Thirty extinct-civilization planetary templates';
 study.description='Hypothetical reader-authored annotation; no canonical coordinate.';
 study.status='draft';study.sourceUrl=null;
 assert.deepEqual(validateAtlas(state),[]);
 assert.equal(study.parentId,null);
 assert.equal(study.kind,'annotation');
 assert.equal(study.status,'draft');
 assert.deepEqual(state.nodes.filter(n=>n.status==='reference').map(n=>[n.id,n.sourceUrl]),before);
});

test('unplaced sources expose distinct inspect and provisional study actions',()=>{
 const src=source('source-graph-ui.js');
 assert.ok(src.includes('if(onInspect3D(id))dialog.close();'));
 assert.ok(src.includes('if(onProjectDraft({sourceId:n.id,label:n.label}))dialog.close();'));
 assert.ok(src.includes('This source identity has no authored 3D placement'));
 assert.ok(src.includes("['homeworld','nebula','orbital-station','gas-giant'].includes(n.kind)"),'Only genuinely spatial entity kinds expose provisional study actions');
 assert.ok(!src.includes("DRAFT STUDY ◇"),'Unrelated Dossier characters and taxonomies must never be treated as astronomical map points');
 const main=source('main.js');
 assert.ok(main.includes("const spatial=TOPOLOGY.nodes.find("),'Caller also enforces the semantic boundary');
 assert.ok(main.includes("This source is not a placeable astronomical study."),'Nonspatial source requests fail closed');
});

test('temporal and network experience additions are read-only except explicit existing draft commands',()=>{
 const temporal=source('temporal-lab.js'),network=source('network-lab.js');
 assert.ok(temporal.includes("const sequence=['war','locking','post'];"));
 assert.ok(temporal.includes('if(this.onSwitch(next)!==true)return;'),'Only verified era changes may update the comparison');
 assert.ok(temporal.includes('const previous=state.epoch;'));
 assert.ok(temporal.includes('this.baseline=previous;this.showGhosts=true'),'Preserve the previous era before the state mutation');
 assert.ok(source('main.js').includes('return accepted;'),'Era switch reports actual persistence status');
 assert.ok(network.includes("if(!this.currentPath||this.currentPath.nodes.length<2)"));
 assert.ok(network.includes('network-severed-line'));
 assert.ok(network.includes('source topology unchanged'));
});

test('main verification is independent of deployment approval; deploy remains gated',()=>{
 const check=source('.github/workflows/atlas-pr-verify.yml');
 const deploy=source('.github/workflows/deploy.yml');
 assert.ok(check.includes('push:\n    branches: [main]'));
 assert.ok(check.includes('Read-only validation; never publishes'));
 assert.ok(!check.includes('actions/deploy-pages@'));
 assert.ok(deploy.includes('Require explicit one-writer cutover and exact-head release approval'));
 assert.ok(deploy.includes('node scripts/phase6-release-gate.mjs'));
});
