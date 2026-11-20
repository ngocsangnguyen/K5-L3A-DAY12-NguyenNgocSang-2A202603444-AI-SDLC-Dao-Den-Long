import * as THREE from 'three';
import {World} from './world.js';
import {createBenchmark,stepBenchmark,orbitCamera} from './benchmark-scene.js';
import {benchmarkMetrics} from './bench-metrics.js';
export async function runBenchmark(){
  document.body.classList.add('benchmark');for(const e of document.querySelectorAll('body> :not(canvas):not(script)'))e.hidden=true;
  const status=document.createElement('output');status.id='benchmark-status';status.style.cssText='position:fixed;left:20px;top:20px;color:white;background:#0e1430dd;padding:18px;font:18px system-ui;z-index:50';document.body.append(status);
  try{window.resizeTo(outerWidth+1280-innerWidth,outerHeight+720-innerHeight);const config=await(await fetch('/api/benchmark/config')).json(),tuning=(await(await fetch('/game.contract.json')).json()).tuning,game=createBenchmark(tuning,config.seed),world=new World(document.getElementById('world'),tuning,game.level);world.reset(game);let first=null,previous=null,acc=0,measured=0;const deltas=[];
  await new Promise((resolve,reject)=>{function frame(now){try{first??=now;const elapsed=(now-first)/1000,raw=previous===null?0:now-previous;previous=now;acc+=raw/1000;while(acc>=1/60){stepBenchmark(game);acc-=1/60;}
    world.update(game,elapsed,Math.min(raw/1000,.25),{home:false,yaw:0,distance:30,orbit:orbitCamera(elapsed),colorblind:false,reduceMotion:false});
    if(elapsed===0)fetch('/api/benchmark/first-frame',{method:'POST'}).catch(reject);
    if(elapsed>=3&&raw>0){const dt=Math.min(raw,Math.max(0,config.duration*1000-measured));if(dt>0){deltas.push(dt);measured+=dt;}}
    status.textContent=`BENCH · 200 Bóng Mực · 100 đom đóm · ${elapsed<3?'khởi động':(measured/1000).toFixed(1)+' / '+config.duration+'s'} · ${world.renderer.info.render.calls} draw calls`;
    if(measured>=config.duration*1000){const report={contract_version:'1.3',...benchmarkMetrics(deltas),renderer:`Three.js r${THREE.REVISION} / WebGL2`,viewport:{width:innerWidth,height:innerHeight},scene:{shades:game.shades.length,motes:game.motes.length,lit:game.lanterns.filter(l=>l.lit).length},sample_ms:measured};status.textContent=JSON.stringify(report);fetch('/api/benchmark/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)}).then(resolve,reject);}else requestAnimationFrame(frame);
  }catch(e){reject(e);}}requestAnimationFrame(frame);});world.dispose();window.close();
  }catch(e){status.textContent=e.stack;await fetch('/api/benchmark/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message})});}
}
