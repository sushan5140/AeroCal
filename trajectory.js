// Synthetic, clock-driven choreography. Units are scene units, not operational metres.
// One route definition drives pavement centre lines, overlays, positions and headings.
export const GATES = [-70, -46, -22, 2, 26, 50, 74];
export const TERMINAL_BOUNDS = { minX: -86, maxX: 86, minZ: 48, maxZ: 65 };
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// Circular-looking quadratic corners, contained inside explicitly paved junctions.
export function roundedRoute(points, radius = 8) {
  const samples = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const r = Math.min(radius, dist(a, b) / 2, dist(b, c) / 2);
    const entry = [b[0] + (a[0] - b[0]) * r / dist(a, b), b[1] + (a[1] - b[1]) * r / dist(a, b)];
    const out = [b[0] + (c[0] - b[0]) * r / dist(b, c), b[1] + (c[1] - b[1]) * r / dist(b, c)];
    samples.push(entry);
    for (let j = 1; j <= 24; j++) {
      const t = j / 24, u = 1 - t;
      samples.push([u*u*entry[0] + 2*u*t*b[0] + t*t*out[0], u*u*entry[1] + 2*u*t*b[1] + t*t*out[1]]);
    }
  }
  samples.push(points.at(-1));
  let length = 0;
  const distances = samples.map((p, i) => i ? (length += dist(samples[i - 1], p)) : 0);
  return { samples, distances, length };
}
export function pointOnRoute(route, fraction) {
  const d = clamp(fraction) * route.length;
  let lo = 1, hi = route.distances.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (route.distances[m] < d) lo = m + 1; else hi = m; }
  const a = route.samples[lo - 1], b = route.samples[lo];
  const t = clamp((d - route.distances[lo - 1]) / (route.distances[lo] - route.distances[lo - 1] || 1));
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}
// Integral of a trapezoidal speed profile: smooth acceleration, cruise, braking.
export function taxiProgress(t) {
  t = clamp(t); const ramp = .14, norm = 1 - ramp;
  if (t < ramp) return t*t/(2*ramp*norm);
  if (t > 1-ramp) return 1 - (1-t)*(1-t)/(2*ramp*norm);
  return (t-ramp/2)/norm;
}
export const TAXI_ROUTES = {
  UAL118: roundedRoute([[85,-17],[-80,-17],[-80,20],[-46,20],[-46,38]]),
  AAL409: roundedRoute([[2,38],[2,20],[96,20],[96,-21]]),
  FFT332: roundedRoute([[62,20],[26,20],[26,38]], 6),
};
export const FLIGHTS = [
  { id: 'DAL256', color: '#4388ea', kind: 'arrival' },
  { id: 'SWA703', color: '#e38a42', kind: 'departure' },
  { id: 'UAL118', color: '#2caa96', kind: 'taxi', start: 0, end: 250 },
  { id: 'AAL409', color: '#426fc5', kind: 'taxi', start: 20, end: 220 },
  { id: 'FFT332', color: '#9270c5', kind: 'taxi', start: 0, end: 275 },
  { id: 'JAL221', color: '#6388ba', kind: 'parked' },
];
// Cubic Hermite coordinates preserve velocity across descent, flare and rollout.
function hermite(t, keys) {
  let i = 0; while (i < keys.length-2 && t > keys[i+1][0]) i++;
  const [ta,a,va] = keys[i], [tb,b,vb] = keys[i+1], h = tb-ta, u = clamp((t-ta)/h);
  if(a===b && va===0 && vb===0)return a;
  return (2*u**3-3*u*u+1)*a + (u**3-2*u*u+u)*h*va + (-2*u**3+3*u*u)*b + (u**3-u*u)*h*vb;
}
const arrivalX = [[0,-155,1.25],[90,-55,1],[155,60,.65],[205,88,0],[300,88,0]];
const arrivalY = [[0,23,-.24],[78,2,-.15],[100,0,0],[300,0,0]];
const departureEntry = roundedRoute([[-96,-17],[-96,-40],[-79,-40]],8);
const departureX = [[0,-79,0],[150,-79,0],[215,-12,2],[270,130,2.5],[300,200,2]];
const departureY = [[0,0,0],[215,0,0],[245,13,.7],[300,58,.9]];
export function flightPose(flight, seconds) {
  const t = clamp(seconds, 0, 300);
  if (flight.kind === 'parked') return { x:50, y:0, z:38, yaw:-Math.PI/2, pitch:0, bank:0, state:'At gate' };
  if (flight.kind === 'taxi') {
    const route = TAXI_ROUTES[flight.id], u = taxiProgress((t-flight.start)/(flight.end-flight.start));
    const p = pointOnRoute(route,u);
    // Spatial look-ahead smooths tangent changes without depending on previous frames.
    const a = pointOnRoute(route,clamp(u-.004)), b = pointOnRoute(route,clamp(u+.004));
    const yaw = Math.atan2(-(b[1]-a[1]),b[0]-a[0]);
    const state = t >= flight.end ? (flight.id === 'AAL409' ? 'Holding short' : 'At gate') : (t < flight.start ? 'At gate' : flight.id === 'AAL409' ? 'Taxi to runway' : 'Taxi to gate');
    return {x:p[0],y:0,z:p[1],yaw,pitch:0,bank:0,state};
  }
  const arriving = flight.kind === 'arrival';
  if(!arriving && t<150){
    const u=taxiProgress((t-115)/35),p=pointOnRoute(departureEntry,u);
    const a=pointOnRoute(departureEntry,clamp(u-.004)),b=pointOnRoute(departureEntry,clamp(u+.004));
    return {x:p[0],y:0,z:p[1],yaw:Math.atan2(-(b[1]-a[1]),b[0]-a[0]),pitch:0,bank:0,state:t<=115?'Awaiting departure':'Lining up'};
  }
  const xkeys = arriving ? arrivalX : departureX, ykeys = arriving ? arrivalY : departureY;
  const x=hermite(t,xkeys), y=Math.max(0,hermite(t,ykeys));
  const dt=.02, dx=hermite(Math.min(300,t+dt),xkeys)-hermite(Math.max(0,t-dt),xkeys);
  const dy=hermite(Math.min(300,t+dt),ykeys)-hermite(Math.max(0,t-dt),ykeys);
  let pitch = Math.atan2(dy,Math.max(dx,.001));
  if (arriving && t>78 && t<106) pitch += .055*Math.sin((t-78)/28*Math.PI); // flare
  if (!arriving && t>207 && t<238) pitch += .07*Math.sin((t-207)/31*Math.PI); // rotation
  const state = arriving ? (t<100?'Approach':t<205?'Rollout':'Runway exit hold') : t<150?'Awaiting departure':t<215?'Takeoff roll':'Climbing';
  return {x,y,z:-40,yaw:0,pitch:clamp(pitch,-.22,.42),bank:0,state};
}
export function routePoints(flight) {
  if (flight.kind === 'taxi') return TAXI_ROUTES[flight.id].samples.map(([x,z])=>[x,.12,z]);
  if (flight.kind === 'parked') return [];
  return Array.from({length:151},(_,i)=>{const p=flightPose(flight,i*2);return [p.x,p.y+.12,p.z];});
}
