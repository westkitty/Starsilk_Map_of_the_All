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
export function assessReleaseCutover(manifest,{headSha,approvedSha,recoveryVerifiedSha}={}){
  const issues=[];
  if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))
    return {ready:false,issues:['Missing release-readiness manifest']};
  if(manifest.schemaVersion!==1)issues.push('Unknown release readiness schema');
  if(manifest.storageKey!=='starsilk.map-of-the-all.draft.v1')issues.push('Draft key changed');
  if(manifest.draftVersion!==1)issues.push('Draft JSON version changed');
  if(manifest.productionTarget!=='westkitty/Starsilk_Map_of_the_All')issues.push('Atlas production target changed');
  if(!sha(headSha))issues.push('Missing exact release commit SHA');
  if(!sha(approvedSha)||approvedSha!==headSha)issues.push('Owner release approval does not match exact commit SHA');
  // Exact-head recovery cannot be embedded in the commit it attests to: doing so changes that SHA.
  // The owner sets this second out-of-band SHA only after reviewing browser recovery on release HEAD.
  if(!sha(recoveryVerifiedSha)||recoveryVerifiedSha!==headSha)
    issues.push('Standalone recovery verification does not match exact release SHA');
  const proofs=manifest.proofs;
  if(!proofs||typeof proofs!=='object'||Array.isArray(proofs)){
    issues.push('Release proof inventory missing');
  }else for(const key of RELEASE_PROOF_KEYS){
    const p=proofs[key];
    if(!p||p.status!=='verified'||!receipt(p.receipt))
      issues.push('Missing verified proof: '+key);
    if(key==='standalone_browser_recovery'&&p?.status==='verified'&&!sha(p.commit))
      issues.push('Standalone recovery evidence must cite a real verified implementation commit');
  }
  return {ready:issues.length===0,issues};
}

/** A one-cutover alternative: user explicitly discarded only old browser drafts.
 * Kept separate from ordinary seven-proof readiness so missing receipts remain honest.
 * The Pages workflow independently proves the Planner's retired portal is already live.
 */
export function assessDisposableDraftRelease(manifest,{headSha,repository,ref,event,
  now=Date.now(),entryBlob,runtimeBlob}={}){
  const issues=[];
  const d=manifest?.disposableDraftCutover;
  if(manifest?.schemaVersion!==1||manifest?.productionTarget!=='westkitty/Starsilk_Map_of_the_All'||
    manifest?.storageKey!=='starsilk.map-of-the-all.draft.v1'||manifest?.draftVersion!==1)
    issues.push('Atlas identity, shared draft key or v1 schema mismatch');
  if(d?.mode!=='temporary-disposable-draft-release'||typeof d.authorization!=='string'||
    !d.authorization.includes('Ignore the previous data in the atlas')||
    d.releaseWindowEndUTC!=='2026-10-23T00:00:00Z')
    issues.push('Missing explicit, short-lived owner authorization to discard old drafts');
  if(!Number.isFinite(now)||now>=Date.parse('2026-10-23T00:00:00Z'))
    issues.push('Owner cutover window expired');
  if(repository!=='westkitty/Starsilk_Map_of_the_All'||ref!=='refs/heads/main'||
    event!=='push'||!sha(headSha))issues.push('Only an actual main-branch push may release');
  if(entryBlob!=='850139d4e68dab96ff9adcfef334433a2d666bf3'||
    runtimeBlob!=='0306b379cc78f3e1aa104736dfd46daa94047609'||
    d?.expectedAtlasEntryBlob!==entryBlob||d?.expectedAtlasRuntimeBlob!==runtimeBlob)
    issues.push('Reviewed Atlas entry/runtime blobs changed');
  if(d?.requiredPublishedPlannerRoute!==
    'https://westkitty.github.io/Star_System_Planner/map-of-the-all/')
    issues.push('Legacy retirement prerequisite not declared');
  // This is a waiver, NOT a claim that owner's backup, cached tabs or rollback were proven.
  if(!RELEASE_PROOF_KEYS.every(key=>manifest?.proofs?.[key]?.status==='blocked'&&
    manifest.proofs[key].receipt===null))issues.push('Historical proof states were altered');
  return {ready:issues.length===0,issues};
}
