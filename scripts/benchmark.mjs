import { Game } from '../src/core/game.js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
const tuning = JSON.parse(await readFile(new URL('../game.contract.json', import.meta.url))).tuning;
const trials = [];
for (let i = 0; i < 5; i++) {
  const game = new Game({ seed: i, tuning, scenario: { player: { flames: 1000000 } } });
  const start = performance.now();
  while (game.tick < 18000 && game.state === 'playing') game.step({ move: [Math.sin(game.tick / 100), Math.cos(game.tick / 100)] });
  trials.push({ ticks: game.tick, elapsed_ms: Math.round((performance.now() - start) * 100) / 100 });
}
const report = { kind: 'headless-logic-only', runtime: process.version, platform: process.platform, cpu: cpus()[0]?.model, cpu_threads: cpus().length, memory_gb: Math.round(totalmem() / 1024 ** 3), trials, note: 'No Phase 4 performance threshold is released. This is a baseline, not a GPU FPS claim. High flame count is a scenario override to measure all 18,000 ticks without early death.' };
await mkdir(new URL('../docs/proof/phase-1/', import.meta.url), { recursive: true });
await writeFile(new URL('../docs/proof/phase-1/benchmark.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
