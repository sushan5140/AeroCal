import test from 'node:test';
import assert from 'node:assert/strict';
import {FLIGHTS,TAXI_ROUTES,flightPose,routePoints,pointOnRoute,TERMINAL_BOUNDS} from '../trajectory.js';

for (const f of FLIGHTS) {
  test(`${f.id}: deterministic reverse seeks and finite geometry`,()=>{
    const ts=[0,17,50,90,100,149,150,207,215,220,250,275,299,300];
    const original=ts.map(t=>flightPose(f,t));
    [...ts].reverse().forEach(t=>flightPose(f,t));
    assert.deepEqual(ts.map(t=>flightPose(f,t)),original);
    for(let t=0;t<=300;t+=.2){const p=flightPose(f,t);for(const key of ['x','y','z','yaw','pitch','bank'])assert.ok(Number.isFinite(p[key]));assert.ok(p.y>=0)}
    assert.deepEqual(flightPose(f,-10),flightPose(f,0));assert.deepEqual(flightPose(f,310),flightPose(f,300));
  });
  test(`${f.id}: no unintended jumps within replay`,()=>{
    let p=flightPose(f,0);
    for(let t=.1;t<=300;t+=.1){const q=flightPose(f,t);assert.ok(Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<.35);let delta=Math.atan2(Math.sin(q.yaw-p.yaw),Math.cos(q.yaw-p.yaw));assert.ok(Math.abs(delta)<.07,`yaw discontinuity ${t}: ${delta}`);p=q}
  });
}
for(const id of Object.keys(TAXI_ROUTES)) {
  const f=FLIGHTS.find(f=>f.id===id),r=TAXI_ROUTES[id];
  test(`${id}: shared painted centreline, terminal clearance and runway hold`,()=>{
    for(let t=0;t<=300;t+=.25){
      const p=flightPose(f,t);assert.equal(p.y,0);
      // Conservative 7.2-unit envelope includes nose, wings and fin.
      assert.ok(p.z+7.2<TERMINAL_BOUNDS.minZ,'aircraft envelope intersects terminal');
      assert.ok(p.z-7.2>-34,'taxi aircraft enters runway');
      const distanceToPolyline=Math.min(...r.samples.slice(1).map((b,i)=>{const a=r.samples[i],dx=b[0]-a[0],dz=b[1]-a[1];const u=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a[0]-u*dx,p.z-a[1]-u*dz)}));
      assert.ok(distanceToPolyline<1e-8);
    }
    const stop=pointOnRoute(r,1),p=flightPose(f,300);assert.deepEqual([p.x,p.z],stop);
    assert.deepEqual(flightPose(f,f.end+1),flightPose(f,300));
  });
}
test('arrival descends, touches down, rolls out and brakes',()=>{
  const f=FLIGHTS[0];assert.ok(flightPose(f,0).y>20);assert.equal(flightPose(f,100).y,0);
  assert.equal(flightPose(f,100).state,'Rollout');assert.ok(flightPose(f,155).x>flightPose(f,100).x);
  assert.deepEqual(flightPose(f,210),flightPose(f,300));
});
test('departure waits for landing rollout, rotates and climbs',()=>{
  const f=FLIGHTS[1];assert.deepEqual(flightPose(f,0),flightPose(f,114));
  assert.equal(flightPose(f,210).y,0);assert.ok(flightPose(f,215).pitch>0);
  assert.ok(flightPose(f,250).y>10);assert.ok(flightPose(f,300).y>50);
  for(let t=0;t<300;t+=.1){const a=flightPose(FLIGHTS[0],t),b=flightPose(f,t);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)>15,'runway choreography overlap')}
});
test('route overlays use the same paths as replay',()=>{
  for(const f of FLIGHTS){const pts=routePoints(f);if(f.kind==='parked'){assert.equal(pts.length,0);continue}if(f.kind==='taxi')assert.deepEqual(pts.map(([x,y,z])=>[x,z]),TAXI_ROUTES[f.id].samples);else pts.forEach(([x,y,z],i)=>{const p=flightPose(f,i*2);assert.equal(x,p.x);assert.equal(y,p.y+.12);assert.equal(z,p.z)})}
});
