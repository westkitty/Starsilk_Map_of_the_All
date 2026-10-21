/** Provisional proximity-cell geometry. Never serialized as borders or canon. */
import {convexHull,polygonArea} from './strategic-model.js';

export const MAX_SURVEY_SITES=32;
const finiteSite=n=>n&&typeof n.id==='string'&&n.position?.length===3&&
  Number.isFinite(n.position[0])&&Number.isFinite(n.position[2])&&
  Math.abs(n.position[0])<=10000&&Math.abs(n.position[2])<=10000;

function boundary(sites,pad){
  const pts=sites.map(n=>[n.position[0],n.position[2]]);
  const hull=convexHull(pts);
  if(hull.length<3||polygonArea(hull)<.01){
    const xs=pts.map(p=>p[0]),zs=pts.map(p=>p[1]);
    return [[Math.min(...xs)-pad,Math.min(...zs)-pad],[Math.max(...xs)+pad,Math.min(...zs)-pad],
      [Math.max(...xs)+pad,Math.max(...zs)+pad],[Math.min(...xs)-pad,Math.max(...zs)+pad]];
  }
  const center=hull.reduce((sum,p)=>[sum[0]+p[0]/hull.length,sum[1]+p[1]/hull.length],[0,0]);
  const radius=Math.max(...hull.map(p=>Math.hypot(p[0]-center[0],p[1]-center[1])));
  const scale=1+pad/Math.max(radius,.01);
  return hull.map(p=>[center[0]+(p[0]-center[0])*scale,center[1]+(p[1]-center[1])*scale]);
}
function halfPlane(points,nx,nz,limit){
  const result=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    const da=a[0]*nx+a[1]*nz-limit,db=b[0]*nx+b[1]*nz-limit;
    const insideA=da<=1e-7,insideB=db<=1e-7;
    if(insideA)result.push(a);
    if(insideA!==insideB){
      const t=da/(da-db);
      result.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
    }
  }
  return result;
}

/** Returns null for ambiguous/oversized sets so the renderer keeps its legacy
 * bounded halo fallback. Values are ephemeral geometry, not authoritative state.
 */
export function provisionalSurveyCells(sites,pad=30){
  if(!Array.isArray(sites)||sites.length>MAX_SURVEY_SITES||!Number.isFinite(pad)||pad<2||pad>200||
    sites.some(n=>!finiteSite(n))||new Set(sites.map(n=>n.id)).size!==sites.length)return null;
  if(!sites.length)return [];
  const ordered=[...sites].sort((a,b)=>a.id.localeCompare(b.id));
  for(let i=0;i<ordered.length;i++)for(let j=0;j<i;j++){
    const a=ordered[i].position,b=ordered[j].position;
    if(Math.hypot(a[0]-b[0],a[2]-b[2])<.01)return null;
  }
  const outline=boundary(ordered,pad);
  const result=[];
  for(const site of ordered){
    const ax=site.position[0],az=site.position[2];
    let cell=outline.map(p=>[...p]);
    for(const other of ordered){
      if(site===other)continue;
      const bx=other.position[0],bz=other.position[2];
      cell=halfPlane(cell,2*(bx-ax),2*(bz-az),bx*bx+bz*bz-ax*ax-az*az);
      if(cell.length<3)break;
    }
    if(cell.length<3||polygonArea(cell)<.01)return null;
    result.push({id:site.id,points:cell});
  }
  return result;
}
