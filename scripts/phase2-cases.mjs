const empty={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false};
export const cases=[
  {name:'dash',night:1,ticks:120,scenario:{...empty},inputs:{frames:[{tick:0,move:[1,0],dash:true},{tick:1,dash:false,move:[0,0]},{tick:90,dash:true},{tick:91,dash:false}]},required:['dash']},
  {name:'charm',night:2,ticks:700,scenario:{...empty,charms:[{id:'C1',pos:[0,0,0]}]},inputs:{frames:[{tick:1,dash:true},{tick:2,dash:false},{tick:14,dash:true},{tick:15,dash:false}]},required:['charm_picked','dash']},
  {name:'drifter',night:2,ticks:160,scenario:{...empty,player:{carried:8},drifters:[{id:'D1',pos:[0,.8,0]}]},inputs:{frames:[{tick:10,pulse:true},{tick:11,pulse:false}]},required:['drifter_steal','drifter_drop','pulse']},
  {name:'pause',night:1,ticks:180,scenario:{...empty,player:{charm_ticks:300},motes:[{id:'M1',pos:[20,0,0],kind:'dropped',ttl_s:8}]},inputs:{frames:[{tick:0,move:[1,0]},{tick:10,pause:true},{tick:11,pause:false},{tick:100,pause:true},{tick:101,pause:false,move:[0,0]}]},required:['paused','resumed']},
  {name:'fall',night:1,ticks:65,scenario:{...empty,player:{pos:[41,-10.1,0],carried:7,invuln_ticks:200}},inputs:{frames:[]},required:['player_hit']},
  {name:'bridge-pad',night:2,ticks:100,scenario:{...empty,player:{pos:[20,0,18]}},inputs:{frames:[]},required:['night_start']},
  {name:'upper-pad',night:3,ticks:100,scenario:{...empty,player:{pos:[0,3,13]}},inputs:{frames:[]},required:['night_start']},
  {name:'ramp',night:3,ticks:90,scenario:{...empty,player:{pos:[31*Math.cos(Math.PI/6),0,31*Math.sin(Math.PI/6)]}},inputs:{frames:[{tick:0,move:[-Math.cos(Math.PI/6),-Math.sin(Math.PI/6)]}]},required:['night_start']},
  {name:'wind',night:3,ticks:2100,scenario:{...empty,wind_enabled:true,player:{pos:[30,0,0]}},inputs:{frames:[]},required:['night_start']},
  ...[1,2,3].map(night=>({name:`win-night-${night}`,night,ticks:5,scenario:{...empty,player:{pos:night===3?[0,6,6]:[0,0,night===1?25:20],carried:10},lanterns:Array.from({length:night+4},(_,i)=>({id:`L${i+1}`,lit:i>0}))},inputs:{frames:[{tick:0,interact:true}]},required:['deposit','lantern_lit','game_over']}))
];
