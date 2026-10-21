/** GitHub Pages preflight: fails closed without explicit owner release proof. */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assessReleaseCutover,assessDisposableDraftRelease} from '../release-cutover-gate.js';
let manifest;
try{manifest=JSON.parse(readFileSync(new URL('../docs/consolidation/RELEASE_READINESS.json',import.meta.url),'utf8'));}
catch(error){console.error('ATLAS_RELEASE_GATE_BLOCKED',String(error.message||error));process.exit(1);}
const result=assessReleaseCutover(manifest,{
  headSha:process.env.GITHUB_SHA,
  approvedSha:process.env.ATLAS_RELEASE_APPROVED_SHA,
  recoveryVerifiedSha:process.env.ATLAS_BROWSER_VERIFIED_SHA
});
if(!result.ready){
  let entryBlob='',runtimeBlob='';
  try{
    entryBlob=execFileSync('git',['rev-parse','HEAD:index.html'],
      {encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
    runtimeBlob=execFileSync('git',['rev-parse','HEAD:main.js'],
      {encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch{} // Missing Git identity is a BLOCK, never permission to release.
  const waiver=assessDisposableDraftRelease(manifest,{
    headSha:process.env.GITHUB_SHA,repository:process.env.GITHUB_REPOSITORY,
    ref:process.env.GITHUB_REF,event:process.env.GITHUB_EVENT_NAME,
    entryBlob,runtimeBlob
  });
  if(waiver.ready){
    console.log('ATLAS_THROWAWAY_DRAFT_RELEASE_AUTHORIZED',process.env.GITHUB_SHA,
      'real old-draft recovery explicitly waived; Planner live-portal preflight and all Atlas QA still required');
    process.exit(0);
  }
  console.error('ATLAS_RELEASE_GATE_BLOCKED',result.issues.join(' | '),' | waiver: ',waiver.issues.join(' | '));
  console.error('No publication. Obtain independent backups, retire legacy writer, verify compatibility, rehearse rollback, and separately authorize the exact release SHA.');
  process.exit(1);
}
console.log('ATLAS_RELEASE_GATE_READY',process.env.GITHUB_SHA);
