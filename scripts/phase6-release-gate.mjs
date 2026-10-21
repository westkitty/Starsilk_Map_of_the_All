/** GitHub Pages preflight: fails closed without explicit owner release proof. */
import {readFileSync} from 'node:fs';
import {assessReleaseCutover} from '../release-cutover-gate.js';
let manifest;
try{manifest=JSON.parse(readFileSync(new URL('../docs/consolidation/RELEASE_READINESS.json',import.meta.url),'utf8'));}
catch(error){console.error('ATLAS_RELEASE_GATE_BLOCKED',String(error.message||error));process.exit(1);}
const result=assessReleaseCutover(manifest,{
  headSha:process.env.GITHUB_SHA,
  approvedSha:process.env.ATLAS_RELEASE_APPROVED_SHA,
  recoveryVerifiedSha:process.env.ATLAS_BROWSER_VERIFIED_SHA
});
if(!result.ready){
  console.error('ATLAS_RELEASE_GATE_BLOCKED',result.issues.join(' | '));
  console.error('No publication. Obtain independent backups, retire legacy writer, verify compatibility, rehearse rollback, and separately authorize the exact release SHA.');
  process.exit(1);
}
console.log('ATLAS_RELEASE_GATE_READY',process.env.GITHUB_SHA);
