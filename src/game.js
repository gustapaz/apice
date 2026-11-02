export const BASE = 4, SLAB = .48, GOAL = 12, LIMIT = 100;
export const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export class Tower {
  constructor(pace='calm',mode='expedition'){
    this.pace=pace==='vivid'?'vivid':'calm';this.kind=mode==='endless'?'endless':'expedition';
    this.mode='ready';this.layers=[{x:0,z:0,w:BASE,d:BASE,y:0,perfect:false}];this.moving=null;
    this.score=0;this.combo=0;this.perfects=0;this.cooldown=0;this.events=[];this.spawn();
  }
  get floors(){return this.layers.length-1;}
  get top(){return this.layers[this.layers.length-1];}
  get fit(){if(!this.moving)return 0;const dim=this.moving.axis==='x'?'w':'d';return clamp(1-Math.abs(this.moving[this.moving.axis]-this.top[this.moving.axis])/this.top[dim],0,1);}
  spawn(){const axis=this.floors%2===0?'x':'z';const sign=this.floors%4<2?-1:1;this.moving={...this.top,y:(this.floors+1)*SLAB,axis,offset:sign*4.7,direction:-sign};this.moving[axis]=this.top[axis]+this.moving.offset;}
  start(){if(this.mode==='ready')this.mode='playing';}
  pause(){if(this.mode==='playing')this.mode='paused';}
  resume(){if(this.mode==='paused')this.mode='playing';}
  step(dt){
    if(this.mode!=='playing')return;dt=clamp(Number.isFinite(dt)?dt:0,0,.05);this.cooldown=Math.max(0,this.cooldown-dt);
    if(this.cooldown>0)return;
    const speed=(this.pace==='calm'?.82:1.65)+Math.min(this.floors,40)*(this.pace==='calm'?.025:.04);
    this.moving.offset+=this.moving.direction*speed*dt;
    if(this.moving.offset>4.7){this.moving.offset=9.4-this.moving.offset;this.moving.direction=-1;}
    if(this.moving.offset< -4.7){this.moving.offset=-9.4-this.moving.offset;this.moving.direction=1;}
    this.moving[this.moving.axis]=this.top[this.moving.axis]+this.moving.offset;
  }
  drop(){
    if(this.mode!=='playing'||this.cooldown>0)return null;
    const slab=this.moving,top=this.top,axis=slab.axis,dim=axis==='x'?'w':'d';
    const offset=slab[axis]-top[axis],overlap=top[dim]-Math.abs(offset);
    if(overlap<=.02){this.mode='lost';this.combo=0;const event={kind:'miss',slab:{...slab}};this.events.push(event);return event;}
    const perfect=Math.abs(offset)<=.12;
    const next={x:top.x,z:top.z,w:top.w,d:top.d,y:slab.y,perfect};let offcut=null;
    if(perfect){this.combo++;this.perfects++;this.score+=200+Math.min(this.combo,10)*25;}
    else{
      next[dim]=overlap;next[axis]=top[axis]+offset/2;this.combo=0;this.score+=Math.round(overlap/top[dim]*100);
      offcut={...slab,[dim]:Math.abs(offset),[axis]:slab[axis]+Math.sign(offset)*overlap/2};
    }
    const recovery=perfect&&this.combo%3===0;
    if(recovery){next.w=Math.min(BASE,next.w+.18);next.d=Math.min(BASE,next.d+.18);}
    this.layers.push(next);this.cooldown=.38;
    const event={kind:perfect?'perfect':'cut',slab:next,offcut,recovery};this.events.push(event);
    if(this.floors>=(this.kind==='expedition'?GOAL:LIMIT)){this.mode='won';this.moving=null;}
    else this.spawn();
    return event;
  }
}
export function readSave(raw){
  const base={version:1,muted:true,reduced:false,best:{calm:0,vivid:0},wins:0};
  try{const v=JSON.parse(raw||'null');if(v?.version!==1)return base;
    const valid=n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000;
    return {...base,muted:typeof v.muted==='boolean'?v.muted:true,reduced:typeof v.reduced==='boolean'?v.reduced:false,best:{calm:valid(v.best?.calm)?v.best.calm:0,vivid:valid(v.best?.vivid)?v.best.vivid:0},wins:valid(v.wins)?v.wins:0};
  }catch{return base;}
}
export function record(save,game){if(!['won','lost'].includes(game.mode))return save;return {...save,best:{...save.best,[game.pace]:Math.max(save.best[game.pace],game.score)},wins:save.wins+(game.mode==='won'?1:0)};}
export function bindLifecycle(win,doc,pause){const blur=()=>pause(),hidden=()=>{if(doc.hidden)pause();};win.addEventListener('blur',blur);doc.addEventListener('visibilitychange',hidden);return()=>{win.removeEventListener('blur',blur);doc.removeEventListener('visibilitychange',hidden);};}
