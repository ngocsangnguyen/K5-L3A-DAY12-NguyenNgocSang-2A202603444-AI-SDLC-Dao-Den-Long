import {cases as phase2Cases} from './phase2-cases.mjs';
const empty={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false};
const still={frames:[]};
const interact={frames:[{tick:0,interact:true},{tick:1,interact:false}]};
function maintenance(night){
  const duration=[0,240,270,300][night],required=Math.ceil((night+4)*.6),start=(duration-100)*60;
  const lamps=Array.from({length:required},(_,i)=>({id:`L${i+1}`,pos:[i*4-4,0,-12],lit:true}));
  const motes=lamps.slice(1).flatMap(l=>Array.from({length:5},()=>l.pos));
  const frames=[{tick:start,interact:true}];
  for(let i=1;i<required;i++){frames.push({tick:start+(i-1)*41+1,interact:false,move:[1,0]},{tick:start+i*41,interact:true,move:[0,0]});}
  return {name:`maintain-night-${night}`,night,ticks:duration*60,snapshotEvery:60,scenario:{...empty,player:{pos:lamps[0].pos,carried:10},lanterns:lamps,motes},inputs:{frames},required:['lantern_out','deposit','lantern_lit','game_over'],expected:{state:'won',reason:'dawn_survived',ticks:duration*60,capacity:10+2*required}};
}
export const cases=[
  // Existing mechanics retain their original scenario definitions; only the
  // obsolete instant-win cases are replaced by dawn cases below (ADR-003).
  ...phase2Cases.filter(c=>!c.name.startsWith('win-')).map(c=>({...c,name:`regression-${c.name}`})),
  {name:'refuel-ceil',night:1,ticks:5,scenario:{...empty,player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:85}]},inputs:interact,required:['refuel'],expected:{score:10}},
  {name:'expiry-relight',night:1,ticks:2,scenario:{...empty,player:{carried:5},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:1/60}]},inputs:interact,required:['lantern_out','deposit','lantern_lit'],expected:{score:65,capacity:12}},
  {name:'multi-drain',night:1,ticks:60,scenario:{...empty,player:{pos:[30,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[1,2].map(i=>({id:`S${i}`,pos:[i*.1,.8,0],state:'drain',target_lantern_id:'L1'}))},inputs:still,required:['fuel_drain'],expected:{fuel:9}},
  {name:'drain-pulse',night:1,ticks:10,scenario:{...empty,player:{carried:3},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}]},inputs:{frames:[{tick:0,pulse:true},{tick:1,pulse:false}]},required:['pulse'],expected:{score:15}},
  {name:'safe-restored',night:1,ticks:1,scenario:{...empty,player:{carried:1},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:29}],shades:[{id:'S1',pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}]},inputs:interact,required:['refuel'],expected:{flames:3}},
  {name:'capacity-grow',night:1,ticks:3,scenario:{...empty,player:{successful_lights:4,carried:10},motes:Array.from({length:20},()=>[0,0,0]),lanterns:[{id:'L1',pos:[0,0,0],ever_lit:true}]},inputs:interact,required:['lantern_lit','mote_picked'],expected:{capacity:20}},
  {name:'no-early-win',night:1,ticks:120,scenario:{...empty,time_left_s:2,lanterns:Array.from({length:5},(_,i)=>({id:`L${i+1}`,lit:true}))},inputs:still,required:['game_over'],expected:{state:'won',reason:'dawn_survived',ticks:120}},
  {name:'pause-fuel',night:1,ticks:180,scenario:{...empty,player:{pos:[30,0,0]},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[0,.8,0],state:'drain',target_lantern_id:'L1'}]},inputs:{frames:[{tick:0,pause:true},{tick:1,pause:false},{tick:120,pause:true},{tick:121,pause:false}]},required:['paused','resumed','fuel_drain'],expected:{fuel:14}},
  ...[1,2,3].flatMap(night=>[true,false].map(win=>{const n=night+4,required=Math.ceil(n*.6);return {name:`dawn-${win?'win':'lose'}-${night}`,night,ticks:5,scenario:{...empty,time_left_s:1/60,lanterns:Array.from({length:n},(_,i)=>({id:`L${i+1}`,lit:i<(win?required:required-1),fuel:2}))},inputs:still,required:['game_over'],expected:{state:win?'won':'lost',reason:win?'dawn_survived':'dawn',ticks:1}};})),
  {name:'final-tick-out',night:1,ticks:1,scenario:{...empty,time_left_s:1/60,lanterns:[{id:'L1',lit:true,fuel:1/60},{id:'L2',lit:true},{id:'L3',lit:true}]},inputs:still,required:['lantern_out','game_over'],expected:{state:'lost',reason:'dawn'}},
  {name:'final-tick-no-flames',night:1,ticks:1,scenario:{...empty,time_left_s:1/60,player:{flames:1},lanterns:[{id:'L1',lit:true},{id:'L2',lit:true},{id:'L3',lit:true}],shades:[{pos:[0,.8,0]}]},inputs:still,required:['player_hit','game_over'],expected:{state:'lost',reason:'no_flames'}},
  ...[1,2,3].map(maintenance)
];
