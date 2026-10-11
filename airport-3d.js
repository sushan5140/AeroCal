// AeroCal Phase 2: optional, progressive-enhancement Three.js airport.
// Visualization is synthetic and intentionally separate from scientific results.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js";
const host=document.getElementById("scene");
if(!host) throw new Error("Airport mount missing");
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(host.clientWidth,host.clientHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.className="aerocal-three";
renderer.domElement.setAttribute("aria-label","Interactive 3D airport visualization; drag to orbit and click aircraft");
renderer.domElement.style.cssText="position:absolute;inset:0;z-index:1;touch-action:pan-y;cursor:grab";
host.append(renderer.domElement);
host.querySelector("#airport").style.visibility="hidden";
host.querySelector(".skyline").style.visibility="hidden";
host.querySelectorAll(".flighttag").forEach(t=>t.style.visibility="hidden");
const scene=new THREE.Scene();scene.background=new THREE.Color("#d6ecff");scene.fog=new THREE.Fog("#d6ecff",82,180);
const camera=new THREE.PerspectiveCamera(38,Math.max(1,host.clientWidth/host.clientHeight),0.1,260);
const origin=new THREE.Vector3(0,0,0);
let azimuth=-0.65,elevation=0.95,distance=80;
function cameraUpdate(){camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(origin)}
cameraUpdate();
scene.add(new THREE.HemisphereLight("#ffffff","#90b0b8",2.35));
const sun=new THREE.DirectionalLight("#fff3df",3.3);sun.position.set(-30,75,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;sun.shadow.camera.near=1;sun.shadow.camera.far=180;sun.shadow.bias=-.0002;scene.add(sun);
const mat=(hex,roughness=.72,metalness=0)=>new THREE.MeshStandardMaterial({color:hex,roughness,metalness});
const grass=mat("#b8d5a6"),tarmac=mat("#8794a4"),runway=mat("#586779"),lineWhite=mat("#e6f0f7"),yellow=mat("#f9c767"),glass=mat("#94c9e1",.24,.15),roof=mat("#f6faff"),terminalWall=mat("#dbe9f3"),treeGreen=mat("#7bb88a"),blue=mat("#387dec",.4),red=mat("#e0836f",.5);
function block(w,h,d,m,x,y,z,cast=false){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
block(180,.6,140,grass,0,-.35,0);
block(136,.15,16,runway,0,.03,-22);block(136,.13,15,runway,0,.02,19);
for(let x=-64;x<=64;x+=9){block(5,.025,.24,lineWhite,x,.13,-22);block(5,.025,.24,lineWhite,x,.12,19)}
for(let x=-66;x<=66;x+=6){for(const z of [-29.8,-14.2,11.2,26.8]){const light=new THREE.Mesh(new THREE.SphereGeometry(.19,7,7),new THREE.MeshBasicMaterial({color:"#94d6ff"}));light.position.set(x,.24,z);scene.add(light)}}
block(140,.14,11,tarmac,0,.1,-1);block(140,.14,10,tarmac,0,.12,36);
for(let x=-65;x<66;x+=3)block(1.6,.02,.16,yellow,x,.21,-1);
for(let x=-65;x<66;x+=4)block(2,.02,.16,yellow,x,.21,36);
block(78,.18,29,tarmac,0,.15,53);
block(67,7,10,terminalWall,0,4,62,true);block(70,1.3,13,roof,0,8.1,62,true);
block(67,4.4,.35,glass,0,4.2,56.8);for(let x=-31;x<=31;x+=4)block(.2,4.3,.45,roof,x,4.2,56.5);
for(const x of [-25,-10,5,20]){block(2.6,1.1,8,terminalWall,x,3,52,true);block(3.5,.25,8,roof,x,3.65,52);block(.8,1.3,.5,mat("#49728c"),x,2.2,47.8)}
const tower=block(3.1,14,3.1,terminalWall,-39,7.4,59,true);const cap=block(7,3.1,6,glass,-39,15.8,59,true);block(8,1,7,roof,-39,17.8,59,true);
function tree(x,z,scale=1){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.33,2,6),mat("#98836d"));trunk.position.set(x,1,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.7*scale,1),treeGreen);crown.position.set(x,2.9*scale,z);crown.castShadow=true;scene.add(crown)}
for(let x=-72;x<72;x+=9){tree(x,-43,.8);if(x%3)tree(x,82,.75)}
for(let x=-65;x<62;x+=22){block(6,3.4,4,mat("#d9e3ee"),x,1.8,92,true)}
// Bezier-derived routes are intentionally not real navigation procedures.
function path(points){return new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,"catmullrom",.45)}
const routes=[
{ id:"DAL256", state:"Approach", c:"#478bf8",curve:path([[-74,19,-22],[-48,12,-22],[-21,5,-22],[13,.65,-22],[48,.65,-22]]) },
{ id:"SWA703",state:"Departing",c:"#fba352",curve:path([[-51,.65,19],[-25,.65,19],[8,2,19],[33,12,19],[61,26,19]]) },
{ id:"UAL118",state:"Taxi to gate",c:"#33bcac",curve:path([[-53,.75,-1],[-29,.75,-1],[-16,.75,10],[-16,.75,35],[-25,.75,51]]) },
{ id:"AAL409",state:"Taxi to runway",c:"#347df4",curve:path([[32,.75,49],[30,.75,35],[28,.75,-1],[56,.75,-1]]) },
{ id:"FFT332",state:"To gate",c:"#ab77f0",curve:path([[-3,.75,-1],[5,.75,9],[5,.75,36],[5,.75,49]]) },
{ id:"JAL221",state:"At gate",c:"#9aacc6",curve:path([[21,.75,49],[21,.75,49.01]]) }
];
function planeModel(accent){const g=new THREE.Group(),white=mat("#f9fdff",.27,.08),wing=mat("#dbe7ef",.35),tail=mat(accent,.35);
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.72,8,4),white);body.rotation.z=Math.PI/2;body.scale.set(1,2.7,1);body.position.y=.83;g.add(body);
const nose=new THREE.Mesh(new THREE.ConeGeometry(.69,2,10),white);nose.rotation.z=-Math.PI/2;nose.position.set(3.45,.83,0);g.add(nose);
const wings=new THREE.Mesh(new THREE.BoxGeometry(2.2,.17,9.4),wing);wings.position.set(-.4,.7,0);g.add(wings);
const stabilizers=new THREE.Mesh(new THREE.BoxGeometry(1.15,.12,3.2),wing);stabilizers.position.set(-3,.78,0);g.add(stabilizers);
const fin=new THREE.Mesh(new THREE.BoxGeometry(1.15,2.45,.17),tail);fin.position.set(-3.1,1.85,0);g.add(fin);
g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});g.userData.isPlane=true;return g}
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),aircraft=[];
for(const r of routes){const geometry=new THREE.TubeGeometry(r.curve,115,.07,5,false);const material=new THREE.MeshBasicMaterial({color:r.c,transparent:true,opacity:.5});const tube=new THREE.Mesh(geometry,material);scene.add(tube);const p=planeModel(r.c);p.userData.flightId=r.id;scene.add(p);aircraft.push({...r,model:p,tube});}
function updatePlanes(){const app=window.AeroCalState||{progress:0,density:"medium",selected:"DAL256"};const count=app.density==="low"?3:app.density==="high"?6:5;for(let i=0;i<aircraft.length;i++){const f=aircraft[i];f.model.visible=i<count;f.tube.visible=i<count;if(!f.model.visible)continue;const u=f.id==="JAL221"?.98:Math.min(.999,Math.max(0,(app.progress/300+i*.071)%1));const pos=f.curve.getPointAt(u);const tangent=f.curve.getTangentAt(u);f.model.position.copy(pos);f.model.rotation.y=Math.atan2(-tangent.z,tangent.x);f.model.scale.setScalar(f.id===app.selected?1.25:1);f.tube.material.opacity=f.id===app.selected ? 0.95 : 0.37}}
let drag=false,px=0,py=0,moved=0;
renderer.domElement.addEventListener("pointerdown",e=>{drag=true;px=e.clientX;py=e.clientY;moved=0;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-px,dy=e.clientY-py;moved+=Math.abs(dx)+Math.abs(dy);azimuth-=dx*.005;elevation=Math.min(1.4,Math.max(.38,elevation+dy*.005));px=e.clientX;py=e.clientY;cameraUpdate()});
renderer.domElement.addEventListener("pointerup",e=>{drag=false;if(moved>8)return;const r=renderer.domElement.getBoundingClientRect();mouse.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(aircraft.filter(f=>f.model.visible).map(f=>f.model),true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.flightId)o=o.parent;if(o?.userData.flightId)window.AeroCalSelect?.(o.userData.flightId)}});
renderer.domElement.addEventListener("wheel",e=>{e.preventDefault();distance=Math.min(120,Math.max(35,distance+e.deltaY*.055));cameraUpdate()},{passive:false});
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h)}).observe(host);
let last=0;function frame(now){requestAnimationFrame(frame);if(now-last<25)return;last=now;updatePlanes();renderer.render(scene,camera)}
requestAnimationFrame(frame);
const badge=document.createElement("div");badge.textContent="3D REPLAY · Synthetic environment · Drag to orbit / Scroll to zoom";badge.style.cssText="position:absolute;z-index:2;top:12px;left:12px;background:#ffffffd9;color:#406182;border-radius:12px;font:600 10px system-ui;padding:9px;pointer-events:none";host.append(badge);
