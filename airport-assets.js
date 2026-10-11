import * as THREE from './vendor/three.module.min.js';
import { GATES, TAXI_ROUTES } from './trajectory.js';

// Reusable procedural assets: shared geometry/materials, batched static instances.
const box = new THREE.BoxGeometry(1,1,1);
const sphere = new THREE.SphereGeometry(1,20,12);
const cylinder = new THREE.CylinderGeometry(1,1,1,24);
const dummy = new THREE.Object3D();
const material = (color, roughness=.8, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const M = {
  grass:material('#91ae82'), pavement:material('#8b9496'), runway:material('#596268'),
  white:material('#f1eee6'), yellow:material('#e5b552'), wall:material('#d8dedb'),
  roof:material('#e5e9e5'), frame:material('#e2ebe7',.65,.1),
  glass:new THREE.MeshPhysicalMaterial({color:'#7eabb5',roughness:.3,metalness:.15,transparent:true,opacity:.76,clearcoat:.28,depthWrite:false}),
  interior:material('#b8c8c7'), dark:material('#34464a'), blue:material('#5b7b8e'),
  trunk:material('#867966'), leaf:material('#69966b'), leafLight:material('#83a673'),
  rubber:material('#323c40'), steel:material('#9daead',.55,.3), solar:material('#456a7b',.48,.16),
  amber:new THREE.MeshStandardMaterial({color:'#ffcf87',emissive:'#f4b95f',emissiveIntensity:.35}),
  lamp:new THREE.MeshStandardMaterial({color:'#e7eeec',emissive:'#c8e3ec',emissiveIntensity:.5}),
};
export function contactTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(32,45,47,.38)');g.addColorStop(.4,'rgba(32,45,47,.2)');g.addColorStop(1,'rgba(32,45,47,0)');
  c.fillStyle=g;c.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}
