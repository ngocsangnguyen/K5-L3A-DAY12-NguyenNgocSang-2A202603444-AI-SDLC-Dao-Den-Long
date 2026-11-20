import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game, distanceXZ } from '../src/core/game.js';
import { validateInputs, validateScenario } from '../src/core/validate.js';

const tuning = JSON.parse(readFileSync(new URL('../game.contract.json', import.meta.url))).tuning;
const make = (scenario = {}, changes = {}) => new Game({ seed: 42, tuning: { ...tuning, ...changes }, scenario: { random_motes: false, random_shades: false, ...scenario } });
const near = (a, b, eps = 1e-8) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const step = (game, n, input = {}) => { for (let i = 0; i < n; i++) game.step(input); };

test('tick 0 is pre-input; five lamps; scenario setup has no score/events', () => {
  const g = make({ lanterns: [{ id: 'L1', lit: true }] });
  assert.equal(g.tick, 0); assert.deepEqual(g.player.pos, [0, 0, 0]);
  assert.equal(g.lanterns.length, 5); assert.equal(g.score, 0); assert.deepEqual(g.events, []);
  assert.equal(g.lanterns[0].deposited, tuning.lantern_cost);
});
test('movement is fixed 60 Hz and camera-relative', () => {
  const g = make(); step(g, 60, { move: [0, 1], cam_yaw_deg: 90 });
  near(g.player.pos[0], tuning.player_speed); near(g.player.pos[2], 0);
  near(g.timeLeft, tuning.night1_duration_s - 1); assert.equal(g.tick, 60);
});
test('diagonal input is normalized and partial input persists', () => {
  const g = make(); g.step({ move: [1, 1] }); step(g, 59);
  near(Math.hypot(g.player.pos[0], g.player.pos[2]), tuning.player_speed);
  g.step({ move: [0, 0] }); const before = [...g.player.pos]; g.step({ pulse: true }); assert.deepEqual(g.player.pos, before);
});
test('pickup includes exact XZ radius and ignores vertical distance', () => {
  const g = make({ motes: [[tuning.pickup_radius, 20, 0], [tuning.pickup_radius + 0.001, 0, 0]] });
  const events = g.step(); assert.equal(g.player.carried, 1); assert.equal(g.motes.length, 1);
  assert.equal(events[0].tick, 1); assert.equal(events[0].name, 'mote_picked'); assert.equal(g.score, tuning.score.per_mote);
});
test('pickup stops at capacity; explicit [] replaces defaults', () => {
  const g = make({ motes: Array.from({ length: 20 }, () => [0, 0, 0]) }); g.step();
  assert.equal(g.player.carried, tuning.carry_capacity); assert.equal(g.motes.length, 20 - tuning.carry_capacity);
  const empty = new Game({ seed: 1, tuning, scenario: { motes: [], shades: [] } });
  assert.equal(empty.motes.length, 0); assert.equal(empty.shades.length, 0);
});
test('deposit is on rising edge, partial deposit accumulates and does not overspend', () => {
  const g = make({ player: { carried: 2 }, lanterns: [{ id: 'L1', pos: [tuning.interact_radius, 0, 0] }] });
  g.step({ interact: true }); assert.equal(g.lanterns[0].deposited, 2);
  g.player.carried = 12; g.step({ interact: true }); assert.equal(g.lanterns[0].deposited, 2);
  g.step({ interact: false }); const ev = g.step({ interact: true });
  assert.equal(g.lanterns[0].lit, true); assert.equal(g.player.carried, 8);
  assert.deepEqual(ev.map((e) => e.name), ['deposit', 'lantern_lit']);
  assert.equal(g.score, tuning.score.per_lantern);
});
test('cannot deposit outside radius, into lit lamp, or without carried light', () => {
  const g = make({ player: { carried: 12 }, lanterns: [{ id: 'L1', pos: [tuning.interact_radius + 0.01, 0, 0] }] });
  g.step({ interact: true }); assert.equal(g.player.carried, 12);
  const lit = make({ player: { carried: 12 }, lanterns: [{ id: 'L1', pos: [0, 0, 0], lit: true }] });
  lit.step({ interact: true }); assert.equal(lit.player.carried, 12);
});
test('pulse uses inclusive XZ radius, spends light, pushes and stuns named shade', () => {
  const g = make({ player: { carried: 6 }, shades: [{ id: 'inside', pos: [tuning.pulse_radius, 9, 0] }, { id: 'outside', pos: [tuning.pulse_radius + 0.01, 0, 0] }] });
  const ev = g.step({ pulse: true });
  assert.equal(g.player.carried, 3); assert.equal(g.shades[0].state, 'stunned');
  near(g.shades[0].pos[0], tuning.pulse_radius + tuning.pulse_push_m);
  assert.deepEqual(ev[0].data.stunned_ids, ['inside']); assert.equal(g.score, tuning.score.per_stun);
});
test('pulse needs enough light, a fresh press and cooldown; stun expires', () => {
  const g = make({ player: { carried: 12 }, shades: [{ pos: [2, 0, 0] }] });
  g.step({ pulse: true }); g.step({ pulse: true }); assert.equal(g.player.carried, 9);
  g.step({ pulse: false }); g.step({ pulse: true }); assert.equal(g.player.carried, 9);
  step(g, 180, { pulse: false }); assert.notEqual(g.shades[0].state, 'stunned');
  const poor = make({ player: { carried: 2 } }); assert.deepEqual(poor.step({ pulse: true }), []); assert.equal(poor.player.carried, 2);
});
test('collision drops floor(ratio * carried), only one hit during invulnerability', () => {
  const g = make({ player: { carried: 9 }, shades: [{ pos: [0, 0, 0] }, { pos: [0, 0, 0] }] });
  const ev = g.step(); assert.equal(g.player.flames, 2); assert.equal(g.player.carried, 7);
  assert.equal(ev.filter((e) => e.name === 'player_hit').length, 1); assert.equal(ev[0].data.dropped, 2);
  step(g, 89); assert.equal(g.player.flames, 2); g.step(); assert.equal(g.player.flames, 1);
});
test('lit lamp keeps shade out and protects player at safe-radius boundary', () => {
  const g = make({ player: { pos: [tuning.safe_radius, 0, 0] }, lanterns: [{ id: 'L1', pos: [0, 0, 0], lit: true }], shades: [{ pos: [tuning.safe_radius, 0, 0] }] });
  step(g, 120); assert.equal(g.player.flames, tuning.flames);
  assert.ok(distanceXZ(g.shades[0].pos, g.lanterns[0].pos) >= tuning.safe_radius);
});
test('jump is edge-triggered and returns to ground; holding does not autojump', () => {
  const g = make(); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
  step(g, 100, { jump: true }); near(g.player.pos[1], 0);
  g.step({ jump: false }); g.step({ jump: true }); assert.ok(g.player.pos[1] > 0);
});
test('pulse cannot push a stunned shade into a lit-lamp safe zone', () => {
  const g = make({ player: { carried: 6, pos: [0, 0, 0] }, shades: [{ pos: [2, 0, 0] }], lanterns: [{ id: 'L1', pos: [6, 0, 0], lit: true }] });
  g.step({ pulse: true }); assert.equal(g.shades[0].state, 'stunned');
  assert.ok(distanceXZ(g.shades[0].pos, g.lanterns[0].pos) >= tuning.safe_radius);
});
test('last lamp wins once with score and flame/time bonuses', () => {
  const g = make({ player: { carried: 6 }, lanterns: [{ id: 'L1', pos: [0, 0, 0] }, ...[2, 3, 4, 5].map((n) => ({ id: `L${n}`, lit: true }))] });
  const ev = g.step({ interact: true }); assert.equal(g.state, 'won');
  assert.deepEqual(ev.at(-1).data, { result: 'won', reason: 'all_lit' });
  assert.equal(g.score, tuning.score.per_lantern + 299 * tuning.score.per_second_left + 3 * tuning.score.per_flame_left);
  const score = g.score; assert.deepEqual(g.step(), []); assert.equal(g.tick, 1); assert.equal(g.score, score);
});
test('zero flames and dawn terminate with the contract reasons', () => {
  const hit = make({ player: { flames: 1 }, shades: [{ pos: [0, 0, 0] }] });
  assert.deepEqual(hit.step().at(-1).data, { result: 'lost', reason: 'no_flames' });
  const dawn = make({ time_left_s: 1 }); step(dawn, 60);
  assert.equal(dawn.tick, 60); assert.equal(dawn.timeLeft, 0); assert.deepEqual(dawn.events.at(-1).data, { result: 'lost', reason: 'dawn' });
});
test('seeded generation reproduces positions and IDs; snapshot rounds coordinates', () => {
  const a = new Game({ seed: 739, tuning }), b = new Game({ seed: 739, tuning }), c = new Game({ seed: 740, tuning });
  assert.deepEqual(a.snapshot(), b.snapshot()); assert.notDeepEqual(a.motes, c.motes);
  step(a, 15, { move: [1, 1] }); step(b, 15, { move: [1, 1] }); assert.deepEqual(a.snapshot(), b.snapshot());
  assert.ok(a.snapshot().player.pos.every((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-7));
});
test('invalid input and scenario shapes are rejected', () => {
  for (const data of [null, {}, { frames: [{ tick: 0 }, { tick: 0 }] }, { frames: [{ tick: -1 }] }, { frames: [{ tick: 1, pulse: 1 }] }, { frames: [{ tick: 1, move: [2, 0] }] }, { frames: [{ tick: 0, move: [0] }] }]) assert.throws(() => validateInputs(data));
  for (const data of [null, { motes: [[1, 2]] }, { player: { carried: 99 } }, { shades: [{ pos: [0, 0, 0], id: 'A' }, { pos: [1, 0, 0], id: 'A' }] }, { lanterns: [{ id: 'L6' }] }, { random_motes: 1 }]) assert.throws(() => validateScenario(data, tuning));
});
