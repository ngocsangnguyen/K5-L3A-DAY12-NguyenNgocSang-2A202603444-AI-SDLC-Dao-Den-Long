import {spawnSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cases} from './phase2-cases.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),proof=resolve(root,'docs/proof/phase-2'),commands=[],results=[];
await mkdir(proof,{recursive:true});await mkdir(resolve(root,'tests/scenarios/phase-2'),{recursive:true});
function run(args){const r=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});commands.push({command:`node ${args.join(' ')}`,exit_code:r.status,stdout:r.stdout??'',stderr:r.stderr??''});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');if(r.status!==0)throw new Error(`Failed: node ${args.join(' ')} (${r.error?.message??r.status})`);}
const hash=x=>createHash('sha256').update(x).digest('hex');
let report;
try{
  run(['--test']);run(['scripts/build.mjs']);
  run(['scripts/playtest.mjs']);
  run(['scripts/headless.mjs','--seed','2026','--night','1','--inputs','docs/proof/phase-2/default-playthrough-inputs.json','--ticks','18000','--snapshot-every','120','--out','docs/proof/phase-2/default-playthrough.jsonl']);
  const defaultReplay=(await readFile(resolve(proof,'default-playthrough.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
  if(defaultReplay.at(-1).state!=='won')throw Error('Default night1 input replay did not win');
  for(const c of cases){
    const prefix=`tests/scenarios/phase-2/${c.name}`,out=`docs/proof/phase-2/${c.name}.jsonl`;
    await writeFile(resolve(root,`${prefix}.scenario.json`),JSON.stringify(c.scenario,null,2)+'\n');await writeFile(resolve(root,`${prefix}.inputs.json`),JSON.stringify(c.inputs,null,2)+'\n');
    const args=['scripts/headless.mjs','--seed','42','--night',String(c.night),'--scenario',`${prefix}.scenario.json`,'--inputs',`${prefix}.inputs.json`,'--ticks',String(c.ticks),'--snapshot-every','10','--out',out];run(args);
    const a=await readFile(resolve(root,out));run([...args.slice(0,-1),`artifacts/${c.name}-again.jsonl`]);const b=await readFile(resolve(root,`artifacts/${c.name}-again.jsonl`));if(!a.equals(b))throw Error(`Nondeterministic replay: ${c.name}`);
    const lines=a.toString().trim().split('\n').map(JSON.parse),events=lines.filter(r=>r.type==='event').map(e=>e.name);for(const name of c.required)if(!events.includes(name))throw Error(`Missing event ${name} in ${c.name}`);
    const final=lines.at(-2),end=lines.at(-1);if(c.name.startsWith('win-')&&end.state!=='won')throw Error(`${c.name} did not win`);
    if(c.name==='bridge-pad'&&final.player.pos[0]<42)throw Error('Launch pad did not reach island B');
    if(c.name==='upper-pad'&&final.player.pos[1]!==6)throw Error('Upper launch pad did not reach tier2');
    if(c.name==='ramp'&&Math.abs(final.player.pos[1]-3)>.01)throw Error('Ramp did not reach tier1');
    results.push({name:c.name,night:c.night,status:'passed',byte_identical:true,sha256:hash(a),end,final_player:final.player});
  }
  run(['scripts/benchmark.mjs']);
  const source_sha256={};for(const name of ['src/core/game.js','src/core/levels.js','src/core/validate.js','src/core/campaign.js','src/main.js','src/world.js','src/audio.js','src/settings.js','scripts/headless.mjs','index.html','style.css'])source_sha256[name]=hash(await readFile(resolve(root,name)));
  report={status:'passed',contract_version:'1.1',runtime:process.version,platform:process.platform,contract_sha256:hash(await readFile(resolve(root,'game.contract.json'))),source_sha256,default_playthrough:defaultReplay.at(-1),cases:results,commands,limits:['Hidden instructor tests are not available.','Browser FPS and visual checks are recorded separately.','Linux/macOS workflow is configured; only its actual GitHub run verifies those systems.','Phase3/4 are not implemented without tickets.']};console.log(`Verified Phase2: ${results.length} deterministic feature scenarios, default night1 victory, tests, build, CPU benchmark.`);
}catch(e){report={status:'failed',error:e.message,cases:results,commands};console.error(e.message);process.exitCode=1;}finally{await writeFile(resolve(proof,'verification.json'),JSON.stringify(report,null,2)+'\n');}
