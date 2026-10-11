// Phase 3 refines the existing progressive-enhancement renderer and replay contract.
import * as THREE from './vendor/three.module.min.js';
import { buildAirport, planeModel, contactTexture } from './airport-assets.js';
import { FLIGHTS, flightPose, routePoints, clamp } from './trajectory.js';

const host=document.getElementById('scene');
if(!host) throw new Error('Airport mount missing');
const lowHardware=(navigator.hardwareConcurrency||8)<=4 || (navigator.deviceMemory||8)<=4;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
const mobile=()=>host.clientWidth<700;
let quality=lowHardware?'balanced':'high';
function setQuality(level) {
  quality=level;
  renderer.setPixelRatio(Math.min(devicePixelRatio,level==='high'?1.65:1));
  renderer.shadowMap.enabled=level==='high';
  scene.traverse(o=>{if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.needsUpdate=true}});
}
renderer.setPixelRatio(Math.min(devicePixelRatio,lowHardware?1:1.65));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=!lowHardware;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.className='aerocal-three';
renderer.domElement.setAttribute('aria-label','Synthetic 3D airport. Drag to orbit; pinch or scroll to zoom. Use flight labels to select aircraft.');
renderer.domElement.style.cssText='position:absolute;inset:0;z-index:1;touch-action:none;cursor:grab';
const scene=new THREE.Scene();scene.background=new THREE.Color('#cadce8');scene.fog=new THREE.Fog('#cadce8',255,510);
const camera=new THREE.PerspectiveCamera(38,1,.2,1000);
const hero={azimuth:.27,elevation:.51,distance:244};
let azimuth=hero.azimuth,elevation=hero.elevation,distance=hero.distance;
let targetAzimuth=azimuth,targetElevation=elevation,targetDistance=distance;
const origin=new THREE.Vector3(0,3,8);
function heroDistance(){return mobile()?310:244}
function resetHero(){targetAzimuth=hero.azimuth;targetElevation=hero.elevation;targetDistance=heroDistance()}
function cameraUpdate(dt=1/60) {
  const k=reducedMotion?1:1-Math.exp(-10*dt);
  azimuth+=(targetAzimuth-azimuth)*k;elevation+=(targetElevation-elevation)*k;distance+=(targetDistance-distance)*k;
  camera.position.set(origin.x+Math.sin(azimuth)*Math.cos(elevation)*distance,origin.y+Math.sin(elevation)*distance,origin.z+Math.cos(azimuth)*Math.cos(elevation)*distance);
  camera.lookAt(origin);camera.updateMatrixWorld();
}
// Soft sky gradient, diffuse fill, warm directional key and inexpensive contact AO.
scene.add(new THREE.HemisphereLight('#e4f0ff','#849275',1.55));
scene.add(new THREE.AmbientLight('#eef3f5',.2));
const sun=new THREE.DirectionalLight('#fff1dc',2.35);sun.position.set(-90,150,75);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-140,right:140,top:130,bottom:-120,near:5,far:380});
sun.shadow.bias=-.00015;sun.shadow.normalBias=.12;sun.shadow.radius=3;sun.target.position.set(0,0,12);scene.add(sun,sun.target);
const sky=new THREE.Mesh(new THREE.SphereGeometry(800,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#b8d4ed')},bottom:{value:new THREE.Color('#e9efec')}},vertexShader:'varying vec3 vWorld; void main(){vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 vWorld;void main(){float h=clamp((vWorld.y+25.0)/220.0,0.0,1.0);gl_FragColor=vec4(mix(bottom,top,smoothstep(0.0,1.0,h)),1.0);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }'}));
scene.add(sky);
const assetStats=buildAirport(scene);
const clouds=new THREE.InstancedMesh(new THREE.SphereGeometry(1,16,10),new THREE.MeshStandardMaterial({color:'#eaf0ef',roughness:1,transparent:true,opacity:.6,depthWrite:false}),24);
const cloudDummy=new THREE.Object3D();
for(let i=0;i<24;i++){cloudDummy.position.set(-210+(i%8)*60,65+(i%3)*9,-190-Math.floor(i/8)*36);cloudDummy.scale.set(14+(i%3)*4,4+(i%2),7);cloudDummy.updateMatrix();clouds.setMatrixAt(i,cloudDummy.matrix)}scene.add(clouds);

const labels=document.createElement('div');labels.className='aircraft-labels';
const scratch=new THREE.Vector3(),ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
const shadowMap=contactTexture();
// Parked stand assets are synthetic set dressing, separate from the selectable replay fleet.
for(const [x,color] of [[-70,'#678ab8'],[-22,'#ca8067'],[74,'#8c9a86']]) {
  const parked=planeModel(color);parked.position.set(x,0,38);parked.rotation.y=-Math.PI/2;scene.add(parked);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(15,17),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,opacity:.62,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.024,38);scene.add(shadow);
}
const aircraft=FLIGHTS.map(f=>{
  const model=planeModel(f.color);model.userData.flightId=f.id;scene.add(model);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(17,15),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,opacity:.62,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
  const points=routePoints(f);let route=null;
  if(points.length){route=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineDashedMaterial({color:f.color,transparent:true,opacity:.26,dashSize:2,gapSize:1.1,depthWrite:false}));route.computeLineDistances();scene.add(route)}
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24),3));
  const trail=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({color:f.color,transparent:true,opacity:.65,depthWrite:false}));scene.add(trail);
  const label=document.createElement('button');label.type='button';label.className='aircraft-label';label.style.setProperty('--flight-color',f.color);
  label.innerHTML='<strong>'+f.id+'</strong><span>Synthetic · <em></em></span>';label.setAttribute('aria-label','Select synthetic aircraft '+f.id);
  label.addEventListener('click',()=>window.AeroCalSelect?.(f.id));labels.append(label);
  return {...f,model,shadow,route,trail,label,status:label.querySelector('em')};
});
const planeAxis=new THREE.Vector3(1,0,0),orientation=new THREE.Quaternion(),heading=new THREE.Vector3();
const metrics={quality,drawCalls:0,triangles:0,frameMs:null,...assetStats};
let updateStatus='';
function updatePlanes() {
  const app=window.AeroCalState||{progress:0,density:'medium',selected:'DAL256'},count=app.density==='low'?3:app.density==='high'?6:5;
  const poses={};
  for(let i=0;i<aircraft.length;i++) {
    const f=aircraft[i],visible=i<count,selected=f.id===app.selected,p=flightPose(f,app.progress);poses[f.id]=p;
    f.model.visible=visible;f.shadow.visible=visible;if(f.route)f.route.visible=visible;f.trail.visible=visible && f.kind!=='parked' && !reducedMotion;
    f.label.hidden=!visible;if(!visible)continue;
    f.model.position.set(p.x,p.y,p.z);
    // Orientation is a pure function of replay time: reverse seeking never retains stale rotation.
    heading.set(Math.cos(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.sin(p.yaw)*Math.cos(p.pitch));
    orientation.setFromUnitVectors(planeAxis,heading);f.model.quaternion.copy(orientation);
    f.shadow.position.set(p.x,.024,p.z);f.shadow.material.opacity=.62*Math.exp(-p.y/9);f.shadow.rotation.z=-p.yaw;
    if(f.route)f.route.material.opacity=selected ? .52 : .15;
    // A short moving route tracer follows exactly the same clock-derived position function.
    const positions=f.trail.geometry.attributes.position;
    for(let j=0;j<8;j++){const q=flightPose(f,Math.max(0,app.progress-8+j));positions.setXYZ(j,q.x,q.y+.13,q.z)}
    positions.needsUpdate=true;f.trail.geometry.computeBoundingSphere();
    scratch.copy(f.model.position);scratch.y+=4.8;scratch.project(camera);
    const x=(scratch.x*.5+.5)*host.clientWidth,y=(-scratch.y*.5+.5)*host.clientHeight;
    const onscreen=scratch.z>-1 && scratch.z<1 && x>30 && x<host.clientWidth-30 && y>64 && y<host.clientHeight-76;
    f.label.hidden=!onscreen || (mobile()&&!selected);
    f.label.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
    f.label.classList.toggle('active',selected);f.label.setAttribute('aria-pressed',String(selected));
    if(f.status.textContent!==p.state)f.status.textContent=p.state;
    const width=110+p.state.length*2;f.labelRect={left:x-width/2,right:x+width/2,top:y-40,bottom:y};
  }
  // Hide overlapping unselected labels instead of disconnecting them from their aircraft.
  const placed=[];
  for(const f of [...aircraft].sort((a,b)=>(b.id===app.selected)-(a.id===app.selected))){
    if(f.label.hidden)continue;const rect=f.labelRect;
    if(placed.some(r=>rect.left<r.right+5&&rect.right>r.left-5&&rect.top<r.bottom+5&&rect.bottom>r.top-5)){f.label.hidden=true;continue}placed.push(rect);
  }
  window.AeroCalPoses=poses;
  const state=poses[app.selected]?.state;
  if(state&&state!==updateStatus){document.getElementById('selectedState').textContent=state;updateStatus=state}
  const inAir=aircraft.slice(0,count).filter(f=>poses[f.id].y>.1).length;
  document.getElementById('numAir').textContent=inAir;document.getElementById('numGround').textContent=count-inAir;
  for(const row of document.querySelectorAll('#flightRows tr')){const p=poses[row.dataset.id];if(p&&row.cells[1].textContent!==p.state)row.cells[1].textContent=p.state}
  for(const dot of document.querySelectorAll('[data-map-flight]')){const p=poses[dot.dataset.mapFlight];if(p){dot.setAttribute('cx',String(150+p.x));dot.setAttribute('cy',String(105+p.z));dot.style.display=aircraft.findIndex(f=>f.id===dot.dataset.mapFlight)<count?'':'none'}}
}

const pointers=new Map();let moved=0,pinchDistance=0,gestureWasMulti=false;
function zoomBy(factor){targetDistance=clamp(targetDistance*factor,80,410)}
renderer.domElement.addEventListener('pointerdown',e=>{
  if(!pointers.size)gestureWasMulti=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';
  if(pointers.size===2){gestureWasMulti=true;const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y)}
});
renderer.domElement.addEventListener('pointermove',e=>{
  const prev=pointers.get(e.pointerId);if(!prev)return;
  const dx=e.clientX-prev.x,dy=e.clientY-prev.y;moved+=Math.abs(dx)+Math.abs(dy);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(d>0&&pinchDistance>0)zoomBy(pinchDistance/d);pinchDistance=d}
  else {targetAzimuth-=dx*.004;targetElevation=clamp(targetElevation+dy*.003,.2,1.18)}
});
function release(e,cancel=false){
  const wasMulti=pointers.size>1;pointers.delete(e.pointerId);renderer.domElement.style.cursor='grab';
  if(cancel||wasMulti||gestureWasMulti||moved>7)return;
  const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(aircraft.filter(f=>f.model.visible).map(f=>f.model),true)[0];
  if(hit){let o=hit.object;while(o&&!o.userData.flightId)o=o.parent;if(o)window.AeroCalSelect?.(o.userData.flightId)}
}
renderer.domElement.addEventListener('pointerup',e=>release(e));renderer.domElement.addEventListener('pointercancel',e=>release(e,true));
renderer.domElement.addEventListener('lostpointercapture',e=>pointers.delete(e.pointerId));
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(clamp(e.deltaY,-300,300)*.0015))},{passive:false});
renderer.domElement.addEventListener('dblclick',e=>{e.preventDefault();zoomBy(.7)});
const controls=document.createElement('div');controls.className='camera-controls';
function button(text,title,action,cls=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.setAttribute('aria-label',title);b.className=cls;b.addEventListener('click',action);controls.append(b);return b}
button('+','Zoom in',()=>zoomBy(.72));button('−','Zoom out',()=>zoomBy(1.39));
button('⌂ Hero view','Reset to Hero View',resetHero,'hero-control');
const qualityButton=button(lowHardware?'Balanced':'High detail','Toggle scene quality',()=>{setQuality(quality==='high'?'balanced':'high');qualityButton.textContent=quality==='high'?'High detail':'Balanced';autoScaled=true},'quality-control');
const badge=document.createElement('div');badge.className='scene-badge';badge.innerHTML='<i></i><strong>SYNTHETIC AIRPORT</strong><span>Scenario replay · illustrative trajectories</span>';
const hint=document.createElement('div');hint.className='scene-hint';hint.textContent='Drag to orbit · Scroll / pinch to zoom';
// Mount only after successful scene construction; module failure retains the SVG fallback.
renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();
resetHero();distance=targetDistance;cameraUpdate();updatePlanes();renderer.render(scene,camera);
host.append(renderer.domElement,labels,controls,badge,hint);host.classList.add('has-three');window.AeroCal3DReady=true;
let previousHeroDistance=heroDistance();
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h);if(!pointers.size&&Math.abs(targetDistance-previousHeroDistance)<1)targetDistance=heroDistance();previousHeroDistance=heroDistance()}).observe(host);
let last=0,elapsed=0,samples=0,slowWindows=0,autoScaled=false;
function frame(now) {
  if(document.hidden){last=now;return}
  const dt=last?Math.min(.1,(now-last)/1000):1/60;last=now;
  cameraUpdate(dt);updatePlanes();renderer.render(scene,camera);
  elapsed+=dt;samples++;
  if(elapsed>=3){const mean=elapsed*1000/samples;metrics.frameMs=Math.round(mean*10)/10;metrics.quality=quality;metrics.drawCalls=renderer.info.render.calls;metrics.triangles=renderer.info.render.triangles;
    if(mean>28&&quality==='high')slowWindows++;else slowWindows=0;
    if(slowWindows>=2&&!autoScaled){setQuality('balanced');qualityButton.textContent='Balanced';autoScaled=true}
    elapsed=0;samples=0;
  }
}
renderer.setAnimationLoop(frame);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);host.classList.remove('has-three');for(const el of [renderer.domElement,labels,controls,badge,hint])el.hidden=true;window.AeroCal3DReady=false;document.getElementById('sceneStatus').textContent='2D fallback · graphics context unavailable'});
renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
// Read-only diagnostics support reproducible manual performance/replay verification.
window.AeroCalDiagnostics={metrics,pose:(id,t)=>flightPose(FLIGHTS.find(f=>f.id===id),t),camera:()=>({azimuth,elevation,distance}),resetHero};
