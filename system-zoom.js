/** Semantic zoom is measured in illustrative scene units, never astronomical distances. */
export const SYSTEM_ZOOM_RADIUS=17;
export const GALAXY_ZOOM_RADIUS=57;
export const PLANET_ZOOM_RADIUS=12;
export function findScaleZoomTarget({viewKind,zooming,blocked,candidates=[],selectedId=null}){
  if(!zooming||blocked)return null;
  const kind={all:'galaxy',galaxy:'system',system:'planet'}[viewKind];
  const radius={all:GALAXY_ZOOM_RADIUS,galaxy:SYSTEM_ZOOM_RADIUS,system:PLANET_ZOOM_RADIUS}[viewKind];
  if(!kind)return null;
  const eligible=candidates.filter(c=>c.kind===kind&&c.visible!==false&&
    Number.isFinite(c.distance)&&c.distance<radius&&
    Number.isFinite(c.screenX)&&Number.isFinite(c.screenY)&&
    Math.abs(c.screenX)<.88&&Math.abs(c.screenY)<.88);
  eligible.sort((a,b)=>(a.id===selectedId?-1:0)-(b.id===selectedId?-1:0)||a.distance-b.distance);
  return eligible[0]?.id||null;
}
export const findSystemZoomTarget=findScaleZoomTarget;
export function scaleEntryFactor(from,to,size=1){
  if(from==='galaxy'&&to==='system')return .22;
  if(from==='system'&&to==='galaxy')return 2.6;
  if(from==='all'&&to==='galaxy')return Math.max(.18,Math.min(.65,size*.34));
  return 2.6;
}
