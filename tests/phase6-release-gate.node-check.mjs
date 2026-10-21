import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {RELEASE_PROOF_KEYS,assessReleaseCutover,assessDisposableDraftRelease} from '../release-cutover-gate.js';

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
test('historical proof gate and non-main CLI still deny release under owner waiver',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../docs/consolidation/RELEASE_READINESS.json',import.meta.url),'utf8'));
  assert.equal(assessReleaseCutover(manifest,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,false);
  const run=spawnSync(process.execPath,[new URL('../scripts/phase6-release-gate.mjs',import.meta.url).pathname],{
    env:{...process.env,GITHUB_SHA:A,GITHUB_REF:'refs/heads/fixture-not-main',GITHUB_EVENT_NAME:'pull_request',GITHUB_REPOSITORY:'westkitty/Starsilk_Map_of_the_All',ATLAS_RELEASE_APPROVED_SHA:A,ATLAS_BROWSER_VERIFIED_SHA:A},encoding:'utf8'
  });
  assert.equal(run.status,1);
  assert.match(run.stderr,/ATLAS_RELEASE_GATE_BLOCKED/);
  assert.doesNotMatch(run.stdout,/ATLAS_RELEASE_GATE_READY/);
});


test('one-time throwaway-draft waiver preserves historical blocked proofs and limits release scope',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../docs/consolidation/RELEASE_READINESS.json',import.meta.url),'utf8'));
  assert.ok(RELEASE_PROOF_KEYS.every(key=>manifest.proofs[key].status==='blocked'));
  const args={headSha:A,repository:'westkitty/Starsilk_Map_of_the_All',ref:'refs/heads/main',
    event:'push',now:Date.parse('2026-10-21T16:00:00Z'),
    entryBlob:'850139d4e68dab96ff9adcfef334433a2d666bf3',
    runtimeBlob:'0306b379cc78f3e1aa104736dfd46daa94047609'};
  assert.equal(assessReleaseCutover(manifest,{headSha:A,approvedSha:A,recoveryVerifiedSha:A}).ready,false);
  assert.deepEqual(assessDisposableDraftRelease(manifest,args),{ready:true,issues:[]});
  assert.equal(assessDisposableDraftRelease(manifest,{...args,ref:'refs/heads/feature/test'}).ready,false);
  assert.equal(assessDisposableDraftRelease(manifest,{...args,event:'workflow_dispatch'}).ready,false);
  assert.equal(assessDisposableDraftRelease(manifest,{...args,now:Date.parse('2026-10-23T01:00:00Z')}).ready,false);
  assert.equal(assessDisposableDraftRelease(manifest,{...args,runtimeBlob:B}).ready,false);
  const tampered=structuredClone(manifest);tampered.proofs.owner_backup_restore.status='verified';
  assert.equal(assessDisposableDraftRelease(tampered,args).ready,false);
});

test('CLI allows only simulated main release of unchanged reviewed Atlas sources',()=>{
  const env={...process.env,GITHUB_SHA:A,GITHUB_REPOSITORY:'westkitty/Starsilk_Map_of_the_All',
    GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',ATLAS_RELEASE_APPROVED_SHA:'',
    ATLAS_BROWSER_VERIFIED_SHA:''};
  const script=new URL('../scripts/phase6-release-gate.mjs',import.meta.url).pathname;
  const pass=spawnSync(process.execPath,[script],{env,encoding:'utf8'});
  assert.equal(pass.status,0,'Authorized disposable draft only: '+pass.stderr);
  assert.match(pass.stdout,/ATLAS_THROWAWAY_DRAFT_RELEASE_AUTHORIZED/);
  const blocked=spawnSync(process.execPath,[script],{
    env:{...env,GITHUB_REF:'refs/heads/other'},encoding:'utf8'});
  assert.equal(blocked.status,1);
  assert.match(blocked.stderr,/ATLAS_RELEASE_GATE_BLOCKED/);
});
