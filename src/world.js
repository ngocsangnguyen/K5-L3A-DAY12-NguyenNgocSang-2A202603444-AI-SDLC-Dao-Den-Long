import * as THREE from 'three';
import {randomFromSeed} from './core/random.js';
import {levelFor,groundHeight} from './core/levels.js';

export const PALETTE={sky:0x0e1430,fog:0x1b2350,grass:0x2f5d50,sand:0xc9b48a,wood:0x6b4a2f,sea:0x12384a,lit:0xffb347,core:0xffe9b0,unlit:0x5b5f6e,mote:0xfff6c2,halo:0xffe58a,shade:0x120a1a,rim:0x7a3cff,stunned:0x3a3450,coat:0xe8e2d0,red:0xc8102e,gold:0xf2c14e,drifter:0x8fa3b8};
const mat=(color,extra={})=>new THREE.MeshLambertMaterial({color,...extra});
const cyl=(r,h,n=12)=>new THREE.CylinderGeometry(r,r,h,n);
const orb=(r,n=10)=>new THREE.SphereGeometry(r,n,n-2);
const dummy=new THREE.Object3D();
export class World{
  constructor(canvas,tuning,level=levelFor(1)){
    this.canvas=canvas;this.tuning=tuning;this.level=level;this.random=randomFromSeed(810+level.night);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1));this.renderer.setClearColor(PALETTE.sky);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2(PALETTE.fog,.005);
    this.camera=new THREE.PerspectiveCamera(47,1,.1,400);this.target=new THREE.Vector3();this.camera.position.set(30,45,60);
    this.ambient=new THREE.HemisphereLight(0xd5e3ff,0x19283a,.15);this.scene.add(this.ambient);
    const moon=new THREE.DirectionalLight(0xc6daf6,1.5);moon.position.set(-20,35,15);this.scene.add(moon);
    this.dynamic=new THREE.Group();this.scene.add(this.dynamic);
    this.glowTexture=this.makeGlow();this.glowMat=new THREE.SpriteMaterial({map:this.glowTexture,color:PALETTE.halo,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending});
    this.moteGeo=orb(.13,7);this.moteMat=new THREE.MeshBasicMaterial({color:PALETTE.mote});
    this.moteBatch=new THREE.InstancedMesh(this.moteGeo,this.moteMat,256);this.moteBatch.frustumCulled=false;this.moteBatch.count=0;this.dynamic.add(this.moteBatch);
    const glowGeo=new THREE.BufferGeometry();glowGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(256*3),3));glowGeo.setDrawRange(0,0);
    this.moteGlows=new THREE.Points(glowGeo,new THREE.PointsMaterial({map:this.glowTexture,color:PALETTE.halo,size:1.2,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));this.moteGlows.frustumCulled=false;this.dynamic.add(this.moteGlows);
    this.lamps=new Map();this.motes=new Map();this.shades=new Map();this.drifters=new Map();this.charms=new Map();this.pulses=[];
    this.windLeaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.3,.14),mat(0xb9aa62,{side:THREE.DoubleSide}),32);this.windLeaves.frustumCulled=false;this.windLeaves.visible=false;this.dynamic.add(this.windLeaves);
    this.buildTerrain();this.buildNature();this.buildClouds();this.player=this.makePlayer();this.dynamic.add(this.player);this.resize();
  }
  mesh(parent,geo,material,p=[0,0,0],scale){const m=new THREE.Mesh(geo,material);m.position.set(...p);if(scale)m.scale.set(...scale);parent.add(m);return m;}
  makeGlow(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff6c2');g.addColorStop(.15,'#ffe58acc');g.addColorStop(.45,'#ffe58a33');g.addColorStop(1,'#ffe58a00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
  glow(parent,p,size,material=this.glowMat){const s=new THREE.Sprite(material);s.position.set(...p);s.scale.setScalar(size);parent.add(s);return s;}
  disk(radius,y,center=[0,0,0],color=PALETTE.grass){const mesh=this.mesh(this.scene,new THREE.CircleGeometry(radius,64),mat(color),[center[0],y,center[2]]);mesh.rotation.x=-Math.PI/2;return mesh;}
  buildTerrain(){
    for(const island of this.level.islands){const [x,y,z]=island.center,r=island.radius;
      this.mesh(this.scene,new THREE.CylinderGeometry(r,r-3,4,48),mat(0x283d50),[x,y-2.3,z]);
      this.mesh(this.scene,new THREE.CylinderGeometry(r+.1,r, .4,64),mat(PALETTE.sand),[x,y-.26,z]);
      this.disk(r-.2,y-.035,island.center);
      this.ringTrail(island.center,r*.6,y+.01);
    }
    const bridge=this.level.bridge;
    if(bridge){const boards=new THREE.InstancedMesh(new THREE.BoxGeometry(.48,.14,4),mat(PALETTE.wood),36);for(let i=0;i<36;i++){dummy.position.set(26+i*.5,-.07,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();boards.setMatrixAt(i,dummy.matrix);}this.scene.add(boards);}
    if(this.level.night===3){
      const ring=new THREE.RingGeometry(12,24,64,1,0,Math.PI);ring.rotateX(-Math.PI/2);ring.rotateY(Math.PI);this.mesh(this.scene,ring,mat(PALETTE.grass,{side:THREE.DoubleSide}),[0,3,0]);
      for(const r of [12,24]){const wall=new THREE.CylinderGeometry(r,r,3,64,1,true,0,Math.PI);const m=this.mesh(this.scene,wall,mat(0x46635b,{side:THREE.DoubleSide}),[0,1.5,0]);m.rotation.y=-Math.PI/2;}
      this.mesh(this.scene,cyl(8,6,48),mat(0x465f59),[0,3,0]);this.disk(8,6.01);
      for(const ramp of this.level.ramps){const a=ramp.angle*Math.PI/180,verts=[];for(const [r,y,side] of [[30,0,-1.5],[30,0,1.5],[24,3,-1.5],[24,3,1.5]])verts.push(r*Math.cos(a)-side*Math.sin(a),y+.02,r*Math.sin(a)+side*Math.cos(a));const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();this.mesh(this.scene,geo,mat(PALETTE.sand,{side:THREE.DoubleSide}));}
      this.mesh(this.scene,cyl(2,8,16),mat(PALETTE.wood),[0,10,0]);this.mesh(this.scene,new THREE.ConeGeometry(3.3,1.8,8),mat(0x476b61),[0,14.9,0]);this.mesh(this.scene,orb(.65),mat(PALETTE.gold),[0,14.1,1.85]);
    }
    for(const pad of this.level.pads){this.mesh(this.scene,cyl(1,.15,24),mat(PALETTE.wood),[pad.pos[0],pad.pos[1]+.02,pad.pos[2]]);const ring=this.mesh(this.scene,new THREE.TorusGeometry(.8,.06,6,28),new THREE.MeshBasicMaterial({color:PALETTE.gold}),[pad.pos[0],pad.pos[1]+.13,pad.pos[2]]);ring.rotation.x=Math.PI/2;this.glow(this.scene,[pad.pos[0],pad.pos[1]+.2,pad.pos[2]],2.5);}
    const water=this.mesh(this.scene,new THREE.PlaneGeometry(700,700),mat(PALETTE.sea),[0,-11,0]);water.rotation.x=-Math.PI/2;
  }
  ringTrail(center,r,y){const ring=new THREE.RingGeometry(r-.55,r+.55,80);ring.rotateX(-Math.PI/2);this.mesh(this.scene,ring,mat(0x718677),[center[0],y,center[2]]);}
  buildNature(){
    const positions=[];for(const island of this.level.islands)for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=island.radius-3;const x=island.center[0]+Math.cos(a)*r,z=island.center[2]+Math.sin(a)*r;positions.push([x,groundHeight(this.level,x,z),z]);}
    const trunks=new THREE.InstancedMesh(cyl(.2,3,6),mat(PALETTE.wood),positions.length),foliage=new THREE.InstancedMesh(new THREE.ConeGeometry(1.6,2.4,7),mat(0x3b7860),positions.length*3);
    positions.forEach((p,i)=>{dummy.position.set(p[0],p[1]+1.4,p[2]);dummy.rotation.set(0,i,0);dummy.scale.set(1,1,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let j=0;j<3;j++){dummy.position.set(p[0],p[1]+2.4+j*.9,p[2]);dummy.scale.setScalar(1-j*.19);dummy.updateMatrix();foliage.setMatrixAt(i*3+j,dummy.matrix);}});this.scene.add(trunks,foliage);
    const count=this.level.islands.length*180,grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.13,.6,3),mat(0x70906a),count),rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.7),mat(0x789483),count/9);
    for(let i=0;i<count;i++){const island=this.level.islands[i%this.level.islands.length],a=this.random()*Math.PI*2,r=8+this.random()*(island.radius-10),x=island.center[0]+Math.cos(a)*r,z=island.center[2]+Math.sin(a)*r;const y=groundHeight(this.level,x,z);dummy.position.set(x,y+.15,z);dummy.rotation.set(0,this.random()*6,0);dummy.scale.setScalar(.5+this.random());dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);if(i<count/9){dummy.scale.set(1,.5,1);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}}
    this.scene.add(grass,rocks);
  }
  buildClouds(){const clouds=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mat(0x49657c,{transparent:true,opacity:.35}),55);for(let i=0;i<55;i++){const a=this.random()*Math.PI*2,r=50+this.random()*75;dummy.position.set(Math.cos(a)*r,-5+this.random()*1.2,Math.sin(a)*r);dummy.rotation.set(0,this.random()*6,0);dummy.scale.set(5+this.random()*8,1+this.random(),3+this.random()*6);dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix);}this.scene.add(clouds);}
  makePlayer(){const g=new THREE.Group(),coat=mat(PALETTE.coat),skin=mat(0xdac3a1),hat=mat(PALETTE.sand);this.mesh(g,new THREE.CylinderGeometry(.28,.4,.75,8),coat,[0,.73,0]);this.mesh(g,orb(.27,12),skin,[0,1.32,0]);this.mesh(g,new THREE.ConeGeometry(.65,.38,24),hat,[0,1.58,0]);const brim=this.mesh(g,new THREE.TorusGeometry(.58,.025,5,28),mat(0x9b875e),[0,1.41,0]);brim.rotation.x=Math.PI/2;this.mesh(g,new THREE.BoxGeometry(.13,.65,.1),mat(PALETTE.red),[0,.94,.32]);this.legs=[];for(const x of [-.16,.16])this.legs.push(this.mesh(g,cyl(.085,.4,6),mat(0x294445),[x,.22,0]));this.mesh(g,cyl(.01,.5,4),mat(PALETTE.wood),[.46,1.2,.05]);this.mesh(g,orb(.17),new THREE.MeshBasicMaterial({color:PALETTE.lit}),[.46,.91,.05],[.8,1.15,.8]);this.glow(g,[.46,1,.05],1.4);const shadow=this.mesh(g,new THREE.CircleGeometry(.55,20),new THREE.MeshBasicMaterial({color:0x081324,transparent:true,opacity:.24,depthWrite:false}),[0,.02,0]);shadow.rotation.x=-Math.PI/2;return g;}
  buildLampFrames(lamps){
    if(this.lampFrames)this.release(this.lampFrames);this.lampFrames=new THREE.Group();this.dynamic.add(this.lampFrames);
    const specs=[{geo:new THREE.CylinderGeometry(1,1.2,.25,10),color:PALETTE.sand,parts:[{p:[0,.1,0],s:[1,1,1]}]},{geo:new THREE.BoxGeometry(1,1,1),color:PALETTE.wood,parts:[{p:[-.65,1.65,0],s:[.13,2.7,.14]},{p:[.65,1.65,0],s:[.13,2.7,.14]},{p:[0,2.92,0],s:[1.75,.13,.2]}]},{geo:new THREE.ConeGeometry(1.45,.5,4),color:0x315c55,parts:[{p:[0,3.18,0],s:[1,1,1],yaw:Math.PI/4}]},{geo:cyl(.19,.08,10),color:PALETTE.gold,parts:[{p:[0,1.62,0],s:[1,1,1]},{p:[0,2.78,0],s:[1,1,1]}]}];
    for(const spec of specs){const mesh=new THREE.InstancedMesh(spec.geo,mat(spec.color),lamps.length*spec.parts.length);let i=0;for(const l of lamps)for(const part of spec.parts){dummy.position.set(l.pos[0]+part.p[0],l.pos[1]+part.p[1],l.pos[2]+part.p[2]);dummy.scale.set(...part.s);dummy.rotation.set(0,part.yaw??0,0);dummy.updateMatrix();mesh.setMatrixAt(i++,dummy.matrix);}this.lampFrames.add(mesh);}
  }
  makeLamp(l){const g=new THREE.Group();g.position.set(...l.pos);this.dynamic.add(g);const paper=mat(PALETTE.unlit,{emissive:PALETTE.lit,emissiveIntensity:0});const body=this.mesh(g,orb(.62,12),paper,[0,2.2,0],[.82,1,.82]);const light=new THREE.PointLight(PALETTE.lit,0,16,2);light.position.y=2.5;g.add(light);const glow=this.glow(g,[0,2.2,0],4,this.glowMat.clone());glow.material.opacity=0;const ring=this.mesh(g,new THREE.RingGeometry(5.95,6,48),new THREE.MeshBasicMaterial({color:PALETTE.gold,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}),[0,.04,0]);ring.rotation.x=-Math.PI/2;return {group:g,paper,body,light,glow,ring};}
  makeShade(){const g=new THREE.Group(),bodyMat=mat(PALETTE.shade,{emissive:PALETTE.rim,emissiveIntensity:.2});this.mesh(g,orb(.65,10),bodyMat,[0,0,0],[1,1.1,1]);for(const x of [-.2,.2])this.mesh(g,orb(.075,6),new THREE.MeshBasicMaterial({color:0xeedcff}),[x,.15,.59]);this.glow(g,[0,0,0],2.3,new THREE.SpriteMaterial({map:this.glowTexture,color:PALETTE.rim,transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending}));this.dynamic.add(g);return {group:g,bodyMat};}
  makeDrifter(){const g=new THREE.Group(),material=mat(PALETTE.drifter,{side:THREE.DoubleSide,emissive:0x223145});for(let i=0;i<4;i++)this.mesh(g,new THREE.PlaneGeometry(.65-i*.1,.7),material,[Math.sin(i*.6)*.3,-i*.4,0]);this.dynamic.add(g);return {group:g};}
  makeCharm(c){const g=new THREE.Group();g.position.set(...c.pos);this.mesh(g,new THREE.BoxGeometry(.45,.7,.06),mat(PALETTE.red),[0,1,0]);const border=this.mesh(g,new THREE.BoxGeometry(.53,.78,.04),mat(PALETTE.gold),[0,1,-.01]);this.glow(g,[0,1,0],1.8);this.dynamic.add(g);return {group:g};}
  release(group){this.dynamic.remove(group);const geos=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry&&o.geometry!==this.moteGeo)geos.add(o.geometry);if(o.material&&o.material!==this.glowMat&&o.material!==this.moteMat)materials.add(o.material);});for(const g of geos)g.dispose();for(const m of materials)m.dispose();}
  remove(map){for(const m of map.values())this.release(m.group);map.clear();}
  reset(game){for(const map of [this.lamps,this.motes,this.shades,this.drifters,this.charms])this.remove(map);for(const p of this.pulses)this.release(p.mesh);this.pulses=[];this.buildLampFrames(game.lanterns);for(const l of game.lanterns)this.lamps.set(l.id,this.makeLamp(l));for(const c of game.charms)this.charms.set(c.id,this.makeCharm(c));this.player.position.set(...game.player.pos);}
  pulse(p){const m=this.mesh(this.dynamic,new THREE.RingGeometry(.95,1,48),new THREE.MeshBasicMaterial({color:PALETTE.lit,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}),[p[0],p[1]+.15,p[2]]);m.rotation.x=-Math.PI/2;this.pulses.push({mesh:m,age:0});}
  sync(map,entities,make,update){const ids=new Set(entities.map(e=>e.id));for(const [id,m]of map)if(!ids.has(id)){this.dynamic.remove(m.group);map.delete(id);}for(const e of entities){if(!map.has(e.id))map.set(e.id,make(e));update(map.get(e.id),e);}}
  update(game,time,dt,{home,yaw,distance,reduceMotion=false}){
    const lit=game.lanterns.filter(l=>l.lit).length;this.ambient.intensity=.15+.55*(lit/game.lanterns.length);
    this.player.position.set(...game.player.pos);this.player.rotation.y=Math.atan2(...game.facing);this.player.visible=game.player.invuln===0||Math.floor(time*12)%2===0||home;
    this.legs.forEach((leg,i)=>leg.rotation.x=!home&&game.state==='playing'&&Math.hypot(game.player.vel[0],game.player.vel[2])>.1?Math.sin(time*13+i*Math.PI)*.5:0);
    for(const l of game.lanterns){const m=this.lamps.get(l.id);m.paper.color.setHex(l.lit?PALETTE.lit:PALETTE.unlit);m.paper.emissive.setHex(PALETTE.core);m.paper.emissiveIntensity=l.lit?.9:0;m.light.intensity=l.lit?26:0;m.glow.material.opacity=l.lit?.6:0;m.ring.material.opacity=l.lit?.3:0;}
    const glowPositions=this.moteGlows.geometry.attributes.position;
    this.moteBatch.count=Math.min(game.motes.length,256);this.moteGlows.geometry.setDrawRange(0,this.moteBatch.count);
    for(let i=0;i<this.moteBatch.count;i++){const e=game.motes[i],y=e.pos[1]+.55+(reduceMotion?0:Math.sin(time*2+i*1.78)*.12);dummy.position.set(e.pos[0],y,e.pos[2]);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();this.moteBatch.setMatrixAt(i,dummy.matrix);glowPositions.setXYZ(i,e.pos[0],y,e.pos[2]);}this.moteBatch.instanceMatrix.needsUpdate=true;glowPositions.needsUpdate=true;
    this.sync(this.shades,game.shades,()=>this.makeShade(),(m,s)=>{m.group.position.set(...s.pos);m.group.position.y+=reduceMotion?0:Math.sin(time*2+s.pos[0])*.08;m.group.rotation.y=Math.atan2(game.player.pos[0]-s.pos[0],game.player.pos[2]-s.pos[2]);m.bodyMat.color.setHex(s.state==='stunned'?PALETTE.stunned:PALETTE.shade);m.group.scale.setScalar(s.state==='spawning'?.5:1);});
    this.sync(this.drifters,game.drifters.filter(d=>d.state!=='removed'),()=>this.makeDrifter(),(m,d)=>{m.group.position.set(d.pos[0],d.pos[1]+.5,d.pos[2]);m.group.rotation.y=time*.8;});
    for(const c of game.charms){const m=this.charms.get(c.id);if(m){m.group.visible=c.available;m.group.rotation.y=time*.7;}}
    this.windLeaves.visible=game.wind.warning||game.wind.active;
    if(this.windLeaves.visible){const a=game.wind.dir_deg*Math.PI/180;for(let i=0;i<32;i++){const travel=((time*3+i*1.7)%20)-10,side=Math.sin(i*7.1)*8;dummy.position.set(game.player.pos[0]+Math.cos(a)*travel-Math.sin(a)*side,game.player.pos[1]+1.5+(i%7)*.5,game.player.pos[2]+Math.sin(a)*travel+Math.cos(a)*side);dummy.rotation.set(time+i,i*.7,time*.8);dummy.scale.set(1,1,1);dummy.updateMatrix();this.windLeaves.setMatrixAt(i,dummy.matrix);}this.windLeaves.instanceMatrix.needsUpdate=true;}
    for(let i=this.pulses.length-1;i>=0;i--){const p=this.pulses[i];p.age+=dt;p.mesh.scale.setScalar(.2+p.age*7);p.mesh.material.opacity=Math.max(0,.8-p.age);if(p.age>.8){this.dynamic.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();this.pulses.splice(i,1);}}
    let target,position;if(home){const center=this.level.night===2?25:0;target=new THREE.Vector3(center-18,0,8);position=target.clone().add(new THREE.Vector3(65,70,85));}else{target=new THREE.Vector3(game.player.pos[0],Math.max(game.player.pos[1],-4)+.7,game.player.pos[2]);position=target.clone().add(new THREE.Vector3(Math.sin(yaw)*distance,distance*.6,Math.cos(yaw)*distance));}
    const smooth=1-Math.exp(-dt*5);this.target.lerp(target,smooth);this.camera.position.lerp(position,smooth);this.camera.lookAt(this.target);this.renderer.render(this.scene,this.camera);
  }
  project(p){const v=new THREE.Vector3(...p).project(this.camera);return {x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<.95&&Math.abs(v.y)<.95};}
  resize(){this.renderer.setSize(innerWidth,innerHeight,false);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  dispose(){const geos=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geos)g.dispose();for(const m of materials)m.dispose();this.glowTexture.dispose();this.renderer.dispose();}
}
