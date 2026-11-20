import {Game} from './core/game.js';
import {randomFromSeed} from './core/random.js';
export function createBenchmark(tuning,seed=42){const random=randomFromSeed(seed),points=count=>Array.from({length:count},(_,i)=>{const a=(i+random())/count*Math.PI*2,r=40*Math.sqrt(random());return [r*Math.cos(a),0,r*Math.sin(a)];});const motes=points(100),shades=points(200).map((pos,i)=>({id:`S${i+1}`,pos:[pos[0],.8,pos[2]],state:'wander'}));return new Game({tuning,seed,night:1,scenario:{player:{pos:[0,0,0]},random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,motes,shades,lanterns:['L1','L2','L3'].map(id=>({id,lit:true,fuel:100}))}});}
export function stepBenchmark(game){game.simTick++;game.moveShades({wanderOnly:true});}
export function orbitCamera(time){const a=time*Math.PI*2/15;return [30*Math.cos(a),15,-30*Math.sin(a)];}
