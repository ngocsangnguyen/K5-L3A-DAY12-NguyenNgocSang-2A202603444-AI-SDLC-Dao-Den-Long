import { readFile, mkdir, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/core/game.js';
import { InputError, validateInputs, validateScenario } from '../src/core/validate.js';

const contractURL = new URL('../game.contract.json', import.meta.url);
export async function readJSON(path, label) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { throw new InputError(`${label}: ${error.message}`); }
}

export function parseArgs(args) {
  const options = { seed: 1, night: 1, 'snapshot-every': 10 };
  const known = new Set(['seed', 'night', 'scenario', 'inputs', 'ticks', 'out', 'snapshot-every']);
  const seen = new Set();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    if (!args[i]?.startsWith('--') || !known.has(key) || seen.has(key) || args[i + 1] === undefined) throw new InputError(`Unknown, duplicate, or incomplete option: ${args[i]}`);
    seen.add(key);
    options[key] = args[i + 1];
  }
  for (const key of ['seed', 'night', 'ticks', 'snapshot-every']) {
    const raw = options[key];
    if (raw === undefined || !/^-?\d+$/.test(String(raw))) throw new InputError(`--${key} must be an integer`);
    options[key] = Number(raw);
    if (!Number.isSafeInteger(options[key])) throw new InputError(`--${key} is outside safe integer range`);
  }
  if (options.night !== 1) throw new InputError('Only --night 1 is released');
  if (options.ticks < 0 || options['snapshot-every'] < 1) throw new InputError('ticks must be >=0; snapshot-every must be >=1');
  if (typeof options.out !== 'string' || !options.out.trim()) throw new InputError('--out is required');
  return options;
}

export async function runHeadless(options) {
  const contract = await readJSON(contractURL, 'contract');
  const scenario = options.scenario ? await readJSON(options.scenario, 'scenario') : {};
  const inputs = options.inputs ? await readJSON(options.inputs, 'inputs') : { frames: [] };
  validateScenario(scenario, contract.tuning);
  validateInputs(inputs);
  const game = new Game({ seed: options.seed, tuning: contract.tuning, scenario });
  await mkdir(dirname(options.out), { recursive: true });
  const file = await open(options.out, 'w');
  let frameIndex = 0;
  // Buffer bounded batches. Avoid one disk write per event without retaining
  // an unbounded transcript during long headless runs.
  let lines = [];
  const append = (entry) => { lines.push(JSON.stringify(entry)); };
  const flush = async () => {
    if (lines.length) await file.writeFile(lines.join('\n') + '\n', 'utf8');
    lines = [];
  };
  try {
    append(game.snapshot());
    while (game.tick < options.ticks && game.state === 'playing') {
      let patch = {};
      if (inputs.frames[frameIndex]?.tick === game.tick) patch = inputs.frames[frameIndex++];
      for (const event of game.step(patch)) append(event);
      if (game.tick % options['snapshot-every'] === 0) append(game.snapshot());
      if (lines.length >= 256) await flush();
    }
    // Always retain the terminal state even when it is off the interval.
    if (game.tick % options['snapshot-every'] !== 0) append(game.snapshot());
    append({ type: 'end', ticks: game.tick, state: game.state, score: game.score });
    await flush();
  } finally { await file.close(); }
  return game;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await runHeadless(parseArgs(process.argv.slice(2))); }
  catch (error) {
    console.error(error.message);
    process.exitCode = error instanceof InputError ? 2 : 1;
  }
}
