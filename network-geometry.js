/** Batch equal-style network guide segments into one WebGL submission.
 * Input is a flat even-length list of Vector3 endpoint pairs, in world space.
 * Every pair gets independent dash distances; caller owns scene disposal.
 */
import * as THREE from 'three';

export function dashedLineBatch(endpoints,color,opacity){
  if(!endpoints.length)return null;
  if(endpoints.length%2!==0)throw new RangeError('Line batch requires endpoint pairs');
  const geometry=new THREE.BufferGeometry().setFromPoints(endpoints);
  geometry.computeBoundingSphere();
  const material=new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:3,gapSize:2});
  const distances=[];
  for(let i=0;i<endpoints.length;i+=2){
    distances.push(0,endpoints[i].distanceTo(endpoints[i+1]));
  }
  geometry.setAttribute('lineDistance',new THREE.Float32BufferAttribute(distances,1));
  return new THREE.LineSegments(geometry,material);
}
