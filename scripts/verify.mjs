import { spawnSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const proof = resolve(root, 'docs/proof/phase-1');
await mkdir(proof, { recursive: true });
const commands = [];
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const command = `node ${args.join(' ')}`;
  commands.push({ command, exit_code: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' });
  process.stdout.write(result.stdout ?? ''); process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) throw new Error(`Check failed: ${command} (${result.error?.message ?? result.status})`);
}
const digest = (value) => createHash('sha256').update(value).digest('hex');
let report;
try {
  run(['--test']);
  run(['scripts/build.mjs']);
  run(['scripts/playtest.mjs']);
  run(['scripts/headless.mjs', '--seed', '2026', '--night', '1', '--inputs', 'docs/proof/phase-1/default-playthrough-inputs.json', '--ticks', '18000', '--snapshot-every', '60', '--out', 'docs/proof/phase-1/default-playthrough.jsonl']);
  const playthrough = (await readFile(resolve(proof, 'default-playthrough.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  if (playthrough.at(-1).state !== 'won' || playthrough.at(-2).lanterns.some((l) => !l.lit)) throw new Error('Default-level CLI replay did not light all five lamps');
  const base = ['scripts/headless.mjs', '--seed', '42', '--night', '1', '--scenario', 'tests/scenarios/pulse.json', '--inputs', 'tests/scenarios/pulse-inputs.json', '--ticks', '240'];
  run([...base, '--out', 'docs/proof/phase-1/replay.jsonl']);
  run([...base, '--out', 'artifacts/replay-again.jsonl']);
  const a = await readFile(resolve(proof, 'replay.jsonl')), b = await readFile(resolve(root, 'artifacts/replay-again.jsonl'));
  if (!a.equals(b)) throw new Error('Deterministic replay differs');
  const contract = await readFile(resolve(root, 'game.contract.json'));
  const source_sha256 = {};
  for (const name of ['src/core/game.js', 'src/core/validate.js', 'src/core/random.js', 'src/main.js', 'src/world.js', 'src/audio.js', 'scripts/headless.mjs', 'index.html', 'style.css']) source_sha256[name] = digest(await readFile(resolve(root, name)));
  report = { status: 'passed', runtime: process.version, platform: process.platform, arch: process.arch, contract_sha256: digest(contract), source_sha256, replay_sha256: digest(a), deterministic_byte_identical: true, commands, limits: ['Browser playability is checked separately; this report does not assert GUI or GPU performance.', 'Linux/macOS CI is configured but not asserted to have run locally.', 'Only Phase 1 is released; phases 2–4 are pending their tickets.'] };
  console.log(`Verified: tests, static build, default-level victory, byte-identical replay (${digest(a).slice(0, 12)})`);
} catch (error) {
  report = { status: 'failed', error: error.message, runtime: process.version, platform: process.platform, commands };
  console.error(error.message); process.exitCode = 1;
} finally {
  await writeFile(resolve(proof, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
}
