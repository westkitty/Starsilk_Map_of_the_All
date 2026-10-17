import test from 'node:test';
import assert from 'node:assert/strict';
import {readDraft} from '../draft-recovery.js';
import {seedAtlas,validateAtlas} from '../atlas-data.js';

test('first open uses a valid editable seed with no recovery block',()=>{
  const result=readDraft(null);
  assert.equal(result.issue,null);assert.equal(result.rejectedRaw,null);
  assert.deepEqual(validateAtlas(result.state),[]);
});
test('valid existing drafts round-trip without losing source identity state',()=>{
  const state=seedAtlas();state.nodes[0].name='MY SAVED GALAXY';
  const result=readDraft(JSON.stringify(state));
  assert.equal(result.state.nodes[0].name,'MY SAVED GALAXY');
  assert.equal(result.rejectedRaw,null);
  assert.equal(result.state.nodes.find(x=>x.id==='worldsvault').status,'reference');
});
test('broken JSON is never rewritten or thrown away during bootstrap',()=>{
  const raw='{"galaxies":[';
  const result=readDraft(raw);
  assert.equal(result.rejectedRaw,raw);
  assert.ok(result.issue.length>0);
  assert.deepEqual(validateAtlas(result.state),[]);
});
test('unsupported schema is recoverable, never silently migrated',()=>{
  const old=seedAtlas();old.version=999;
  const raw=JSON.stringify(old),result=readDraft(raw);
  assert.equal(result.rejectedRaw,raw);
  assert.equal(result.state.version,1);
  assert.match(result.issue,/Unsupported atlas schema/);
});
test('incomplete saved atlas cannot claim to be a healthy draft',()=>{
  const old=seedAtlas();old.nodes[0].position=[Infinity,0,0];
  const raw=JSON.stringify(old),result=readDraft(raw);
  assert.equal(result.rejectedRaw,raw);
  assert.ok(result.issue);
});
