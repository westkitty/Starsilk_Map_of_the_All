/** Proximity in illustrative display units; never a physical distance. */
export const SYSTEM_ZOOM_RADIUS=17;
export function findSystemZoomTarget({viewKind,zooming,blocked,candidates=[],selectedId=null}){
  if(!zooming||blocked||(viewKind!=='galaxy'&&viewKind!=='system'))return null;
  const kind=viewKind==='galaxy'?'system':'planet';
  const radius=viewKind==='galaxy'?SYSTEM_ZOOM_RADIUS:12;
  let best=null;
  for(const c of candidates){
    if(c.kind!==kind||c.visible===false||!Number.isFinite(c.distance)||
      c.distance>=radius||!Number.isFinite(c.screenX)||!Number.isFinite(c.screenY)||
      Math.abs(c.screenX)>=.88||Math.abs(c.screenY)>=.88)continue;
    if(!best||(c.id===selectedId&&best.id!==selectedId)||
      (best.id!==selectedId&&c.distance<best.distance))best=c;
  }
  return best?.id||null;
}
