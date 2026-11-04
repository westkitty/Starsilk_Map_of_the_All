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

/** Visual thresholds in editorial display units; never physical/canonical. */
export const GALAXY_ZOOM_RADIUS=57;
export const PLANET_ZOOM_RADIUS=12;
export const SYSTEM_EXIT_RADIUS=230;
export const GALAXY_EXIT_RADIUS=290;
export function findScaleZoomTarget({viewKind,zooming,blocked,candidates=[],selectedId=null}){
  if(!zooming||blocked)return null;
  const [kind,radius]=viewKind==='all'?['galaxy',GALAXY_ZOOM_RADIUS]:
    viewKind==='system'?['planet',PLANET_ZOOM_RADIUS]:[null,0];
  const eligible=candidates.filter(c=>c.kind===kind&&c.visible!==false&&
    Number.isFinite(c.distance)&&c.distance<radius&&
    Number.isFinite(c.screenX)&&Number.isFinite(c.screenY)&&
    Math.abs(c.screenX)<.88&&Math.abs(c.screenY)<.88);
  eligible.sort((a,b)=>(a.id===selectedId?-1:0)-(b.id===selectedId?-1:0)||a.distance-b.distance);
  return eligible[0]?.id||null;
}
export function shouldZoomOut({viewKind,outward,blocked,distance}){
  return Boolean(outward&&!blocked&&Number.isFinite(distance)&&
    (viewKind==='system'&&distance>=SYSTEM_EXIT_RADIUS||
     viewKind==='galaxy'&&distance>=GALAXY_EXIT_RADIUS));
}
export function scaleEntryFactor(from,to,size=1){
  if(from==='galaxy'&&to==='system')return .22;
  if(from==='system'&&to==='galaxy')return 2.6;
  if(from==='all'&&to==='galaxy')return Math.max(.18,Math.min(.65,size*.34));
  if(from==='galaxy'&&to==='all')return 2.6;
  return 1;
}
