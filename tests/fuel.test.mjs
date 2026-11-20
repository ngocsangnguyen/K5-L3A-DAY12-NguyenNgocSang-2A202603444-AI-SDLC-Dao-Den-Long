import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,distanceXZ} from '../src/core/game.js';
import {fuelOf,hasSafeZone} from '../src/core/lantern.js';
import {validateScenario} from '../src/core/validate.js';
const tuning=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning;
const make=(scenario={},night=1)=>new Game({seed:42,night,tuning,scenario:{random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,...scenario}});
const steps=(g,n,patch={})=>{let events=[];for(let i=0;i<n;i++)events.push(...g.step(patch));return events;};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const lamp=(g,id='L1')=>g.lanterns.find(l=>l.id===id);
const drainScenario=(count=1,fuel=20)=>({player:{pos:[30,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel}],shades:Array.from({length:count},(_,i)=>({id:`S${i+1}`,pos:[1+i*.1,.8,0],state:'drain',target_lantern_id:'L1'}))});

test('v1.2 contract constants, setup defaults/rounding and no scenario capacity bonus',()=>{
  assert.equal(tuning.fuel_max,100);assert.equal(tuning.fuel_per_mote,10);assert.equal(tuning.capacity_max,20);assert.equal(tuning.win_ratio,.6);
  const g=make({lanterns:[{id:'L1',lit:true},{id:'L2',lit:true,fuel:42.26},{id:'L3',ever_lit:true}]});const s=g.snapshot();assert.equal(s.lanterns[0].fuel,100);assert.equal(s.lanterns[0].ever_lit,true);assert.equal(s.lanterns[0].relit_count,0);assert.equal(s.lanterns[1].fuel,42.3);assert.equal(s.lanterns[2].fuel,0);assert.equal(s.player.capacity,10);assert.equal(s.player.successful_lights,0);assert.equal(g.score,0);assert.deepEqual(g.events,[]);
});
test('fuel decay is exactly6000 integer steps, out once before any later actions',()=>{
  const g=make({lanterns:[{id:'L1',lit:true}]});steps(g,5999);assert.equal(lamp(g).fuelUnits,1);assert.equal(lamp(g).lit,true);let e=g.step();assert.equal(lamp(g).fuelUnits,0);assert.equal(lamp(g).lit,false);assert.equal(lamp(g).deposited,0);assert.equal(lamp(g).everLit,true);assert.equal(e.filter(e=>e.name==='lantern_out').length,1);assert.equal(steps(g,60).filter(e=>e.name==='lantern_out').length,0);
});
test('full lamp is not selectable and direct interaction has no event or score',()=>{
  const g=make({player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0],lit:true}]});g.deposit();assert.deepEqual(g.events,[]);assert.equal(g.score,0);assert.equal(g.player.carried,10);
  const other=make({player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0],lit:true},{id:'L2',pos:[1,0,0]}]});other.deposit();assert.equal(lamp(other,'L2').lit,true);assert.equal(other.score,150);
});
test('refuel ceil, clamp100, charge only used motes and award5 each',()=>{
  const g=make({player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:85}]});const e=g.step({interact:true});assert.deepEqual(e.find(e=>e.name==='refuel').data,{lantern_id:'L1',amount:2,fuel:100});assert.equal(g.player.carried,1);assert.equal(g.score,10);assert.equal(g.capacity,10);assert.equal(lamp(g).relitCount,0);
  const partial=make({player:{carried:2},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:60}]});partial.step({interact:true});near(fuelOf(lamp(partial)),80-1/60);assert.equal(partial.score,10);
});
test('tick order burns a full lamp before interaction; tie picks lower receiving ID',()=>{
  const g=make({player:{carried:1},lanterns:[{id:'L1',pos:[0,0,0],lit:true}]});g.step({interact:true});assert.equal(g.player.carried,0);assert.equal(g.events.find(e=>e.name==='refuel').data.amount,1);
  const h=make({player:{carried:1},lanterns:[{id:'L2',pos:[-1,0,0]},{id:'L1',pos:[1,0,0],lit:true,fuel:80}]});h.step({interact:true});assert.equal(h.events.find(e=>e.name==='refuel').data.lantern_id,'L1');
});
test('expiry then relight in same tick uses5, capacity grows, and records relight',()=>{
  const g=make({player:{carried:5},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:1/60}]});const e=g.step({interact:true});assert.deepEqual(e.filter(e=>['lantern_out','deposit','lantern_lit'].includes(e.name)).map(e=>e.name),['lantern_out','deposit','lantern_lit']);assert.deepEqual(e.find(e=>e.name==='lantern_lit').data,{lantern_id:'L1',relight:true});assert.equal(lamp(g).fuelUnits,6000);assert.equal(lamp(g).relitCount,1);assert.equal(g.score,65);assert.equal(g.capacity,12);
});
test('first light costs10, partial relight costs5, counters count gameplay only',()=>{
  const first=make({player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0]}]});first.step({interact:true});assert.equal(first.score,150);assert.equal(first.player.successfulLights,1);assert.equal(first.capacity,12);assert.equal(first.events.find(e=>e.name==='lantern_lit').data.relight,false);
  const again=make({player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],ever_lit:true,deposited:2}]});again.step({interact:true});assert.equal(again.score,55);assert.equal(lamp(again).deposited,5);assert.equal(lamp(again).everLit,true);assert.equal(lamp(again).relitCount,1);
});
test('capacity formula allows20, caps pickup, and resets for a new night',()=>{
  const g=make({player:{successful_lights:5,carried:18},motes:Array.from({length:4},()=>[0,0,0])});g.step();assert.equal(g.capacity,20);assert.equal(g.player.carried,20);assert.equal(g.motes.length,2);assert.equal(make({player:{successful_lights:100}}).capacity,20);assert.equal(make({},2).capacity,10);
  assert.throws(()=>make({player:{carried:11}}));assert.equal(make({player:{successful_lights:1,carried:12}}).capacity,12);
});
test('exact30 has safe zone, one integer unit less loses it',()=>{
  const g=make({lanterns:[{id:'L1',lit:true,fuel:30+1/60}]});g.step();assert.equal(lamp(g).fuelUnits,1800);assert.equal(hasSafeZone(lamp(g),tuning),true);g.step();assert.equal(lamp(g).fuelUnits,1799);assert.equal(hasSafeZone(lamp(g),tuning),false);
});
test('refuel above30 expels drainer immediately with no hit and exits drain',()=>{
  const g=make({player:{carried:1},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:29}],shades:[{pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}]});g.step({interact:true});assert.ok(fuelOf(lamp(g))>=30);assert.ok(distanceXZ(g.shades[0].pos,lamp(g).pos)>=6);assert.equal(g.player.flames,3);assert.equal(g.shades[0].state,'wander');
});
test('weak lamp no longer protects Mây against collision',()=>{
  const g=make({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:29}],shades:[{pos:[0,.8,0]}]});g.step();assert.equal(g.player.flames,2);
});
test('two drainers add to natural decay; each logs after60 draining ticks',()=>{
  const g=make(drainScenario(2));const e=steps(g,60);near(fuelOf(lamp(g)),9);const logs=e.filter(e=>e.name==='fuel_drain');assert.equal(logs.length,2);assert.ok(logs.every(e=>e.tick===60&&e.data.fuel===9));assert.deepEqual(logs.map(e=>e.data.shade_id),['S1','S2']);assert.ok(g.shades.every(s=>s.state==='drain'));
});
test('drain depletion switches lamp off before AI and shade exits to wander',()=>{
  const g=make(drainScenario(1,.1));g.step();assert.equal(lamp(g).lit,false);assert.equal(lamp(g).fuelUnits,0);assert.equal(g.shades[0].state,'wander');assert.ok(g.events.some(e=>e.name==='lantern_out'));
});
test('wander prefers weak over unlit, ties by ID, enters drain only within2',()=>{
  const g=make({player:{pos:[30,0,0]},lanterns:[{id:'L1',pos:[1,0,0],lit:true,fuel:20},{id:'L2',pos:[-1,0,0],lit:true,fuel:20}],shades:[{pos:[0,.8,0],state:'wander'}]});g.step();assert.equal(g.shades[0].state,'drain');assert.equal(g.shades[0].targetLanternId,'L1');near(fuelOf(lamp(g)),20-1/60);g.step();near(fuelOf(lamp(g)),20-7/60);
  const far=make({player:{pos:[30,0,0]},lanterns:[{id:'L1',pos:[1,0,0]},{id:'L2',pos:[10,0,0],lit:true,fuel:20}],shades:[{pos:[0,.8,0],state:'wander'}]});far.step();assert.equal(far.shades[0].targetLanternId,'L2');assert.equal(far.shades[0].state,'wander');
});
test('chase does not retarget a weak lamp; drain chase radius is inclusive6',()=>{
  const g=make({player:{pos:[8,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{pos:[0,.8,0],state:'chase'}]});g.step();assert.equal(g.shades[0].state,'chase');assert.equal(g.shades[0].targetLanternId,null);
  const close=make({...drainScenario(),player:{pos:[7,0,0]}});close.step();assert.equal(close.shades[0].state,'chase');
  const outside=make({...drainScenario(),player:{pos:[7.101,0,0]}});outside.step();assert.equal(outside.shades[0].state,'drain');
});
test('drain exits if target farther than2m; healthy/invalid targets never drain',()=>{
  const g=make({...drainScenario(),shades:[{pos:[2.001,.8,0],state:'drain',target_lantern_id:'L1'}]});g.step();assert.equal(g.shades[0].state,'wander');near(fuelOf(lamp(g)),20-1/60);
  const h=make(drainScenario(1,80));h.step();assert.equal(h.shades[0].state,'wander');near(fuelOf(lamp(h)),80-1/60);
});
test('pulse gives total15 for drain,5 for normal shade, then recovers to wander',()=>{
  const g=make({player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[1,.8,0],state:'drain',target_lantern_id:'L1'},{id:'S2',pos:[4,.8,0],state:'chase'}]});g.step({pulse:true});assert.equal(g.score,20);assert.ok(g.shades.every(s=>s.state==='stunned'));steps(g,120,{pulse:false});assert.ok(g.shades.every(s=>s.state==='wander'));
});
test('pause freezes oil, draining cadence, successful lights and capacity',()=>{
  const g=make({...drainScenario(),player:{pos:[30,0,0],successful_lights:3}});g.step({pause:true});const s=g.snapshot();steps(g,120,{pause:false});assert.deepEqual(g.snapshot().lanterns,s.lanterns);assert.equal(g.capacity,16);assert.equal(g.shades[0].drainTicks,0);g.step({pause:true});assert.equal(g.simTick,1);assert.equal(g.shades[0].drainTicks,1);
});
test('lighting every lamp does not finish early; no all_lit event exists',()=>{
  const g=make({lanterns:Array.from({length:5},(_,i)=>({id:`L${i+1}`,lit:true}))});const e=steps(g,60);assert.equal(g.state,'playing');assert.equal(g.score,0);assert.ok(!e.some(e=>e.name==='game_over'));
});
for(const night of [1,2,3])test(`dawn threshold and fuel bonus: night${night}`,()=>{
  const count=night+4,required=Math.ceil(count*.6),lanterns=Array.from({length:count},(_,i)=>({id:`L${i+1}`,lit:i<required,fuel:i<required?2:0}));
  const g=make({time_left_s:1/60,lanterns},night);g.step();assert.equal(g.state,'won');assert.deepEqual(g.events.at(-1).data,{result:'won',reason:'dawn_survived'});assert.equal(g.score,required*51+150);
  const h=make({time_left_s:1/60,lanterns:lanterns.map((l,i)=>({...l,lit:i<required-1}))},night);h.step();assert.equal(h.state,'lost');assert.equal(h.score,0);assert.equal(h.events.at(-1).data.reason,'dawn');
});
test('oil extinguishing on final tick counts before dawn verdict',()=>{
  const g=make({time_left_s:1/60,lanterns:[{id:'L1',lit:true,fuel:1/60},{id:'L2',lit:true},{id:'L3',lit:true}]});g.step();assert.equal(g.state,'lost');assert.equal(g.events.at(-1).data.reason,'dawn');assert.ok(g.events.findIndex(e=>e.name==='lantern_out')<g.events.findIndex(e=>e.name==='game_over'));
});
test('final-tick last flame loss overrides sufficient lit lamps',()=>{
  const g=make({time_left_s:1/60,player:{flames:1},lanterns:[{id:'L1',lit:true},{id:'L2',lit:true},{id:'L3',lit:true}],shades:[{pos:[0,.8,0]}]});g.step();assert.equal(g.state,'lost');assert.equal(g.events.at(-1).data.reason,'no_flames');assert.equal(g.score,0);
});
test('malformed v1.2 fields reject fuel, target ID and successful_lights errors',()=>{
  for(const scenario of [{lanterns:[{id:'L1',fuel:101}]},{lanterns:[{id:'L1',fuel:-1}]},{lanterns:[{id:'L1',ever_lit:1}]},{player:{successful_lights:-1}},{player:{successful_lights:1.5}},{shades:[{pos:[0,0,0],target_lantern_id:'L8'}]}])assert.throws(()=>validateScenario(scenario,tuning));
});
