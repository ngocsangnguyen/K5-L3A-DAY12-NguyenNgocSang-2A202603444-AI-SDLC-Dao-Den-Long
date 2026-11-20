import {Game} from './core/game.js';
// An explicitly labelled tutorial. It uses the public scenario constructor,
// not a hidden setter, and never changes a normal campaign or headless default.
export function createFuelDemo(tuning){
  return new Game({seed:42,tuning,scenario:{
    time_left_s:30,random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,
    player:{pos:[0,0,0],carried:10},motes:Array.from({length:10},()=>[0,0,0]),
    lanterns:[{id:'L1',pos:[0,0,1.8],lit:true,fuel:85},{id:'L2',pos:[-4,0,0],ever_lit:true},{id:'L3',pos:[4,0,0],lit:true,fuel:.05},{id:'L4',pos:[0,0,-8],lit:true,fuel:20},{id:'L5',pos:[12,0,0]}],
    shades:[{id:'S1',pos:[0,.8,-8],state:'drain',target_lantern_id:'L4'}]
  }});
}
