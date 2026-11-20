import {spawnSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cases} from './phase3-cases.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),proof=resolve(root,'docs/proof/phase-4'),commands=[],results=[];
await mkdir(proof,{recursive:true});await mkdir(resolve(root,'tests/scenarios/phase-4'),{recursive:true});
function run(args){const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});commands.push({command:`node ${args.join(' ')}`,exit_code:r.status,stdout:r.stdout??'',stderr:r.stderr??''});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');if(r.status!==0)throw Error(`Failed: node ${args.join(' ')} (${r.error?.message??r.status})`);}
const hash=x=>createHash('sha256').update(x).digest('hex');
let report;
try{
  run(['--test']);run(['scripts/build.mjs']);
  for(const c of cases){
    const prefix=`tests/scenarios/phase-4/${c.name}`,out=`docs/proof/phase-4/${c.name}.jsonl`;
    await writeFile(resolve(root,`${prefix}.scenario.json`),JSON.stringify(c.scenario,null,2)+'\n');await writeFile(resolve(root,`${prefix}.inputs.json`),JSON.stringify(c.inputs,null,2)+'\n');
    const args=['scripts/headless.mjs','--seed','42','--night',String(c.night),'--scenario',`${prefix}.scenario.json`,'--inputs',`${prefix}.inputs.json`,'--ticks',String(c.ticks),'--snapshot-every',String(c.snapshotEvery??10),'--out',out];run(args);
    const a=await readFile(resolve(root,out));run([...args.slice(0,-1),`artifacts/phase4-${c.name}-again.jsonl`]);const b=await readFile(resolve(root,`artifacts/phase4-${c.name}-again.jsonl`));if(!a.equals(b))throw Error(`Nondeterministic replay: ${c.name}`);const historical=await readFile(resolve(root,`docs/proof/phase-3/${c.name}.jsonl`));if(!a.equals(historical))throw Error(`Phase3 regression: ${c.name}`);
    const lines=a.toString().trim().split('\n').map(JSON.parse),events=lines.filter(r=>r.type==='event'),final=lines.at(-2),end=lines.at(-1);
    for(const name of c.required)if(!events.some(e=>e.name===name))throw Error(`Missing ${name} in ${c.name}`);
    const e=c.expected??{};
    for(const key of ['state','ticks','score'])if(key in e&&end[key]!==e[key])throw Error(`${c.name}: wrong ${key}: ${end[key]}`);
    if(e.reason&&events.find(e=>e.name==='game_over')?.data.reason!==e.reason)throw Error(`${c.name}: wrong game-over reason`);
    for(const key of ['capacity','flames'])if(key in e&&final.player[key]!==e[key])throw Error(`${c.name}: wrong player.${key}`);
    if('fuel'in e&&final.lanterns[0].fuel!==e.fuel)throw Error(`${c.name}: wrong fuel ${final.lanterns[0].fuel}`);
    if(c.name==='regression-bridge-pad'&&final.player.pos[0]<42)throw Error('Bridge launch failed');
    if(c.name==='regression-upper-pad'&&final.player.pos[1]!==6)throw Error('Upper launch failed');
    if(c.name==='regression-ramp'&&Math.abs(final.player.pos[1]-3)>.01)throw Error('Ramp failed');
    if(c.name==='no-early-win'&&events.find(x=>x.name==='game_over').tick!==120)throw Error('Premature win');
    results.push({name:c.name,night:c.night,status:'passed',byte_identical:true,matches_phase3:true,sha256:hash(a),end,final_player:final.player});
  }
  run(['scripts/benchmark.mjs']);
  run(['--jitless','--expose-gc','--max-semi-space-size=1','scripts/soak.mjs','--seed','7','--nights','10','--out','docs/proof/phase-4/soak.json']);const soak=JSON.parse(await readFile(resolve(proof,'soak.json')));if(soak.crashes!==0||soak.mem_end_mb>soak.mem_start_mb*1.2)throw Error('Soak memory/crash threshold failed');
  const source_sha256={};for(const name of ['src/core/game.js','src/core/lantern.js','src/core/levels.js','src/core/validate.js','src/core/campaign.js','src/main.js','src/world.js','src/audio.js','src/settings.js','src/controls.js','src/leaderboard.js','src/benchmark.js','src/benchmark-scene.js','src/bench-metrics.js','src/fuel-demo.js','scripts/headless.mjs','scripts/serve.mjs','scripts/soak.mjs','scripts/bench.mjs','index.html','style.css'])source_sha256[name]=hash(await readFile(resolve(root,name)));
  report={status:'passed',contract_version:'1.3',runtime:process.version,platform:process.platform,contract_sha256:hash(await readFile(resolve(root,'game.contract.json'))),source_sha256,cases:results,commands,limits:['Instructor hidden tests are unavailable.','Graphical benchmark/browser/video are separate evidence.','Maintenance scenarios are constructed, not default playthroughs.','No staging/commit/tag/push/Release per latest user instruction.']};console.log(`Verified Phase4: ${results.length} deterministic scenarios matching Phase3, tests, build, CPU benchmark and soak.`);
}catch(e){report={status:'failed',error:e.message,cases:results,commands};console.error(e.message);process.exitCode=1;}finally{await writeFile(resolve(proof,'verification.json'),JSON.stringify(report,null,2)+'\n');}
