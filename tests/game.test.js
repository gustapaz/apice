import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tower, BASE, readSave, record, bindLifecycle } from '../src/game.js';
const settle=g=>{for(let i=0;i<50;i++)g.step(1/120);};
function place(g,offset=0){settle(g);g.moving[g.moving.axis]=g.top[g.moving.axis]+offset;return g.drop();}
test('ready/start/reset invariants and default option validation',()=>{
  const g=new Tower('bad','bad');assert.equal(g.mode,'ready');assert.equal(g.pace,'calm');assert.equal(g.kind,'expedition');assert.equal(g.floors,0);assert.equal(g.drop(),null);g.start();assert.equal(g.mode,'playing');assert.equal(g.moving.axis,'x');
});
test('motion is time based and reproducible at different frame increments',()=>{
  const a=new Tower(),b=new Tower();a.start();b.start();for(let i=0;i<120;i++)a.step(1/120);for(let i=0;i<30;i++)b.step(1/30);assert.ok(Math.abs(a.moving.offset-b.moving.offset)<1e-10);
});
test('reflection stays in bounds and invalid/negative/large deltas are bounded',()=>{
  const g=new Tower('vivid');g.start();for(let i=0;i<10000;i++){g.step(1/120);assert.ok(Math.abs(g.moving.offset)<=4.700001);}const x=g.moving.offset;g.step(NaN);g.step(-9);assert.equal(g.moving.offset,x);g.step(99);assert.ok(Math.abs(g.moving.offset-x)<.09);
});
test('X cut conserves width and positions both intersection and offcut',()=>{
  const g=new Tower();g.start();g.moving.x=1;const event=g.drop();assert.equal(event.kind,'cut');assert.equal(g.top.w,3);assert.equal(g.top.x,.5);assert.equal(event.offcut.w,1);assert.equal(event.offcut.x,2.5);assert.equal(g.top.w+event.offcut.w,BASE);assert.equal(g.score,75);
});
test('Z cut uses depth and retains previous X center',()=>{
  const g=new Tower();g.start();g.moving.x=1;g.drop();assert.equal(g.moving.axis,'z');const event=place(g,-.7);assert.equal(event.kind,'cut');assert.ok(Math.abs(g.top.d-3.3)<1e-9);assert.equal(g.top.x,.5);assert.equal(g.top.z,-.35);assert.ok(Math.abs(event.offcut.z+2.35)<1e-9);
});
test('no overlap loses without adding floors; a second drop cannot score',()=>{
  const g=new Tower();g.start();g.moving.x=4.1;assert.equal(g.drop().kind,'miss');assert.equal(g.mode,'lost');assert.equal(g.floors,0);assert.equal(g.score,0);assert.equal(g.drop(),null);
});
test('perfect snap preserves center, increases combo and bounded recovery restores area',()=>{
  const g=new Tower();g.start();g.moving.x=.5;g.drop();const reduced=g.top.w;for(let i=0;i<3;i++)assert.equal(place(g,.05).kind,'perfect');assert.equal(g.combo,3);assert.equal(g.perfects,3);assert.ok(g.top.w>reduced);assert.ok(g.top.w<=BASE&&g.top.d<=BASE);
});
test('an imperfect placement breaks the perfect chain',()=>{
  const g=new Tower();g.start();place(g);place(g);assert.equal(g.combo,2);place(g,.3);assert.equal(g.combo,0);
});
test('settle cooldown rejects rapid duplicate actions',()=>{
  const g=new Tower();g.start();g.moving.x=0;g.drop();const score=g.score;assert.equal(g.drop(),null);assert.equal(g.floors,1);assert.equal(g.score,score);
});
test('expedition completes at 12 actual intersections and result is immutable to drops',()=>{
  const g=new Tower();g.start();for(let i=0;i<12;i++)place(g);assert.equal(g.mode,'won');assert.equal(g.floors,12);assert.equal(g.moving,null);const score=g.score;g.drop();g.step(1/30);assert.equal(g.score,score);assert.equal(g.layers.length,13);
});
test('endless continues after 12 and stops at technical ceiling of 100',()=>{
  const g=new Tower('vivid','endless');g.start();for(let i=0;i<12;i++)place(g);assert.equal(g.mode,'playing');for(let i=12;i<100;i++)place(g);assert.equal(g.mode,'won');assert.equal(g.layers.length,101);assert.equal(g.moving,null);
});
test('pause freezes exact moving position until explicit resume',()=>{
  const g=new Tower();g.start();g.step(1/30);g.pause();const offset=g.moving.offset;g.step(1/30);assert.equal(g.moving.offset,offset);assert.equal(g.drop(),null);g.resume();g.step(1/30);assert.notEqual(g.moving.offset,offset);
});
test('new tower cannot inherit previous attempt state or references',()=>{
  const a=new Tower();a.start();place(a,.5);const b=new Tower();assert.equal(b.score,0);assert.equal(b.floors,0);assert.equal(b.combo,0);assert.equal(b.top.w,4);assert.notEqual(a.layers,b.layers);
});
test('save rejects corruption, wrong versions, negative and unsafe scores',()=>{
  for(const raw of [null,'{','null','{"version":2}'])assert.equal(readSave(raw).best.calm,0);
  const v=readSave('{"version":1,"muted":"yes","best":{"calm":-1,"vivid":9999999999999999},"wins":-1}');assert.equal(v.muted,true);assert.deepEqual(v.best,{calm:0,vivid:0});assert.equal(v.wins,0);
});
test('records separate pace, only accept results and never lower a best',()=>{
  const save=readSave(null),g=new Tower();assert.equal(record(save,g),save);g.start();place(g);g.cooldown=0;g.moving[g.moving.axis]+=10;g.drop();const next=record(save,g);assert.ok(next.best.calm>0);assert.equal(next.best.vivid,0);assert.equal(record({...next,best:{calm:99999,vivid:0}},g).best.calm,99999);
});
test('blur/visibility pause, visibility restoration does not resume, cleanup detaches',()=>{
  const win=new EventTarget(),doc=Object.assign(new EventTarget(),{hidden:false}),g=new Tower();g.start();const cleanup=bindLifecycle(win,doc,()=>g.pause());win.dispatchEvent(new Event('blur'));assert.equal(g.mode,'paused');g.resume();doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(g.mode,'paused');doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(g.mode,'paused');cleanup();g.resume();win.dispatchEvent(new Event('blur'));assert.equal(g.mode,'playing');
});
