import { randomFromSeed } from './random.js';
import { validateScenario } from './validate.js';
import { levelFor, groundHeight, blocked, compareIds } from './levels.js';

export const TICK_RATE=60, DT=1/60, ISLAND_RADIUS=40;
export const DEFAULT_INPUT=Object.freeze({move:[0,0],cam_yaw_deg:0,jump:false,interact:false,pulse:false,dash:false,pause:false});
export const distanceXZ=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const within=(a,b,r)=>distanceXZ(a,b)<=r+1e-9;
const round=(x)=>{const n=Math.round(x*1000)/1000;return Object.is(n,-0)?0:n;};
const pos=(p)=>p.map(round);
const direction=(from,to)=>{const dx=to[0]-from[0],dz=to[2]-from[2],d=Math.hypot(dx,dz);return d<1e-9?[1,0]:[dx/d,dz/d];};
const dec=(x)=>Math.max(0,x-1);

export class Game {
  constructor({seed=1,night=1,tuning,scenario={}}){
    if(!tuning) throw new Error('Game requires contract tuning');
    validateScenario(scenario,tuning,night);
    this.tuning=structuredClone(tuning);this.level=levelFor(night);this.night=night;
    this.random=randomFromSeed(seed);this.tick=0;this.simTick=0;this.state='playing';this.score=0;
    this.duration=scenario.time_left_s??tuning[`night${night}_duration_s`];this.timeLeft=this.duration;
    const p=scenario.player??{};
    this.player={pos:[...(p.pos??this.level.spawn)],vel:[...(p.vel??[0,0,0])],carried:p.carried??0,flames:p.flames??tuning.flames,grounded:false,invuln:p.invuln_ticks??0,dashCd:p.dash_cd_ticks??0,pulseCd:p.pulse_cd_ticks??0,charm:p.charm_ticks??0};
    this.player.grounded=Math.abs(this.player.pos[1]-groundHeight(this.level,this.player.pos[0],this.player.pos[2]))<1e-7;
    this.facing=[0,1];this.dashDir=[0,1];this.dashTicks=0;this.launch=null;this.padLock=0;this.respawnTicks=0;
    this.input=structuredClone(DEFAULT_INPUT);this.events=[];
    this.windEnabled=scenario.wind_enabled!==false;this.wind={active:false,dir_deg:0,warning:false};
    this.randomMotes=scenario.random_motes!==false;this.randomShades=scenario.random_shades!==false;this.randomDrifters=scenario.random_drifters!==false;
    this.lanterns=this.level.lanterns.map((p,i)=>({id:`L${i+1}`,pos:[...p],deposited:0,lit:false}));
    for(const override of scenario.lanterns??[]){const lamp=this.lanterns.find(l=>l.id===override.id);Object.assign(lamp,structuredClone(override));if(lamp.lit)lamp.deposited=tuning.lantern_cost;else if(lamp.deposited>=tuning.lantern_cost)lamp.lit=true;}
    this.nextMoteId=1;this.nextShadeId=1;this.nextDrifterId=1;
    const initial=scenario.motes??(this.randomMotes?this.shuffled(this.level.motePoints).slice(0,20):[]);
    this.motes=initial.map(m=>this.makeMote(Array.isArray(m)?{pos:m}:m));
    this.shades=(scenario.shades??[]).map(s=>this.makeShade(s));
    this.drifters=(scenario.drifters??[]).map(d=>this.makeDrifter(d));
    this.charms=structuredClone(scenario.charms??this.level.charms).map(c=>({id:c.id,pos:[...(c.pos??this.level.charms.find(x=>x.id===c.id)?.pos??[0,0,0])],available:c.available??true,respawn:c.respawn_ticks??Math.round((c.respawn_s??0)*60)}));
  }
  shuffled(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  makeMote(m){const id=m.id??`M${this.nextMoteId++}`;const n=/^M(\d+)$/.exec(id);if(n)this.nextMoteId=Math.max(this.nextMoteId,Number(n[1])+1);return {id,pos:[...m.pos],kind:m.kind??'random',ttl:m.kind==='dropped'?Math.round((m.ttl_s??8)*60):null,born:-1};}
  makeShade(s){const id=s.id??`S${this.nextShadeId++}`;const n=/^S(\d+)$/.exec(id);if(n)this.nextShadeId=Math.max(this.nextShadeId,Number(n[1])+1);return {id,pos:[...s.pos],state:s.state??'chase',stateTicks:s.state_ticks_left??0,pushTicks:0,pushDir:[1,0],recoilDir:[1,0],wanderAngle:this.random()*Math.PI*2,autoHeight:s.autoHeight??false,born:s.born??-1};}
  makeDrifter(d){const id=d.id??`D${this.nextDrifterId++}`;const n=/^D(\d+)$/.exec(id);if(n)this.nextDrifterId=Math.max(this.nextDrifterId,Number(n[1])+1);return {id,pos:[...d.pos],state:d.state??'idle',stolen:d.stolen??0,stateTicks:d.state_ticks_left??(d.state==='flee'?240:0),hasStolen:(d.stolen??0)>0,angle:this.random()*Math.PI*2,born:d.born??-1};}
  get invulnUntil(){return this.tick+this.player.invuln;}
  get pulseReadyAt(){return this.tick+this.player.pulseCd;}
  event(name,data={}){this.events.push({type:'event',tick:this.tick,name,data});}
  step(patch={}){
    if(this.state==='won'||this.state==='lost')return [];
    const before=this.input;this.input={...before,...patch};this.events=[];this.tick++;
    if(this.input.pause&&!before.pause){this.state=this.state==='paused'?'playing':'paused';this.event(this.state==='paused'?'paused':'resumed');if(this.state==='paused')return this.events;}
    if(this.state==='paused')return this.events;
    this.simTick++;
    if(this.simTick===1)this.event('night_start',{night:this.night});
    this.advanceCounters();
    this.updateWind();
    this.movePlayer(before);
    if(!this.respawnTicks){this.pickup();if(this.input.interact&&!before.interact)this.deposit();}
    this.updateSafety();
    if(!this.respawnTicks&&this.input.pulse&&!before.pulse)this.pulse();
    this.moveShades();this.moveDrifters();
    if(!this.respawnTicks){this.drifterContacts();this.shadeContacts();}
    this.spawnScheduled();
    if(this.player.flames<=0)this.finish('lost','no_flames');
    else if(this.lanterns.every(l=>l.lit))this.finish('won','all_lit');
    else if(this.timeLeft<=0)this.finish('lost','dawn');
    return this.events;
  }
  advanceCounters(){
    this.timeLeft=Math.max(0,this.duration-this.simTick/60);
    for(const k of ['invuln','dashCd','pulseCd','charm'])this.player[k]=dec(this.player[k]);
    this.padLock=dec(this.padLock);
    for(const s of this.shades){s.stateExpired=s.stateTicks===1;s.stateTicks=dec(s.stateTicks);}
    for(const d of this.drifters)if(d.state==='flee')d.stateTicks=dec(d.stateTicks);
    for(const m of this.motes)if(m.ttl!==null)m.ttl=dec(m.ttl);
    this.motes=this.motes.filter(m=>m.ttl===null||m.ttl>0);
    for(const c of this.charms)if(!c.available){c.respawn=dec(c.respawn);if(c.respawn===0)c.available=true;}
    if(this.respawnTicks){this.respawnTicks--;if(this.respawnTicks===0&&this.player.flames>0){this.player.pos=[...this.level.spawn];this.player.vel=[0,0,0];this.player.grounded=true;this.player.invuln=90;this.launch=null;this.dashTicks=0;}}
  }
  updateWind(){
    if(this.night!==3||!this.windEnabled){this.wind.active=false;this.wind.warning=false;return;}
    const cycle=this.simTick%1800;
    if(cycle===1680)this.wind.dir_deg=this.random()*360;
    this.wind.warning=cycle>=1680;
    this.wind.active=this.simTick>=1800&&cycle<300;
  }
  movePlayer(before){
    const p=this.player,t=this.tuning;if(this.respawnTicks||p.flames<=0){p.vel=[0,0,0];return;}
    let [x,z]=this.input.move;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
    const a=this.input.cam_yaw_deg*Math.PI/180;let vx=x*Math.cos(a)+z*Math.sin(a),vz=-x*Math.sin(a)+z*Math.cos(a);
    const moving=Math.hypot(vx,vz)>1e-8;
    if(moving){const n=Math.hypot(vx,vz);this.facing=[vx/n,vz/n];}
    if(this.input.jump&&!before.jump&&p.grounded){p.vel[1]=t.jump_speed;p.grounded=false;}
    if(this.input.dash&&!before.dash&&!this.dashTicks&&(p.dashCd===0||p.charm>0)){
      this.dashTicks=Math.round(t.dash_duration_s*60);this.dashDir=[...this.facing];this.dashSavedVy=p.vel[1];this.dashFrozen=!p.grounded;p.dashCd=p.charm>0?0:Math.round(t.dash_cooldown_s*60);this.event('dash');
    }
    const dashing=this.dashTicks>0,wasGrounded=p.grounded;
    if(dashing){vx=this.dashDir[0]*t.dash_speed;vz=this.dashDir[1]*t.dash_speed;}
    else if(this.launch&&!p.grounded){[vx,vz]=this.launch;}
    else{const speed=p.charm>0?7.2:t.player_speed;vx*=speed;vz*=speed;}
    if(this.wind.active){const w=this.wind.dir_deg*Math.PI/180;vx+=Math.cos(w)*2;vz+=Math.sin(w)*2;}
    if(!dashing&&this.dashFrozen){p.vel[1]=this.dashSavedVy;this.dashFrozen=false;}
    if(dashing&&this.dashFrozen)p.vel[1]=0;
    if(!dashing)p.vel[1]+=t.gravity*DT;
    const old=[...p.pos],nextY=p.pos[1]+(dashing&&!wasGrounded?0:p.vel[1]*DT);
    let nx=p.pos[0]+vx*DT,nz=p.pos[2]+vz*DT;
    if(blocked(this.level,nx,nz,Math.max(old[1],nextY))){
      if(!blocked(this.level,nx,old[2],Math.max(old[1],nextY)))nz=old[2];
      else if(!blocked(this.level,old[0],nz,Math.max(old[1],nextY)))nx=old[0];
      else{nx=old[0];nz=old[2];}
    }
    p.pos=[nx,nextY,nz];const floor=groundHeight(this.level,nx,nz);
    if(floor!==-Infinity&&nextY<=floor+1e-9&&old[1]>=floor-.24&&p.vel[1]<=0){p.pos[1]=floor;p.vel[1]=0;p.grounded=true;this.launch=null;}else p.grounded=false;
    p.vel[0]=(p.pos[0]-old[0])/DT;p.vel[2]=(p.pos[2]-old[2])/DT;
    if(dashing){this.dashTicks--;if(!wasGrounded)p.pos[1]=old[1];}
    if(p.pos[1]<-10){
      const lost=p.carried;p.carried=0;p.flames=Math.max(0,p.flames-1);p.vel=[0,0,0];this.respawnTicks=60;this.dashTicks=0;this.launch=null;
      this.event('player_hit',{by:'fall',flames:p.flames,dropped:0,lost});return;
    }
    if(p.grounded&&!this.padLock){const pad=this.level.pads.find(q=>within(p.pos,q.pos,1)&&Math.abs(p.pos[1]-q.pos[1])<.2);if(pad){const dir=direction(pad.pos,pad.target);this.launch=dir.map(v=>v*pad.horizontal);p.vel[0]=this.launch[0];p.vel[2]=this.launch[1];p.vel[1]=pad.vertical;p.grounded=false;this.padLock=45;}}
  }
  pickup(){
    const p=this.player,t=this.tuning;
    this.motes=this.motes.filter(m=>{
      if(m.born>=this.simTick||p.carried>=t.carry_capacity||!within(p.pos,m.pos,t.pickup_radius)||Math.abs(p.pos[1]-m.pos[1])>1.5+1e-9)return true;
      p.carried++;this.event('mote_picked',{carried:p.carried});return false;
    });
    for(const c of this.charms)if(c.available&&within(p.pos,c.pos,t.pickup_radius)&&Math.abs(p.pos[1]-c.pos[1])<=1.5+1e-9){c.available=false;c.respawn=2700;p.charm=600;this.event('charm_picked',{charm_id:c.id,charm_ticks:600});}
  }
  deposit(){
    const p=this.player,t=this.tuning;
    const lamp=this.lanterns.filter(l=>!l.lit&&within(p.pos,l.pos,t.interact_radius)).sort((a,b)=>distanceXZ(a.pos,p.pos)-distanceXZ(b.pos,p.pos)||compareIds(a,b))[0];
    if(!lamp||p.carried<=0)return;
    const amount=Math.min(p.carried,t.lantern_cost-lamp.deposited);p.carried-=amount;lamp.deposited+=amount;this.score+=amount*t.score.per_mote;
    this.event('deposit',{lantern_id:lamp.id,amount,deposited:lamp.deposited});
    if(lamp.deposited===t.lantern_cost){lamp.lit=true;this.score+=t.score.per_lantern;this.event('lantern_lit',{lantern_id:lamp.id});}
  }
  safe(shade){
    for(const l of this.lanterns){if(!l.lit)continue;const d=distanceXZ(shade.pos,l.pos);if(d<this.tuning.safe_radius){const dir=direction(l.pos,shade.pos);shade.pos[0]=l.pos[0]+dir[0]*this.tuning.safe_radius;shade.pos[2]=l.pos[2]+dir[1]*this.tuning.safe_radius;}}
  }
  updateSafety(){for(const s of this.shades)this.safe(s);}
  pulse(){
    const p=this.player,t=this.tuning;if(p.carried<t.pulse_cost||p.pulseCd>0)return;
    p.carried-=t.pulse_cost;p.pulseCd=Math.round(t.pulse_cooldown_s*60);const ids=[];
    const hits=q=>Math.hypot(q.pos[0]-p.pos[0],q.pos[1]-(p.pos[1]+.8),q.pos[2]-p.pos[2])<=t.pulse_radius+1e-9;
    for(const s of this.shades){if(!hits(s)||s.born>=this.simTick)continue;s.state='stunned';s.stateTicks=120;s.pushTicks=15;s.pushDir=direction(p.pos,s.pos);ids.push(s.id);this.score+=t.score.per_stun;}
    for(const d of this.drifters){if(d.state==='removed'||d.born>=this.simTick||!hits(d))continue;
      if(d.state==='chase'){d.state='flee';d.stateTicks=240;}
      else if(d.state==='flee'&&d.stolen>0){const amount=d.stolen;this.dropMotes(amount,d.pos,false);d.stolen=0;d.stateTicks=120;this.event('drifter_drop',{drifter_id:d.id,amount});}
    }
    this.event('pulse',{stunned_ids:ids});
  }
  translateShade(s,dx,dz){
    const x=s.pos[0]+dx,z=s.pos[2]+dz,y=s.autoHeight?s.pos[1]-.8:s.pos[1];
    if(!blocked(this.level,x,z,y)){s.pos[0]=x;s.pos[2]=z;if(s.autoHeight){const h=groundHeight(this.level,x,z);if(h!==-Infinity)s.pos[1]=h+.8;}}
    this.safe(s);
  }
  moveShades(){
    for(const s of this.shades){
      if(s.born>=this.simTick)continue;
      if(s.state==='stunned'&&s.stateTicks>0){if(s.pushTicks>0){const n=this.tuning.pulse_push_m/15;this.translateShade(s,s.pushDir[0]*n,s.pushDir[1]*n);s.pushTicks--;}continue;}
      if(s.state==='recoil'&&(s.stateTicks>0||s.stateExpired)){this.translateShade(s,s.recoilDir[0]*2/60,s.recoilDir[1]*2/60);if(s.stateTicks===0)s.state='wander';continue;}
      if(s.state==='spawning'&&s.stateTicks>0)continue;
      if(['stunned','recoil','spawning'].includes(s.state))s.state='wander';
      const d=distanceXZ(s.pos,this.player.pos);
      if(s.state==='chase'&&d>18)s.state='wander';else if(s.state==='wander'&&d<=12)s.state='chase';
      let dir,speed;
      if(s.state==='chase'){dir=direction(s.pos,this.player.pos);speed=Math.min(this.night===3?this.tuning.shade_speed_night3:this.tuning.shade_speed,d/DT);}
      else{if(this.simTick%180===0)s.wanderAngle=this.random()*Math.PI*2;dir=[Math.cos(s.wanderAngle),Math.sin(s.wanderAngle)];speed=1.2;}
      this.translateShade(s,dir[0]*speed*DT,dir[1]*speed*DT);
    }
  }
  moveDrifters(){
    const p=this.player;
    for(const d of this.drifters){
      if(d.state==='removed'||d.born>=this.simTick)continue;
      if(d.state==='flee'&&d.stateTicks===0){d.state='removed';continue;}
      if(d.state!=='flee'){const eligible=!d.hasStolen&&p.carried>=5&&within(p.pos,d.pos,15);d.state=eligible?'chase':'idle';}
      const dir=d.state==='chase'?direction(d.pos,p.pos):d.state==='flee'?direction(p.pos,d.pos):[Math.cos(d.angle),Math.sin(d.angle)];
      const speed=d.state==='idle'?2:7;d.pos[0]+=dir[0]*speed*DT;d.pos[2]+=dir[1]*speed*DT;
    }
  }
  drifterContacts(){
    for(const d of [...this.drifters].sort(compareIds))if(d.born<this.simTick&&d.state==='chase'&&!d.hasStolen&&within(d.pos,this.player.pos,1.2)){
      const amount=Math.min(3,this.player.carried);this.player.carried-=amount;d.stolen=amount;d.hasStolen=true;d.state='flee';d.stateTicks=240;
      this.event('drifter_steal',{drifter_id:d.id,amount,carried:this.player.carried});
    }
  }
  shadeContacts(){
    const p=this.player,t=this.tuning;if(p.invuln>0||p.flames<=0)return;
    if(this.lanterns.some(l=>l.lit&&within(p.pos,l.pos,t.safe_radius)))return;
    for(const s of [...this.shades].sort(compareIds)){
      if(s.born>=this.simTick||!['wander','chase'].includes(s.state)||!within(s.pos,p.pos,t.shade_hit_radius)||Math.abs(s.pos[1]-p.pos[1])>1.5+1e-9)continue;
      if(this.lanterns.some(l=>l.lit&&within(s.pos,l.pos,t.safe_radius)))continue;
      const dropped=Math.floor(p.carried/2);p.carried-=dropped;p.flames=Math.max(0,p.flames-1);p.invuln=90;
      this.dropMotes(dropped,p.pos,true);s.state='recoil';s.stateTicks=60;s.recoilDir=direction(p.pos,s.pos);
      this.event('player_hit',{by:'shade',flames:p.flames,dropped});break;
    }
  }
  dropMotes(count,origin,scatter){
    for(let i=0;i<count;i++){
      const a=scatter?this.random()*Math.PI*2:0,r=scatter?1.5+this.random():0;
      const x=origin[0]+Math.cos(a)*r,z=origin[2]+Math.sin(a)*r,h=groundHeight(this.level,x,z);
      const m=this.makeMote({pos:[x,h===-Infinity?origin[1]:h,z],kind:'dropped',ttl_s:8});m.born=this.simTick;this.motes.push(m);
    }
  }
  spawnScheduled(){
    if(this.randomMotes&&this.simTick%240===0&&this.motes.length<30){
      const available=this.level.motePoints.filter(p=>!this.motes.some(m=>within(m.pos,p,.05)&&Math.abs(m.pos[1]-p[1])<.05));
      if(available.length){const m=this.makeMote({pos:available[Math.floor(this.random()*available.length)]});m.born=this.simTick;this.motes.push(m);}
    }
    if(this.randomShades&&this.simTick>=300&&(this.simTick-300)%this.level.shadeInterval===0){
      const count=this.simTick===300?2:1;
      for(let i=0;i<count&&this.shades.length<this.level.shadeMax;i++){
        const available=this.level.shadePoints.filter(p=>distanceXZ(p,this.player.pos)>=15&&!this.shades.some(s=>within(s.pos,p,1))&&!this.lanterns.some(l=>l.lit&&within(p,l.pos,this.tuning.safe_radius)));
        if(!available.length)break;const p=available[Math.floor(this.random()*available.length)];const s=this.makeShade({pos:[p[0],p[1]+.8,p[2]],state:'spawning',state_ticks_left:1,autoHeight:true,born:this.simTick});this.shades.push(s);this.event('shade_spawned',{id:s.id});
      }
    }
    if(this.night>=2&&this.randomDrifters&&this.simTick%1200===0&&this.drifters.filter(d=>d.state!=='removed').length<2){const p=this.level.shadePoints[Math.floor(this.random()*this.level.shadePoints.length)];this.drifters.push(this.makeDrifter({pos:[p[0],p[1]+.8,p[2]],born:this.simTick}));}
  }
  finish(result,reason){this.state=result;if(result==='won')this.score+=Math.floor(this.timeLeft)*this.tuning.score.per_second_left+this.player.flames*this.tuning.score.per_flame_left;this.event('game_over',{result,reason});}
  snapshot(){
    const p=this.player;
    return {type:'snapshot',tick:this.tick,sim_tick:this.simTick,night:this.night,state:this.state,time_left_s:this.timeLeft,score:this.score,wind:{active:this.wind.active,dir_deg:round(this.wind.dir_deg)},player:{pos:pos(p.pos),vel:pos(p.vel),grounded:p.grounded,flames:p.flames,carried:p.carried,invuln:p.invuln>0,invuln_s:p.invuln/60,dash_cd_s:p.dashCd/60,pulse_cd_s:p.pulseCd/60,charm_s:p.charm/60},lanterns:this.lanterns.map(l=>({id:l.id,pos:pos(l.pos),lit:l.lit,deposited:l.deposited})),shades:this.shades.map(s=>({id:s.id,pos:pos(s.pos),state:s.state})),motes_active:this.motes.length,motes:this.motes.map(m=>({id:m.id,pos:pos(m.pos),kind:m.kind,ttl_s:m.ttl===null?null:m.ttl/60})),drifters:this.drifters.filter(d=>d.state!=='removed').map(d=>({id:d.id,pos:pos(d.pos),state:d.state,stolen:d.stolen})),charms:this.charms.map(c=>({id:c.id,pos:pos(c.pos),available:c.available,respawn_s:c.respawn/60}))};
  }
}
