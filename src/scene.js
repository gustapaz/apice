import * as THREE from 'three';
import { SLAB } from './game.js';

const palette = [0xe98b5a,0xdb795b,0xc66d69,0xaf637b,0x965c88,0x7a638f,0x716d9d,0x8c80ac,0xa68db5,0xc59cba,0xe1b2c4,0xecc7c6];
export function createScene(host,onLost){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xc9d5ef,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xc9d5ef,25,65);
  const camera=new THREE.OrthographicCamera(-10,10,6,-6,.1,100);
  const ambient=new THREE.HemisphereLight(0xfff7ee,0x8a9bbd,2.7);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xfff1dd,3.2);sun.position.set(-6,16,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-10;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
  const box=new THREE.BoxGeometry(1,1,1);
  const materials=palette.map(color=>new THREE.MeshStandardMaterial({color,roughness:.75,metalness:.03}));
  const white=new THREE.MeshStandardMaterial({color:0xe8e8ed,roughness:1});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(5.4,5.1,.35,80),white);base.position.y=-.55;base.receiveShadow=true;scene.add(base);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.ShadowMaterial({opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-.76;ground.receiveShadow=true;scene.add(ground);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.012,6,80),new THREE.MeshBasicMaterial({color:0xfff1d1,transparent:true,opacity:0}));ring.rotation.x=-Math.PI/2;scene.add(ring);let ringLife=0;
  const tower=new THREE.Group();scene.add(tower);let current=null,moving=null,targetY=1,renderY=1,dirty=true;const slabs=[],offcuts=[];
  const sculpture=new THREE.Group();scene.add(sculpture);
  for(let i=0;i<3;i++){
    const pebble=new THREE.Mesh(new THREE.DodecahedronGeometry(.22+i*.06,0),new THREE.MeshStandardMaterial({color:[0x9daecb,0xc6b1ca,0xedb68c][i],roughness:.8}));
    pebble.position.set(3.8+i*.24,-.2,-2.7+i*.3);pebble.rotation.set(i,0,i*.8);sculpture.add(pebble);
  }
  function mesh(slab,index){const result=new THREE.Mesh(box,materials[index%materials.length]);result.castShadow=true;result.receiveShadow=true;place(result,slab);return result;}
  function place(object,slab){object.position.set(slab.x,slab.y,slab.z);object.scale.set(Math.max(.001,slab.w),SLAB,Math.max(.001,slab.d));}
  function clear(){tower.clear();slabs.length=0;for(const cut of offcuts)scene.remove(cut.mesh);offcuts.length=0;moving=null;ringLife=0;ring.material.opacity=0;renderY=1;}
  function sync(model){
    if(current!==model){current=model;clear();dirty=true;}
    while(slabs.length<model.layers.length){const i=slabs.length;const block=mesh(model.layers[i],i);tower.add(block);slabs.push(block);dirty=true;}
    if(model.moving&&model.mode!=='lost'){
      if(!moving){moving=mesh(model.moving,model.layers.length);tower.add(moving);}
      moving.visible=true;place(moving,model.moving);moving.material=materials[model.layers.length%materials.length];
    }else if(moving)moving.visible=false;
    targetY=Math.max(1,model.top.y-1.1);
  }
  function event(event,index,reduced){
    dirty=true;
    const falling=event.kind==='miss'?event.slab:event.offcut;
    if(falling&&!reduced){
      const cut=mesh(falling,index);scene.add(cut);offcuts.push({mesh:cut,life:0,velocity:-1,spin:index%2?1:-1});
      if(offcuts.length>6)scene.remove(offcuts.shift().mesh);
    }
    if(event.kind==='perfect'){ring.position.set(event.slab.x,event.slab.y+.25,event.slab.z);ring.scale.set(event.slab.w*.67,event.slab.d*.67,1);ringLife=reduced?.1:.6;}
  }
  function update(dt,reduced){
    if(!dirty&&current?.mode!=='playing'&&!offcuts.length&&!ringLife&&Math.abs(renderY-targetY)<.001)return;
    dirty=false;
    renderY=reduced?targetY:THREE.MathUtils.damp(renderY,targetY,3,dt);
    camera.position.set(10,renderY+10,12);camera.lookAt(0,renderY,0);
    sun.target.position.set(0,renderY,0);sun.position.y=renderY+16;
    for(let i=offcuts.length-1;i>=0;i--){const cut=offcuts[i];cut.life+=dt;cut.velocity-=11*dt;cut.mesh.position.y+=cut.velocity*dt;cut.mesh.rotation.z+=cut.spin*dt*.8;cut.mesh.rotation.x+=dt*.45;if(cut.life>2.3){scene.remove(cut.mesh);offcuts.splice(i,1);}}
    ringLife=Math.max(0,ringLife-dt);ring.material.opacity=Math.min(1,ringLife*1.5);
    renderer.render(scene,camera);
  }
  function resize(){dirty=true;const rect=host.getBoundingClientRect();const aspect=rect.width/Math.max(rect.height,1);const d=aspect<.7?8.3:6.2;camera.left=-d*aspect;camera.right=d*aspect;camera.top=d;camera.bottom=-d;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const lost=e=>{e.preventDefault();onLost();};renderer.domElement.addEventListener('webglcontextlost',lost);
  return {sync,event,update,dispose(){observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',lost);clear();
    const geometries=new Set(),mats=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material){for(const m of Array.isArray(object.material)?object.material:[object.material])mats.add(m);}});
    geometries.add(box);for(const m of materials)mats.add(m);for(const g of geometries)g.dispose();for(const m of mats)m.dispose();sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();scene.clear();
  }};
}
