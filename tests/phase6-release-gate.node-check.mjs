import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {RELEASE_PROOF_KEYS,assessReleaseCutover} from '../release-cutover-gate.js';

const A='a'.repeat(40),B='b'.repeat(40);
const fixture=()=>({
  schemaVersion:1,storageKey:'starsilk.map-of-the-all.draft.v1',draftVersion:1,
  productionTarget:'westkitty/Starsilk_Map_of_the_All',
  proofs:Object.fromEntries(RELEASE_PROOF_KEYS.map(key=>[key,{
    status:'verified',receipt:'test-only simulated receipt '+key,
    ...(key==='standalone_browser_recovery'?{commit:A}:{})
  }]))
});
test('release gate denies absent, incomplete or wrong storage contract',()=>{
  assert.equal(assessReleaseCutover(null).ready,false);
  const f=fixture();f.storageKey='starsilk.map-of-the-all.draft.v2';
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,false);
  f.storageKey='starsilk.map-of-the-all.draft.v1';f.draftVersion=2;
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,false);
});
test('all seven gates require verified evidence, not status-only declarations',()=>{
  const valid=fixture();assert.equal(RELEASE_PROOF_KEYS.length,7);
  for(const key of RELEASE_PROOF_KEYS){
    const f=structuredClone(valid);f.proofs[key].status='blocked';
    const report=assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:A});
    assert.equal(report.ready,false);
    assert.ok(report.issues.includes('Missing verified proof: '+key));
    f.proofs[key].status='verified';f.proofs[key].receipt='';
    assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,false);
  }
});
test('out-of-band owner approval and standalone recovery must match exact release SHA',()=>{
  const f=fixture();
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:undefined,recoveryVerifiedSha:A}).ready,false);
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:B,recoveryVerifiedSha:A}).ready,false);
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,true,
    'Pure synthetic test shows logic only; does not grant release approval');
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A}).ready,false,
    'Missing external exact-head browser attestation must block');
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:B}).ready,false,
    'Wrong external verified browser SHA must block');
  // The report cites the verified implementation commit; an external owner attestation binds the
  // full published merge SHA, avoiding an impossible hash self-reference in the release manifest.
  f.proofs.standalone_browser_recovery.commit=B;
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,true);
  f.proofs.standalone_browser_recovery.commit='invalid';
  assert.equal(assessReleaseCutover(f,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,false);
});
test('committed default manifest and Pages CLI categorically deny release',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../docs/consolidation/RELEASE_READINESS.json',import.meta.url),'utf8'));
  assert.equal(assessReleaseCutover(manifest,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,false);
  const run=spawnSync(process.execPath,[new URL('../scripts/phase6-release-gate.mjs',import.meta.url).pathname],{
    env:{...process.env,GITHUB_SHA:A,ATLAS_RELEASE_APPROVED_SHA:A,ATLAS_BROWSER_VERIFIED_SHA:A},encoding:'utf8'
  });
  assert.equal(run.status,1);
  assert.match(run.stderr,/ATLAS_RELEASE_GATE_BLOCKED/);
  assert.doesNotMatch(run.stdout,/ATLAS_RELEASE_GATE_READY/);
});
