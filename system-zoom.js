/** Semantic inward-dolly threshold for provisional stellar system inspection. No physics. */
export const SYSTEM_ZOOM_RADIUS=17;
export function findSystemZoomTarget({viewKind,zooming,blocked,candidates=[],selectedId=null}){
  if(viewKind!=='galaxy'||!zooming||blocked)return null;
  const eligible=candidates.filter(c=>c.kind==='system'&&c.visible!==false&&
    Number.isFinite(c.distance)&&c.distance<SYSTEM_ZOOM_RADIUS&&
    Number.isFinite(c.screenX)&&Number.isFinite(c.screenY)&&
    Math.abs(c.screenX)<.88&&Math.abs(c.screenY)<.88);
  eligible.sort((a,b)=>{
    if((a.id===selectedId)!==(b.id===selectedId))return a.id===selectedId?-1:1;
    return a.distance-b.distance;
  });
  return eligible[0]?.id||null;
}
