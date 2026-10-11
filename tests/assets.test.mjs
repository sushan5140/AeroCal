import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import {buildAirport,planeModel} from '../airport-assets.js';
// Canvas stub validates asset construction and transforms, not pixels or WebGL rendering.
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){},createRadialGradient:()=>({addColorStop(){}})})})};
const scene=new THREE.Scene(),stats=buildAirport(scene);
test('airport geometry is finite, instanced and bounded',()=>{
  assert.ok(stats.instances>1000);assert.ok(stats.instanceBatches<60);
  scene.traverse(o=>{
    if(o.geometry){for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));o.geometry.computeBoundingSphere();assert.ok(Number.isFinite(o.geometry.boundingSphere.radius))}
    if(o.isInstancedMesh){for(const value of o.instanceMatrix.array)assert.ok(Number.isFinite(value));assert.ok(o.boundingSphere?.radius>0)}
  });
});
test('aircraft dimensions and ground contact match the airport scale',()=>{
  const plane=planeModel('#387ccc');plane.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(plane),size=box.getSize(new THREE.Vector3());
  assert.ok(size.x>=14&&size.x<15);assert.ok(size.z>13&&size.z<15);assert.ok(size.y<6);
  assert.ok(Math.abs(box.min.y)<.02,'wheels should meet pavement');
  assert.ok(plane.children.length<25,'repeated aircraft details should be batched');
  assert.ok(plane.children.some(o=>o.isInstancedMesh&&o.count===44),'cabin windows are instanced');
  for(const o of plane.children){o.geometry.computeBoundingSphere();assert.ok(Number.isFinite(o.geometry.boundingSphere.radius))}
});
test('hero camera includes terminal, tower and runway at desktop and mobile ratios',()=>{
  for(const [aspect,distance] of [[1.6,244],[.75,310]]){
    const camera=new THREE.PerspectiveCamera(38,aspect,.2,1000),azimuth=.27,elevation=.51;
    camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,3+Math.sin(elevation)*distance,8+Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(0,3,8);camera.updateMatrixWorld();
    for(const [name,coords] of [['terminal',[0,3,56]],['tower',[-31,18,61]],['runway',[0,0,-40]]]){const p=new THREE.Vector3(...coords).project(camera);assert.ok(Math.abs(p.x)<.95&&Math.abs(p.y)<.95&&p.z<1,`${name} is outside ${aspect} hero composition`)}
  }
});
console.log('Asset construction diagnostics:',stats);
