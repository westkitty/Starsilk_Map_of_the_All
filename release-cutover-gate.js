/** Pure, default-deny Atlas cutover gate. No localStorage or user drafts. */
export const RELEASE_PROOF_KEYS=Object.freeze([
  'owner_backup_restore',
  'legacy_writer_decommissioned',
  'legacy_to_standalone_v1',
  'independent_planner_checks',
  'standalone_browser_recovery',
  'rollback_rehearsal',
  'canon_and_era_preservation'
]);
const sha=value=>typeof value==='string'&&/^[0-9a-f]{40}$/.test(value);
const receipt=value=>typeof value==='string'&&value.length>=12&&value.length<=500&&
  !/[\r\n<>]/.test(value);
export function assessReleaseCutover(manifest,{headSha,approvedSha}={}){
  const issues=[];
  if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))
    return {ready:false,issues:['Missing release-readiness manifest']};
  if(manifest.schemaVersion!==1)issues.push('Unknown release readiness schema');
  if(manifest.storageKey!=='starsilk.map-of-the-all.draft.v1')issues.push('Draft key changed');
  if(manifest.draftVersion!==1)issues.push('Draft JSON version changed');
  if(manifest.productionTarget!=='westkitty/Starsilk_Map_of_the_All')issues.push('Atlas production target changed');
  if(!sha(headSha))issues.push('Missing exact release commit SHA');
  if(!sha(approvedSha)||approvedSha!==headSha)issues.push('Owner release approval does not match exact commit SHA');
  const proofs=manifest.proofs;
  if(!proofs||typeof proofs!=='object'||Array.isArray(proofs)){
    issues.push('Release proof inventory missing');
  }else for(const key of RELEASE_PROOF_KEYS){
    const p=proofs[key];
    if(!p||p.status!=='verified'||!receipt(p.receipt))
      issues.push('Missing verified proof: '+key);
    if(key==='standalone_browser_recovery'&&p?.status==='verified'&&p.commit!==headSha)
      issues.push('Standalone recovery receipt is not for the release commit');
  }
  return {ready:issues.length===0,issues};
}
