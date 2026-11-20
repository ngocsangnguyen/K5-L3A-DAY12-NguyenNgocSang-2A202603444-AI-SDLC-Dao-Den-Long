import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (args) => spawnSync(process.execPath, ['scripts/headless.mjs', '--seed', '7', '--night', '1', ...args], { encoding: 'utf8' });
function fixture(fn) { const dir = mkdtempSync(join(tmpdir(), 'lantern-test-')); try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); } }
test('CLI writes tick0, exact N steps, persistent frames and mandatory end', () => fixture((dir) => {
  const scenario = join(dir, 'scenario.json'), inputs = join(dir, 'inputs.json'), out = join(dir, 'out.jsonl');
  writeFileSync(scenario, JSON.stringify({ random_motes: false, random_shades: false }));
  writeFileSync(inputs, JSON.stringify({ frames: [{ tick: 0, move: [0, 1] }, { tick: 60, move: [0, 0] }] }));
  const result = run(['--scenario', scenario, '--inputs', inputs, '--ticks', '120', '--out', out]);
  assert.equal(result.status, 0, result.stderr);
  const lines = readFileSync(out, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines[0].tick, 0); assert.equal(lines[0].player.pos[2], 0);
  assert.equal(lines.at(-2).tick, 120); assert.equal(lines.at(-2).sim_tick, 120);
  assert.equal(lines.at(-2).player.pos[2], 6); assert.equal(lines.at(-2).time_left_s, 238);
  assert.deepEqual(lines.at(-1), { type: 'end', ticks: 120, state: 'playing', score: 0 });
}));
test('CLI replay is byte-identical and runs zero steps correctly', () => fixture((dir) => {
  const a = join(dir, 'a.jsonl'), b = join(dir, 'b.jsonl');
  assert.equal(run(['--ticks', '100', '--out', a]).status, 0);
  assert.equal(run(['--ticks', '100', '--out', b]).status, 0);
  assert.equal(readFileSync(a, 'utf8'), readFileSync(b, 'utf8'));
  assert.equal(run(['--ticks', '0', '--out', a]).status, 0);
  const records = readFileSync(a, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(records.length, 2); assert.equal(records[1].ticks, 0);
}));
test('CLI stops early at game over and retains terminal snapshot', () => fixture((dir) => {
  const scenario = join(dir, 's.json'), out = join(dir, 'o.jsonl');
  writeFileSync(scenario, JSON.stringify({ time_left_s: 0.05, random_shades: false, random_motes: false }));
  const result = run(['--scenario', scenario, '--ticks', '100', '--out', out]); assert.equal(result.status, 0, result.stderr);
  const records = readFileSync(out, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(records.at(-1).ticks, 3); assert.equal(records.at(-1).state, 'lost'); assert.equal(records.at(-2).tick, 3);
}));
test('malformed JSON, invalid fields, repeated frame ticks and bad CLI return 2', () => fixture((dir) => {
  const path = join(dir, 'bad.json'), out = join(dir, 'out.jsonl');
  for (const content of ['{', '{"frames":[{"tick":0},{"tick":0}]}', '{"frames":[{"tick":0,"jump":1}]}']) {
    writeFileSync(path, content); const r = run(['--inputs', path, '--ticks', '10', '--out', out]);
    assert.equal(r.status, 2); assert.ok(r.stderr.length > 0);
  }
  writeFileSync(path, '{"player":{"pos":[1,2]}}');
  assert.equal(run(['--scenario', path, '--ticks', '10', '--out', out]).status, 2);
  assert.equal(run(['--ticks', '-1', '--out', out]).status, 2);
  assert.equal(run(['--ticks', '3', '--snapshot-every', '0', '--out', out]).status, 2);
}));
test('all nights expose the contract schema and pause advances wall tick only',()=>fixture(dir=>{
  for(const night of [1,2,3]){
    const out=join(dir,`n${night}.jsonl`),inputs=join(dir,'inputs.json');writeFileSync(inputs,JSON.stringify({frames:[{tick:0,pause:true},{tick:1,pause:false},{tick:60,pause:true}]}));
    const result=spawnSync(process.execPath,['scripts/headless.mjs','--seed','12','--night',String(night),'--inputs',inputs,'--ticks','61','--out',out],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
    const records=readFileSync(out,'utf8').trim().split('\n').map(JSON.parse);const snapshot=records.at(-2);assert.equal(snapshot.night,night);assert.equal(snapshot.sim_tick,1);assert.equal(snapshot.tick,61);assert.equal(snapshot.lanterns.length,night+4);assert.ok('drifters' in snapshot&&'charms'in snapshot&&'wind'in snapshot);assert.ok(records.some(r=>r.name==='paused'));assert.ok(records.some(r=>r.name==='resumed'));
  }
}));
