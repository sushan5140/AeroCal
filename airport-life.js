// Decorative motion for the synthetic AeroCal 3D airport.
// Aircraft replay and research telemetry remain entirely controlled by trajectory.js.
import * as THREE from './vendor/three.module.min.js';
const vanBody=new THREE.BoxGeometry(1,1,1);
const tireGeo=new THREE.CylinderGeometry(.24,.24,.16,10);
const mat=(c,emissive)=>new THREE.MeshStandardMaterial({color:c,roughness:.66,metalness:.06,...(emissive?{emissive:c,emissiveIntensity:.4}:{})});
const rubber=mat('#242c32'),windows=mat('#567681'),white=mat('#f6f6ea'),amber=mat('#edb84a');
function piece(group,geo,m,x,y,z,sx=1,sy=1,sz=1,rz=0){
 const p=new THREE.Mesh(geo,m);p.position.set(x,y,z);p.scale.set(sx,sy,sz);p.rotation.z=rz;group.add(p);return p;
}
function serviceVan(tint,type){
 const g=new THREE.Group(),body=mat(tint);
 piece(g,vanBody,body,0,.63,0,3.2,.72,1.45);
 piece(g,vanBody,windows,.79,1.05,0,1.17,.55,1.32);
 piece(g,vanBody,white,-.55,1.05,0,1.7,.12,1.25);
 for(const x of [-1.08,1.08])for(const z of [-.78,.78]){
  const w=piece(g,tireGeo,rubber,x,.33,z);w.rotation.x=Math.PI/2;
 }
 if(type==='baggage'){
   piece(g,vanBody,mat('#d1e0e7'),-1.85,.45,0,1.1,.38,1.04);
 }else if(type==='fuel'){
   const tank=piece(g,new THREE.CylinderGeometry(.54,.54,1.62,12),white,-.55,1.17,0);
   tank.rotation.z=Math.PI/2;
 }else{
   piece(g,vanBody,amber,-.8,1.15,0,1.4,.18,.8);
 }
 const beacon=piece(g,new THREE.SphereGeometry(.17,8,6),amber,.63,1.39,0);
 return {group:g,beacon};
}
// These lanes intentionally stay within the visible apron or landside road.
// They are visual set dressing, not airport operational telemetry.
const routes=[
 {z:27,min:-78,max:77,speed:3.4,phase:0,tint:'#f1c66a',type:'baggage'},
 {z:30,min:73,max:-72,speed:2.5,phase:44,tint:'#b9d9f0',type:'fuel'},
 {z:70,min:-94,max:94,speed:5,phase:20,tint:'#f4ede0',type:'shuttle'},
 {z:73,min:91,max:-91,speed:4,phase:68,tint:'#f6d376',type:'baggage'}
];
export function createAirportLife(scene,clouds){
 const vehicles=routes.map(r=>{const v=serviceVan(r.tint,r.type);scene.add(v.group);return {...r,...v}});
 const stars=[];
 for(const color of ['#e7514e','#2aa36b']){
  const m=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false}));
  stars.push(m);
 }
 // No placement of decorative markers on moving research aircraft: prevents misleading state visuals.
 let last=0;
 function update(seconds,animate=true){
  if(!animate) return;
  for(const [i,v] of vehicles.entries()){
   const distance=Math.abs(v.max-v.min),span=distance*2;
   const u=((seconds*v.speed+v.phase)%span+span)%span;
   const step=u<=distance?u:span-u;
   const from=v.min,to=v.max;
   const direction=(u<=distance?1:-1)*Math.sign(to-from);
   v.group.position.set(from+Math.sign(to-from)*step,0,v.z);
   v.group.rotation.y=direction<0?Math.PI:0;
   v.beacon.material.emissiveIntensity=.16+.4*(.5+.5*Math.sin(seconds*5+i*1.7));
  }
  if(clouds)clouds.position.x=4*Math.sin(seconds*.012);
  last=seconds;
 }
 return {update,dispose(){vehicles.forEach(v=>scene.remove(v.group));stars.forEach(s=>s.geometry.dispose())}};
}