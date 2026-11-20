// Generate a real input trace for the DEFAULT level; no scenario overrides or
// privileged state changes. Replay it with the public headless CLI as evidence.
import { Game, distanceXZ } from '../src/core/game.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const tuning = JSON.parse(await readFile(new URL('../game.contract.json', import.meta.url))).tuning;
const seed = 2026;
const game = new Game({ seed, tuning });
const frames = [];
let previous = '', targetId = null;
while (game.state === 'playing' && game.tick < 18000) {
  const carried = game.player.carried;
  const unlit = game.lanterns.filter((l) => !l.lit).sort((a, b) => distanceXZ(game.player.pos, a.pos) - distanceXZ(game.player.pos, b.pos));
  const nearestLamp = unlit[0];
  let target;
  // Fill a bag before a lamp trip, then deposit any carried light on arrival.
  if (carried >= tuning.lantern_cost || game.motes.length === 0) target = nearestLamp;
  else {
    target = game.motes.find((m) => m.id === targetId);
    if (!target) target = [...game.motes].sort((a, b) => distanceXZ(game.player.pos, a.pos) - distanceXZ(game.player.pos, b.pos))[0];
  }
  targetId = target?.id;
  let dx = (target?.pos[0] ?? game.player.pos[0]) - game.player.pos[0], dz = (target?.pos[2] ?? game.player.pos[2]) - game.player.pos[2];
  const length = Math.hypot(dx, dz);
  if (length > 0) { dx /= Math.max(length, 1); dz /= Math.max(length, 1); }
  const interact = Boolean(nearestLamp && carried > 0 && distanceXZ(nearestLamp.pos, game.player.pos) <= tuning.interact_radius && !game.input.interact);
  if (interact) { dx = 0; dz = 0; targetId = null; }
  const danger = game.shades.some((s) => s.state !== 'stunned' && distanceXZ(s.pos, game.player.pos) < 3.5);
  const pulse = danger && carried >= tuning.pulse_cost && game.tick + 1 >= game.pulseReadyAt && !game.input.pulse;
  const input = { move: [dx, dz], cam_yaw_deg: 0, interact, pulse, jump: false };
  const encoded = JSON.stringify(input);
  if (encoded !== previous) { frames.push({ tick: game.tick, ...input }); previous = encoded; }
  game.step(input);
}
const folder = new URL('../docs/proof/phase-1/', import.meta.url);
await mkdir(folder, { recursive: true });
await writeFile(new URL('default-playthrough-inputs.json', folder), JSON.stringify({ frames }) + '\n');
const result = { seed, scenario: 'default (no overrides)', ticks: game.tick, seconds: game.tick / 60, state: game.state, lit: game.lanterns.filter((l) => l.lit).length, flames: game.player.flames, score: game.score, input_frames: frames.length };
await writeFile(new URL('default-playthrough.json', folder), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (game.state !== 'won') process.exitCode = 1;
