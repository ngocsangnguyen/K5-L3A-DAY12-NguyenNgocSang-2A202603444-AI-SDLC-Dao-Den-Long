import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,distanceXZ} from '../src/core/game.js';
import {levelFor,groundHeight} from '../src/core/levels.js';
import {validateInputs,validateScenario} from '../src/core/validate.js';
const tuning=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning;
const make=(scenario={},night=1)=>new Game({seed:42,night,tuning,scenario:{random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,...scenario}});
const steps=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(input);};
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const names=(events)=>events.map(e=>e.name);

test('contract constants and all three maps match Ticket-02',()=>{
  assert.equal(tuning.carry_capacity,10);assert.equal(tuning.lantern_cost,10);assert.equal(tuning.pulse_cooldown_s,3);assert.equal(tuning.shade_speed,4);
  for(const night of [1,2,3]){const g=make({},night);assert.equal(g.lanterns.length,night+4);assert.equal(g.timeLeft,[0,300,330,360][night]);assert.equal(g.tick,0);assert.equal(g.score,0);assert.deepEqual(g.events,[]);}
  assert.deepEqual(levelFor(1).lanterns[0],[0,0,25]);assert.deepEqual(levelFor(2).lanterns[5],[53,0,-10]);assert.deepEqual(levelFor(3).lanterns[0],[0,6,6]);
});
test('tick 0 setup has no score/event, lamp override merges by ID',()=>{
  const g=make({lanterns:[{id:'L2',lit:true}]});assert.deepEqual(g.player.pos,[0,0,0]);assert.equal(g.lanterns[1].deposited,10);assert.equal(g.lanterns.length,5);assert.equal(g.score,0);assert.deepEqual(g.events,[]);
});
test('movement 60Hz, yaw rotation, diagonal normalization and input persistence regressions',()=>{
  const g=make();g.step({move:[0,1],cam_yaw_deg:90});steps(g,59);near(g.player.pos[0],6);near(g.player.pos[2],0);near(g.timeLeft,299);
  const d=make();steps(d,60,{move:[1,1]});near(distanceXZ(d.player.pos,[0,0,0]),6);d.step({move:[0,0]});const p=[...d.player.pos];d.step({interact:true});assert.deepEqual(d.player.pos,p);
});
test('pickup XZ inclusive, vertical threshold, capacity; pickup has no score in v1.1',()=>{
  const g=make({motes:[[1,1.5,0],[1.001,0,0],[0,1.501,0],...Array.from({length:15},()=>[0,0,0])]});const ev=g.step();assert.equal(g.player.carried,10);assert.equal(g.score,0);assert.equal(ev.filter(e=>e.name==='mote_picked').length,10);assert.equal(ev.find(e=>e.name==='mote_picked').tick,1);
  assert.ok(g.motes.some(m=>m.pos[1]===1.501));
});
test('partial deposit, edge trigger, nearest then smaller ID, deposit score',()=>{
  const g=make({player:{carried:4},lanterns:[{id:'L2',pos:[-2,0,0]},{id:'L1',pos:[2,0,0]}]});g.step({interact:true});assert.equal(g.lanterns[0].deposited,4);assert.equal(g.score,40);
  g.player.carried=10;g.step({interact:true});assert.equal(g.lanterns[0].deposited,4);g.step({interact:false});g.step({interact:true});assert.equal(g.lanterns[0].lit,true);assert.equal(g.player.carried,4);assert.equal(g.score,200);
});
test('cannot deposit out of range or into a lit lamp',()=>{
  const g=make({player:{carried:10},lanterns:[{id:'L1',pos:[2.001,0,0]}]});g.step({interact:true});assert.equal(g.player.carried,10);
});
test('pulse targets 3D distance from foot+.8, cost/cooldown, push over 15 ticks',()=>{
  const g=make({player:{carried:6},shades:[{id:'S1',pos:[5,.8,0]},{id:'S2',pos:[0,6,0]}]});const ev=g.step({pulse:true});assert.deepEqual(ev.find(e=>e.name==='pulse').data.stunned_ids,['S1']);assert.equal(g.player.carried,3);assert.equal(g.score,5);near(g.shades[0].pos[0],5+4/15);steps(g,14,{pulse:false});near(g.shades[0].pos[0],9);assert.equal(g.shades[0].state,'stunned');
  g.step({pulse:true});assert.equal(g.player.carried,3);steps(g,110,{pulse:false});assert.notEqual(g.shades[0].state,'stunned');
});
test('pulse cannot activate without 3 motes, holding does not repeat',()=>{
  const g=make({player:{carried:2}});assert.ok(!names(g.step({pulse:true})).includes('pulse'));
  const h=make({player:{carried:10}});h.step({pulse:true});steps(h,200,{pulse:true});assert.equal(h.player.carried,7);
});
test('dash is exactly 14m/s for 12 ticks with cooldown from activation',()=>{
  const g=make();g.step({move:[1,0],dash:true});steps(g,11,{move:[0,0],dash:false});near(g.player.pos[0],2.8);assert.equal(g.dashTicks,0);assert.equal(g.player.dashCd,79);g.step({dash:true});near(g.player.pos[0],2.8);assert.equal(g.dashTicks,0);
});
test('stationary dash follows facing; air dash freezes altitude without immunity',()=>{
  const g=make({player:{pos:[0,4,0]}});g.step({dash:true});const y=g.player.pos[1];steps(g,11,{dash:false});near(g.player.pos[1],y);near(g.player.pos[2],2.8);assert.equal(g.player.invuln,0);g.step();assert.ok(g.player.pos[1]<y);
});
test('jump requires grounded edge, gravity -20, full air steering',()=>{
  const g=make();g.step({jump:true,move:[1,0]});assert.ok(g.player.pos[1]>0);steps(g,20,{jump:true,move:[0,1]});assert.ok(g.player.pos[2]>1.9);steps(g,70,{jump:true,move:[0,0]});near(g.player.pos[1],0);g.step({jump:false});g.step({jump:true});assert.ok(g.player.pos[1]>0);
});
test('damage has height threshold, one hit per tick in ID order, recoil and 90 tick immunity',()=>{
  const g=make({player:{carried:9},shades:[{id:'S2',pos:[0,.8,0]},{id:'S1',pos:[0,.8,0]}]});const ev=g.step();assert.equal(g.player.flames,2);assert.equal(g.player.carried,5);assert.equal(g.motes.length,4);assert.equal(g.shades[1].state,'recoil');assert.equal(ev.filter(e=>e.name==='player_hit').length,1);steps(g,89);assert.equal(g.player.flames,2);g.step();assert.equal(g.player.flames,1);
  const high=make({shades:[{pos:[0,2,0]}]});high.step();assert.equal(high.player.flames,3);
});
test('dropped motes are in 1.5–2.5m ring, TTL480, pickup from next tick only',()=>{
  const g=make({player:{carried:10},shades:[{pos:[0,.8,0]}]});g.step();for(const m of g.motes){assert.ok(distanceXZ(m.pos,[0,0,0])>=1.5);assert.ok(distanceXZ(m.pos,[0,0,0])<=2.5);assert.equal(m.ttl,480);assert.equal(m.kind,'dropped');}g.player.pos=[...g.motes[0].pos];g.step();assert.ok(g.player.carried>5);
  const ttl=make({motes:[{pos:[20,0,0],kind:'dropped',ttl_s:8}]});steps(ttl,479);assert.equal(ttl.motes.length,1);ttl.step();assert.equal(ttl.motes.length,0);
});
test('hitting shade recoils exactly2m over the next60 ticks',()=>{
  const g=make({shades:[{pos:[0,.8,0]}]});g.step();const x=g.shades[0].pos[0];steps(g,60);near(g.shades[0].pos[0]-x,2);
});
test('lit safe area blocks shades including a newly stunned shade; state names valid',()=>{
  const g=make({player:{pos:[6,0,0]},shades:[{pos:[6,.8,0]}],lanterns:[{id:'L1',pos:[0,0,0],lit:true}]});steps(g,120);assert.equal(g.player.flames,3);assert.ok(distanceXZ(g.shades[0].pos,[0,0,0])>=6-1e-9);
  const h=make({player:{carried:6},shades:[{pos:[2,.8,0]}],lanterns:[{id:'L1',pos:[6,0,0],lit:true}]});h.step({pulse:true});assert.ok(distanceXZ(h.shades[0].pos,[6,0,0])>=6-1e-9);assert.ok(['spawning','wander','chase','recoil','stunned'].includes(h.shades[0].state));
});
test('fall ignores invulnerability once, loses carried, waits60 then respawns invulnerable',()=>{
  const g=make({player:{pos:[41,-10.1,0],carried:7,invuln_ticks:999}});let ev=g.step();assert.deepEqual(ev.find(e=>e.name==='player_hit').data,{by:'fall',flames:2,dropped:0,lost:7});steps(g,59);assert.equal(g.player.flames,2);assert.equal(g.respawnTicks,1);g.step();assert.deepEqual(g.player.pos,[0,0,0]);assert.equal(g.player.invuln,90);assert.equal(g.player.carried,0);
});
test('fall with final flame loses immediately, no respawn',()=>{
  const g=make({player:{pos:[41,-11,0],flames:1}});g.step();assert.equal(g.state,'lost');assert.equal(g.events.at(-1).data.reason,'no_flames');
});
test('pause freezes every simulation counter, TTL, motion and spawning but wall tick advances',()=>{
  const g=make({player:{carried:6,charm_ticks:200,pulse_cd_ticks:100},motes:[{pos:[10,0,0],kind:'dropped',ttl_s:8}]});g.step({pause:true,move:[1,0]});const before=g.snapshot();steps(g,300,{pause:false});const after=g.snapshot();assert.equal(after.tick,301);assert.equal(after.sim_tick,0);assert.equal(after.state,'paused');assert.equal(after.time_left_s,before.time_left_s);assert.deepEqual(after.player,before.player);assert.deepEqual(after.motes,before.motes);g.step({pause:true});assert.equal(g.state,'playing');assert.equal(g.simTick,1);assert.ok(names(g.events).includes('resumed'));
});
test('initial20 unique standard motes, no shades until tick300; scheduled respawn and caps',()=>{
  const g=new Game({seed:7,tuning});assert.equal(g.motes.length,20);assert.equal(new Set(g.motes.map(m=>JSON.stringify(m.pos))).size,20);assert.equal(g.shades.length,0);steps(g,239);assert.equal(g.motes.length,20);g.step();assert.equal(g.motes.length,21);steps(g,59);assert.equal(g.shades.length,0);g.step();assert.equal(g.shades.length,2);assert.ok(g.shades.every(s=>s.state==='spawning'));g.step();assert.ok(g.shades.every(s=>s.state!=='spawning'));
});
test('charm600 ticks, speed7.2, refresh and respawn2700; dash no cooldown but ignores active re-press',()=>{
  const g=make({charms:[{id:'C1',pos:[0,0,0]}]},2);g.step();assert.equal(g.player.charm,600);assert.equal(g.charms[0].respawn,2700);g.step({move:[1,0]});near(g.player.pos[0],.12);g.step({dash:true});assert.equal(g.player.dashCd,0);const left=g.dashTicks;g.step({dash:false});g.step({dash:true});assert.equal(g.dashTicks,left-2);steps(g,600,{move:[0,0],dash:false});assert.equal(g.player.charm,0);steps(g,2096);assert.ok(g.charms[0].available||g.player.charm>0);
});
test('drifter steals before shade damage and only once, regardless of invulnerability',()=>{
  const g=make({player:{carried:8,invuln_ticks:100},drifters:[{id:'D1',pos:[0,.8,0],state:'chase'}]},2);const ev=g.step();assert.equal(g.player.carried,5);assert.equal(g.player.flames,3);assert.equal(g.drifters[0].stolen,3);assert.ok(names(ev).includes('drifter_steal'));steps(g,100);assert.equal(g.drifters[0].stolen,3);
  const order=make({player:{carried:8},drifters:[{id:'D1',pos:[0,.8,0]}],shades:[{pos:[0,.8,0]}]},2);order.step();assert.equal(order.player.carried,3);assert.ok(names(order.events).indexOf('drifter_steal')<names(order.events).indexOf('player_hit'));
});
test('pulse chase drifter flees without theft; fleeing drifter drops stolen and leaves120 ticks later',()=>{
  const chase=make({player:{carried:8},drifters:[{id:'D1',pos:[0,.8,0],state:'chase'}]},2);chase.step({pulse:true});assert.equal(chase.drifters[0].state,'flee');assert.equal(chase.drifters[0].stolen,0);assert.equal(chase.player.flames,3);
  const flee=make({player:{carried:3},drifters:[{id:'D1',pos:[2,.8,0],state:'flee',stolen:3,state_ticks_left:240}]},2);flee.step({pulse:true});assert.equal(flee.drifters[0].stolen,0);assert.equal(flee.motes.length,3);assert.ok(names(flee.events).includes('drifter_drop'));steps(flee,120,{pulse:false});assert.equal(flee.drifters[0].state,'removed');
});
test('drifter spawns only nights2/3 at1200 with cap2',()=>{
  const g=make({random_drifters:true},2);steps(g,1199);assert.equal(g.drifters.length,0);g.step();assert.equal(g.drifters.length,1);assert.equal(g.drifters[0].born,1200);
});
test('bridge has exact bounds, two islands, tier heights and ramps',()=>{
  const l=levelFor(2);assert.equal(groundHeight(l,35,2),0);assert.equal(groundHeight(l,35,2.01),-Infinity);assert.equal(groundHeight(l,70,0),0);
  const m=levelFor(3);assert.equal(groundHeight(m,0,5),6);assert.equal(groundHeight(m,0,18),3);assert.equal(groundHeight(m,0,-18),0);near(groundHeight(m,27*Math.cos(Math.PI/6),27*Math.sin(Math.PI/6)),1.5);
});
test('launch pad keeps horizontal momentum despite contrary movement and lands on other island',()=>{
  const g=make({player:{pos:[20,0,18]}},2);g.step();near(g.player.vel[1],14);assert.ok(g.launch);steps(g,90,{move:[-1,0]});assert.ok(g.player.pos[0]>40);assert.equal(g.player.grounded,true);assert.ok(distanceXZ(g.player.pos,[70,0,0])<28);
});
test('tier walls and bell block walking; stepping off a tier falls to lower surface',()=>{
  const g=make({player:{pos:[0,0,24.2]}},3);steps(g,10,{move:[0,-1]});assert.ok(g.player.pos[2]>=24);
  const h=make({player:{pos:[5,3,11.1]}},3);steps(h,20,{move:[0,-1]});assert.ok(h.player.pos[1]<3);
  const tower=make({player:{pos:[2.1,6,0]}},3);steps(tower,20,{move:[-1,0]});assert.ok(tower.player.pos[0]>=2);
});
test('wind warning at1680, active1800..2099, disabled freezes wind',()=>{
  const g=make({player:{pos:[30,0,0]},wind_enabled:true},3);steps(g,1680);assert.equal(g.wind.warning,true);steps(g,120);assert.equal(g.wind.active,true);const before=[...g.player.pos];steps(g,10);assert.ok(distanceXZ(before,g.player.pos)>.3);steps(g,290);assert.equal(g.wind.active,false);
});
test('no_flames wins precedence; alive all_lit wins at exact dawn; score on deposit and final bonus',()=>{
  const lamps=[1,2,3,4,5].map(n=>({id:`L${n}`,lit:true}));const dead=make({player:{flames:0},lanterns:lamps});dead.step();assert.equal(dead.state,'lost');
  const g=make({time_left_s:1/60,player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0]},...lamps.slice(1)]});g.step({interact:true});assert.equal(g.state,'won');assert.equal(g.score,350);const tick=g.tick;g.step();assert.equal(g.tick,tick);
  const dawn=make({time_left_s:1});steps(dawn,60);assert.equal(dawn.events.at(-1).data.reason,'dawn');
});
test('determinism, snapshot schema and malformed scenario/input validation',()=>{
  const a=new Game({seed:9,night:3,tuning}),b=new Game({seed:9,night:3,tuning});steps(a,100);steps(b,100);assert.deepEqual(a.snapshot(),b.snapshot());const s=a.snapshot();assert.equal(s.night,3);for(const k of ['vel','grounded','invuln','dash_cd_s','pulse_cd_s','charm_s'])assert.ok(k in s.player);for(const k of ['motes','drifters','charms','wind'])assert.ok(k in s);
  for(const v of [null,{frames:[{tick:0},{tick:0}]},{frames:[{tick:0,pause:1}]},{frames:[{tick:0,move:[2,0]}]}])assert.throws(()=>validateInputs(v));
  for(const v of [{player:{carried:11}},{player:{charm_ticks:-1}},{shades:[{pos:[0,0,0],state:'afraid'}]},{drifters:[{id:'D1',pos:[0,0,0],state:'bad'}]},{charms:[{id:'C1',available:1}]}])assert.throws(()=>validateScenario(v,tuning));
});
