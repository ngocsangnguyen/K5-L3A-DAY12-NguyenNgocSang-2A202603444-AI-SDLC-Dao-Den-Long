import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
import {Game} from '../src/core/game.js';
import {randomFromSeed} from '../src/core/random.js';
export function soakInput(random,tick,move){if(tick%30===0){const a=random()*Math.PI*2;move=[Math.cos(a),Math.sin(a)];}return {move,jump:random()<.05,dash:random()<.03,pulse:random()<.02,interact:random()<.10};}
const args=process.argv.slice(2),options={seed:7,nights:10,out:'soak.json'};
try{const seen=new Set();for(let i=0;i<args.length;i+=2){const k=args[i]?.slice(2);if(!args[i]?.startsWith('--')||!['seed','nights','out'].includes(k)||seen.has(k)||!args[i+1])throw Error('Invalid soak arguments');seen.add(k);options[k]=args[i+1];}options.seed=Number(options.seed);options.nights=Number(options.nights);if(!Number.isSafeInteger(options.seed)||!Number.isSafeInteger(options.nights)||options.nights<1)throw Error('seed/nights must be integers; nights>=1');
const t=JSON.parse(await readFile(new URL('../game.contract.json',import.meta.url))).tuning,start=performance.now(),results=[],ticks=[];let crashes=0,game=new Game({tuning:t,seed:options.seed,night:1});global.gc?.();const mem_start_mb=process.memoryUsage().rss/1048576;
for(let i=0;i<options.nights;i++){const random=randomFromSeed(options.seed+i),limit=t[`night${i%3+1}_duration_s`]*60;let move=[0,0];try{while(game.state==='playing'&&game.simTick<limit){const command=soakInput(random,game.simTick,move);move=command.move;game.step(command);}results.push(game.state);ticks.push(game.simTick);}catch(e){crashes++;results.push('crashed');console.error(e.stack);}game=null;game=new Game({tuning:t,seed:options.seed+i+1,night:(i+1)%3+1});}
global.gc?.();const report={nights:options.nights,crashes,results,mem_start_mb,mem_end_mb:process.memoryUsage().rss/1048576,duration_s:(performance.now()-start)/1000,seeds:Array.from({length:options.nights},(_,i)=>options.seed+i),ticks,gc_available:typeof global.gc==='function'};await mkdir(dirname(options.out),{recursive:true});await writeFile(options.out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(crashes)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=2;}
