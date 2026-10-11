import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
class Element {
  constructor(){this.children=[];this.style={};this.dataset={};this.listeners={};this.attrs={};this.textContent='';this.value=0;const classes=new Set();this.classList={toggle:(c,v)=>v?classes.add(c):classes.delete(c)}}
  append(...children){this.children.push(...children)}
  appendChild(child){this.children.push(child)}
  set innerHTML(s){this.children=[];this.markup=s}get innerHTML(){return this.markup||''}
  setAttribute(k,v){this.attrs[k]=v}addEventListener(type,fn){this.listeners[type]=fn}
  fire(type,props={}){this.listeners[type]?.({currentTarget:this,preventDefault(){},...props})}
  getBoundingClientRect(){return {width:1040,height:560}}scrollIntoView(){}
}
function start(reduced=false){
  const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id)};
  const densities=['low','medium','high'].map(d=>Object.assign(new Element(),{dataset:{d}}));
  const navs=['overview','runways','aircraft','analytics'].map(nav=>Object.assign(new Element(),{dataset:{nav}}));
  const frames=[];
  const context={console,window:{scrollTo(){}},document:{getElementById:get,createElement:()=>new Element(),createElementNS:()=>new Element(),querySelector:()=>new Element(),querySelectorAll:s=>s==='.density'?densities:s==='.nav'?navs:[]},matchMedia:()=>({matches:reduced}),performance:{now:()=>0},requestAnimationFrame:f=>frames.push(f),ResizeObserver:class{observe(){}}};
  vm.createContext(context);vm.runInContext(script,context);
  return {context,get,densities,navs,step:now=>frames.shift()(now)};
}
test('play, pause and all playback speeds synchronize the 3D contract immediately',()=>{
  const app=start();assert.equal(app.context.window.AeroCalState.playing,true);
  app.get('play').fire('click');assert.equal(app.context.window.AeroCalState.playing,false);
  app.step(16);assert.equal(app.context.window.AeroCalState.progress,0);
  app.get('play').fire('click');app.step(32);assert.ok(app.context.window.AeroCalState.progress>0);
  for(const speed of [2,.5,1]){app.get('speed').fire('click');assert.equal(app.context.window.AeroCalState.speed,speed)}
});
test('seeking in either direction and at replay end synchronizes deterministically',()=>{
  const app=start();app.get('play').fire('click');
  for(const value of [1000,500,0,777]){app.get('seek').value=value;app.get('seek').fire('input');assert.equal(app.context.window.AeroCalState.progress,value*.3)}
});
test('density, selection, table keyboard interaction and navigation remain connected',()=>{
  const app=start();app.densities[2].fire('click');assert.equal(app.get('flightRows').children.length,6);
  app.context.window.AeroCalSelect('JAL221');assert.equal(app.context.window.AeroCalState.selected,'JAL221'); // render synchronization below
});
test('selecting a flight and reducing density keeps the selection visible',()=>{
  const app=start();app.densities[2].fire('click');app.context.window.AeroCalSelect('JAL221');app.get('seek').fire('input');
  assert.equal(app.context.window.AeroCalState.selected,'JAL221');app.densities[0].fire('click');
  assert.equal(app.context.window.AeroCalState.density,'low');assert.equal(app.context.window.AeroCalState.selected,'DAL256');assert.equal(app.get('flightRows').children.length,3);
  app.get('flightRows').children[1].fire('keydown',{key:'Enter'});app.get('seek').fire('input');assert.equal(app.context.window.AeroCalState.selected,'SWA703');
  app.navs[1].fire('click');assert.equal(app.context.window.AeroCalState.progress,110);
});
test('reduced-motion preference starts paused',()=>{
  const app=start(true);assert.equal(app.context.window.AeroCalState.playing,false);assert.equal(app.get('play').attrs['aria-label'],'Play replay');
});
test('research values stay unmeasured and synthetic context is explicit',()=>{
  assert.ok(html.includes('SYNTHETIC DEMONSTRATION'));assert.ok(html.includes('not a calculated distribution'));
  for(const id of ['mae','coverage','width'])assert.match(html,new RegExp('id="'+id+'">—<'));
  const app=start();assert.equal(app.get('selectedInterval').textContent,'Not measured');assert.equal(app.get('selectedActual').textContent,'Not measured');
});
