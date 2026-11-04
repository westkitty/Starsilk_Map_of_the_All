/** Semantic zoom operates in editorial display units, never physical distances. */
export const SYSTEM_ZOOM_RADIUS=17;
const targets={all:['galaxy',57],galaxy:['system',SYSTEM_ZOOM_RADIUS],system:['planet',12]};
export function findScaleZoomTarget({viewKind,zooming,blocked,candidates=[],selectedId=null}){
  if(!zooming||blocked)return null;
  const [kind,radius]=targets[viewKind]||[];
  const eligible=candidates.filter(c=>c.kind===kind&&c.visible!==false&&c.distance<radius&&
    Number.isFinite(c.distance)&&Number.isFinite(c.screenX)&&Number.isFinite(c.screenY)&&
    Math.abs(c.screenX)<.88&&Math.abs(c.screenY)<.88);
  eligible.sort((a,b)=>(b.id===selectedId)-(a.id===selectedId)||a.distance-b.distance);
  return eligible[0]?.id||null;
}
export const findSystemZoomTarget=findScaleZoomTarget;
export function scaleEntryFactor(from,to,size=1){
  return from==='galaxy'&&to==='system' ? .22 :
    from==='all'&&to==='galaxy'?Math.max(.18,Math.min(.65,size*.34)):2.6;
}