function paintTexture(base) {
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
  ctx.fillStyle=base;ctx.fillRect(0,0,128,128);
  let seed=719;for(let i=0;i<3200;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%128;seed=(seed*1664525+1013904223)>>>0;const y=seed%128;ctx.fillStyle=i%2?'#ffffff08':'#00000008';ctx.fillRect(x,y,1,1)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(24,24);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export function buildAirport(scene) {
  const pools=new Map();
  function add(geometry,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0) {
    const key=geometry.uuid+mat.uuid; if(!pools.has(key))pools.set(key,{geometry,mat,transforms:[]});
    dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();
    pools.get(key).transforms.push(dummy.matrix.clone());
  }
  const block=(w,h,d,mat,x,y,z,ry=0)=>add(box,mat,x,y,z,w,h,d,0,ry);
  const ball=(r,mat,x,y,z,sx=1,sy=1,sz=1)=>add(sphere,mat,x,y,z,r*sx,r*sy,r*sz);
  const column=(r,h,mat,x,y,z)=>add(cylinder,mat,x,y,z,r,h,r);
  function stripe(a,b,mat=M.yellow,width=.16,y=.052) {
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    block(len,.018,width,mat,(a[0]+b[0])/2,y,(a[1]+b[1])/2,-Math.atan2(dz,dx));
  }
  function line(points,mat=M.yellow,width=.16,y=.052) {for(let i=1;i<points.length;i++)stripe(points[i-1],points[i],mat,width,y)}
  function sign(text,x,z,w=2.7) {
    const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');
    ctx.fillStyle='#343b32';ctx.fillRect(0,0,256,96);ctx.fillStyle='#f1c15f';ctx.font='600 48px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,48);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
    const p=new THREE.Mesh(new THREE.PlaneGeometry(w,w*96/256),m);p.position.set(x,.9,z);scene.add(p);
    column(.06,.8,M.steel,x-w*.3,.4,z);column(.06,.8,M.steel,x+w*.3,.4,z);
  }
  // Organic, subtly textured field; raised ground edge kept outside the hero view.
  const groundMat=material('#ffffff');groundMat.map=paintTexture('#99b186');
  block(650,.3,550,groundMat,0,-.22,-25);
  block(225,.07,12,M.runway,0,-.015,-40);
  block(226,.06,11,M.pavement,0,-.02,-17);
  block(176,.07,35,M.pavement,0,-.015,32);
  // Connectors and rounded junction pads share the exact taxi network coordinates.
  for(const x of [-96,-80,96]) {block(11,.06,57,M.pavement,x,-.01,-6);column(9,.06,M.pavement,x,-.01,-17);column(9,.06,M.pavement,x,-.01,20)}
  block(31,.06,11,M.pavement,90,-.015,-40);
  block(11,.06,25,M.pavement,96,-.015,-29);
  line([[-110,-17],[110,-17]]);line([[-86,20],[96,20]]);
  for(const route of Object.values(TAXI_ROUTES))line(route.samples);
  // Runway edges, threshold bars, touchdown zones and numbered thresholds.
  for(const z of [-45.65,-34.35])line([[-112,z],[112,z]],M.white,.18);
  for(let x=-96;x<=96;x+=12)stripe([x,-40],[x+5,-40],M.white,.25);
  for(const x of [-103,103])for(let k=-4;k<=4;k++)block(5,.022,.55,M.white,x,.054,-40+k);
  for(const x of [-74,-58,58,74])for(const z of [-43,-37])block(5,.022,.7,M.white,x,.054,z);
  function groundText(text,x,z,rotation=0,size=5) {
    const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#f2f0e7';ctx.font='bold 98px system-ui';ctx.textAlign='center';ctx.fillText(text,128,101);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const p=new THREE.Mesh(new THREE.PlaneGeometry(size,size/2),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));p.rotation.set(-Math.PI/2,0,rotation);p.position.set(x,.077,z);scene.add(p);
  }
  groundText('09',-93,-40,Math.PI/2);groundText('27',93,-40,-Math.PI/2);
  for(const x of [-80,96])for(const z of [-29,-51]) {
    for(const dz of [-.42,.42])stripe([x-5,z+dz],[x+5,z+dz],M.yellow,.14);
    for(let xx=x-5;xx<x+5;xx+=1)stripe([xx,z+1],[xx+.5,z+1],M.yellow,.15);
    sign('A | 09–27',x+7,z+2,3);
  }
  for(let x=-110;x<=110;x+=5)for(const z of [-46, -34]){column(.055,.22,M.steel,x,.11,z);ball(.105,M.lamp,x,.25,z)}
  for(let x=-104;x<=104;x+=8)for(const z of [-23,-11])ball(.075,M.blue,x,.16,z);
  // Landside roads and parking behind the terminal, distinct from the apron.
  block(202,.05,7,M.runway,0,-.025,72);block(110,.05,17,M.pavement,-18,-.025,87);
  for(let x=-90;x<100;x+=7)stripe([x,72],[x+3,72],M.white,.12);
  for(let x=-68;x<38;x+=3.8)for(const z of [81,91]){line([[x,z-2],[x,z+2]],M.white,.08);block(1.7,.65,3,M.blue,x+1.7,.45,z)}
  // Multi-section terminal: recessed tinted glazing with a legible structural grid.
  for(const [x,w,d] of [[-57,54,12],[-4,49,16],[51,61,12]]) {
    block(w,6.8,d,M.interior,x,3.4,56);
    block(w+.7,.45,d+.8,M.roof,x,7.02,56);
    block(w,4.9,.1,M.glass,x,3.45,56-d/2-.06);
    block(w,.48,.32,M.wall,x,.24,56-d/2-.18);
    block(w,.18,.28,M.frame,x,3.2,56-d/2-.2);
    for(let xx=x-w/2+.8;xx<x+w/2;xx+=2.5)block(.12,6.1,.25,M.frame,xx,3.7,56-d/2-.2);
    for(let xx=x-w/2+2;xx<x+w/2;xx+=6) {
      block(3.7,.25,2,M.solar,xx,7.4,55);
      block(1.8,.7,1.3,M.steel,xx,7.62,59);
      // Warm interior detail without per-window lights.
      block(1.8,.12,.13,M.amber,xx,.85,56-d/2-.25);
    }
    for(const edge of [-1,1])block(.45,6.9,d,M.wall,x+edge*w/2,3.45,56);
  }
  // Roof ribs and canopy links visually unite all terminal sections.
  block(170,.6,2.3,M.roof,0,5.9,48.1);
  for(let x=-80;x<=80;x+=8)column(.16,5.7,M.wall,x,2.85,48.2);
  for(const [i,x] of GATES.entries()) {
    line([[x,26],[x,38]],M.yellow,.13);
    for(const dx of [-9,9])line([[x+dx,27],[x+dx,43]],M.white,.08);
    stripe([x-2,38],[x+2,38],M.yellow,.21);
    groundText('G'+(i+1),x,29,0,2.8);
    // Offset bridges meet the starboard forward cabin door at the stand nose.
    block(1.55,1.5,5.5,M.wall,x+1.8,2,46);
    block(1.58,.2,5.6,M.roof,x+1.8,2.86,46);
    block(.04,.68,5.15,M.glass,x+2.6,2.18,46);
    block(1.2,1.55,1.4,M.dark,x+1.35,2,43.4);
    column(.12,1.3,M.steel,x+1.8,.65,44.7);
    groundText('STOP',x,39.2,0,1.8);
    truck(x+8,43,i%2);truck(x-8,32,1);
    for(let k=0;k<3;k++)cart(x+8,36-k*1.8);
    sign('G'+(i+1),x+6,47,1.7);
  }
  // Tower: tapered shaft, octagonal glazed cab, roof disc and antenna.
  const shaft=new THREE.CylinderGeometry(1.45,2.4,16,8);
  add(shaft,M.wall,-31,8,61);
  column(3.9,2.7,M.glass,-31,17.2,61);column(4.25,.4,M.roof,-31,18.75,61);
  column(4,.25,M.wall,-31,15.8,61);column(.08,3,M.steel,-31,20.2,61);
  for(let a=0;a<8;a++){const theta=a*Math.PI/4;column(.08,2.9,M.frame,-31+Math.cos(theta)*3.75,17.25,61+Math.sin(theta)*3.75)}
  // Cargo hangar, fuel tanks and equipment beyond the active surfaces.
  block(25,5,13,M.wall,-105,2.5,43);block(27,.5,15,M.roof,-105,5.25,43);
  for(let x=-113;x<-96;x+=7)block(5,3.9,.1,M.blue,x,2,36.4);
  for(const x of [33,42,51]) {column(3.2,6,M.wall,x,3,-82);column(3.3,.3,M.roof,x,6.2,-82)}
  for(let x=-66;x<80;x+=35) {column(.09,10,M.steel,x,5,46);block(2.4,.3,.6,M.lamp,x,10.1,46)}
  function truck(x,z,type=0) {
    const m=type?M.amber:M.white;block(1.45,.75,2.9,m,x,.8,z);block(1.4,.9,1.1,M.white,x,1.3,z+.8);block(1.2,.4,.04,M.glass,x,1.5,z+1.36);
    for(const dx of [-.77,.77])for(const dz of [-.85,.85])add(cylinder,M.rubber,x+dx,.32,z+dz,.28,.17,.28,0,0,Math.PI/2);
  }
  function cart(x,z) {block(1.2,.18,1.3,M.steel,x,.45,z);block(.9,.45,.85,M.blue,x,.77,z);for(const dx of [-.52,.52])add(cylinder,M.rubber,x+dx,.25,z,.18,.12,.18,0,0,Math.PI/2)}
  truck(-99,29);truck(90,35);truck(-64,70);truck(46,70);
  function tree(x,z,s=1) {
    column(.14*s,2.1*s,M.trunk,x,1.05*s,z);
    ball(1.4*s,M.leaf,x,3*s,z,1,1.25,.9);
    ball(1.05*s,M.leafLight,x+.7*s,2.6*s,z+.4*s,1,1.1,1);
    ball(.9*s,M.leaf,x-.8*s,2.5*s,z-.3*s);
  }
  for(let i=0;i<64;i++){const x=-145+i*4.8;tree(x,-91-((i*7)%13),.7+((i*13)%8)/10)}
  for(let i=0;i<42;i++){const x=-122+i*6.1;tree(x,99+(i%3)*4,.8+(i%4)*.12)}
  for(const [x,z] of [[-119,7],[-104,-4],[-64,3],[-35,4],[15,3],[47,4],[75,5],[115,-8],[116,18],[-102,64],[104,66]])tree(x,z,.7);
  // Fog-separated skyline, with deterministic height variation.
  const city=material('#a3b5b9'),cityLight=material('#b9c7c7');
  for(let i=0;i<50;i++){const x=-235+i*9.7,h=5+(i*17%21);block(4+(i%4),h,5+(i%3)*2,i%2?city:cityLight,x,h/2,-160-(i%4)*13)}
  // Soft contact shading under terminal; all static repeated parts are instanced.
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(190,34),new THREE.MeshBasicMaterial({map:contactTexture(),transparent:true,depthWrite:false,opacity:.7}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.018,56);scene.add(shadow);
  for(const {geometry,mat,transforms} of pools.values()) {
    const mesh=new THREE.InstancedMesh(geometry,mat,transforms.length);
    transforms.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;
    mesh.castShadow=![M.glass,M.runway,M.pavement,M.white,M.yellow,groundMat].includes(mat);
    mesh.receiveShadow=mat!==M.glass;mesh.computeBoundingSphere();scene.add(mesh);
  }
  return {instanceBatches:pools.size,instances:[...pools.values()].reduce((n,p)=>n+p.transforms.length,0)};
}

const aircraftWhite=material('#efefea',.55,.04),wingMat=material('#cdd6d7',.65,.08);
const engineMat=material('#d9dedb',.6,.1),engineDark=material('#394447',.85);
const profile=[[-7,0],[-6.5,.23],[-5.6,.46],[-4,.66],[-2,.78],[2.9,.78],[4.5,.7],[5.7,.49],[6.7,.21],[7,0]];
const fuselageGeo=new THREE.LatheGeometry(profile.map(([x,r])=>new THREE.Vector2(r,x)),32);
fuselageGeo.rotateZ(-Math.PI/2);
function aeroSurface(points,depth=.12) {
  const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.03});
}
const wings=aeroSurface([[1.6,0],[-1.2,0],[-3,6.5],[-2.1,6.8],[.1,2.3]]);wings.rotateX(Math.PI/2);
const stabilizer=aeroSurface([[-4.6,0],[-6.4,0],[-6.8,2.6],[-6.15,2.9],[-5.1,1]]);stabilizer.rotateX(Math.PI/2);
const fin=aeroSurface([[-6.4,0],[-4.5,0],[-5.7,3],[-6.4,3.1]],.12);
const windowGeo=new THREE.SphereGeometry(1,8,6);
export function planeModel(accent) {
  const g=new THREE.Group(),tailMat=material(accent,.62,.02);
  function mesh(geo,m,x,y,z,sx=1,sy=1,sz=1) {const p=new THREE.Mesh(geo,m);p.position.set(x,y,z);p.scale.set(sx,sy,sz);p.castShadow=true;p.receiveShadow=true;g.add(p);return p}
  mesh(fuselageGeo,aircraftWhite,0,1.55,0);
  for(const side of [-1,1]) {
    mesh(wings,wingMat,0,1.2,0,1,1,side);
    mesh(stabilizer,wingMat,0,1.6,0,1,1,side);
    const engine=mesh(cylinder,engineMat,.25,.86,side*2.7,.47,1.9,.47);engine.rotation.z=Math.PI/2;
    const intake=mesh(cylinder,engineDark,1.22,.86,side*2.7,.37,.05,.37);intake.rotation.z=Math.PI/2;
    const rim=mesh(new THREE.TorusGeometry(.4,.035,6,20),M.steel,1.26,.86,side*2.7);rim.rotation.y=Math.PI/2;
    for(let i=0;i<22;i++)mesh(windowGeo,M.dark,-4.3+i*.43,1.82,side*.736,.073,.095,.035);
    mesh(box,M.steel,5.05,1.51,side*.57,.035,.8,.23); // forward door seam
    for(const x of [-1,4.7]) {
      mesh(cylinder,M.steel,x,.58,side*(x<0?.85:.15),.055,.68,.055);
      const wheel=mesh(cylinder,M.rubber,x,.24,side*(x<0?.93:.23),.235,.17,.235);wheel.rotation.x=Math.PI/2;
    }
  }
  mesh(fin,tailMat,0,1.95,-.06);
  mesh(sphere,M.dark,5.44,1.97,0,.46,.14,.49);
  const beacon=mesh(sphere,M.amber,-.8,2.36,0,.055,.055,.055);beacon.castShadow=false;
  // Cabin windows, wheels and duplicated engines become a handful of local batches.
  const batches=new Map();
  for(const child of [...g.children]) {
    child.updateMatrix();if(child.matrix.determinant()<0)continue;
    const key=child.geometry.uuid+child.material.uuid;
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);
  }
  for(const children of batches.values()) {
    if(children.length<2)continue;
    const instanced=new THREE.InstancedMesh(children[0].geometry,children[0].material,children.length);
    children.forEach((child,i)=>{instanced.setMatrixAt(i,child.matrix);g.remove(child)});
    instanced.castShadow=true;instanced.receiveShadow=true;instanced.computeBoundingSphere();g.add(instanced);
  }
  return g;
}
