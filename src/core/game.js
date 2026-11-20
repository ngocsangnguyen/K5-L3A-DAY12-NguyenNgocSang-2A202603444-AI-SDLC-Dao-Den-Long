import { randomFromSeed } from './random.js';
import { validateScenario } from './validate.js';

export const TICK_RATE = 60;
export const ISLAND_RADIUS = 23;
export const DT = 1 / TICK_RATE;
export const DEFAULT_INPUT = Object.freeze({ move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false, dash: false });
export const distanceXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const inRadius = (a, b, r) => distanceXZ(a, b) <= r + 1e-9;
const rounded = (v) => { const n = Math.round(v * 1000) / 1000; return Object.is(n, -0) ? 0 : n; };
const posCopy = (v) => v.map(rounded);

export class Game {
  constructor({ seed = 1, tuning, scenario = {} }) {
    if (!tuning) throw new Error('Game requires contract tuning');
    validateScenario(scenario, tuning);
    this.tuning = structuredClone(tuning);
    this.random = randomFromSeed(seed);
    this.tick = 0;
    this.state = 'playing';
    this.score = 0;
    this.duration = scenario.time_left_s ?? tuning.night1_duration_s;
    this.timeLeft = this.duration;
    this.player = { pos: [0, 0, 0], carried: 0, flames: tuning.flames, ...structuredClone(scenario.player ?? {}) };
    this.velocityY = 0;
    this.invulnUntil = 0;
    this.pulseReadyAt = 0;
    this.input = structuredClone(DEFAULT_INPUT);
    this.events = [];
    this.lanterns = Array.from({ length: tuning.lantern_count_night1 }, (_, i) => {
      const angle = Math.PI / 2 + i * Math.PI * 2 / tuning.lantern_count_night1;
      return { id: `L${i + 1}`, pos: [Math.cos(angle) * 14, 0, Math.sin(angle) * 14], deposited: 0, lit: false };
    });
    for (const override of scenario.lanterns ?? []) {
      const lantern = this.lanterns.find((l) => l.id === override.id);
      Object.assign(lantern, structuredClone(override));
      if (lantern.lit) lantern.deposited = tuning.lantern_cost;
      else if (lantern.deposited >= tuning.lantern_cost) lantern.lit = true;
    }
    this.motes = (scenario.motes ?? (scenario.random_motes === false ? [] : this.defaultMotes())).map((pos, i) => ({ id: `M${i + 1}`, pos: [...pos] }));
    this.shades = (scenario.shades ?? (scenario.random_shades === false ? [] : this.defaultShades())).map((shade, i) => ({ id: `S${i + 1}`, ...structuredClone(shade), state: 'chase', stunUntil: 0 }));
    this.nextMoteId = this.motes.length + 1;
  }

  defaultMotes() {
    // Spread light across five routes; enough for lamps and defensive pulses.
    return Array.from({ length: 70 }, (_, i) => {
      if (i < 5) return [(i - 2) * 1.5, 0, 3];
      const angle = this.random() * Math.PI * 2;
      const radius = 3 + Math.sqrt(this.random()) * 17;
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
    });
  }

  defaultShades() {
    return Array.from({ length: 3 }, (_, i) => {
      const angle = i * Math.PI * 2 / 3;
      return { pos: [Math.cos(angle) * 21, 0, Math.sin(angle) * 21] };
    });
  }

  event(name, data) {
    this.events.push({ type: 'event', tick: this.tick, name, data });
  }

  step(patch = {}) {
    if (this.state !== 'playing') return [];
    const before = this.input;
    this.input = { ...before, ...patch };
    this.events = [];
    this.tick++;
    this.timeLeft = Math.max(0, this.duration - this.tick / TICK_RATE);
    if (this.player.flames <= 0) { this.finish('lost', 'no_flames'); return this.events; }
    const t = this.tuning;
    let [x, z] = this.input.move;
    const length = Math.hypot(x, z);
    if (length > 1) { x /= length; z /= length; }
    const yaw = this.input.cam_yaw_deg * Math.PI / 180;
    this.player.pos[0] += (x * Math.cos(yaw) + z * Math.sin(yaw)) * t.player_speed * DT;
    this.player.pos[2] += (-x * Math.sin(yaw) + z * Math.cos(yaw)) * t.player_speed * DT;
    // No fall penalty in Phase 1: constrain the default island, but allow test
    // scenarios outside its visual bounds to exercise the specified radii.
    const oldRadius = Math.hypot(this.player.pos[0] - (x * Math.cos(yaw) + z * Math.sin(yaw)) * t.player_speed * DT, this.player.pos[2] - (-x * Math.sin(yaw) + z * Math.cos(yaw)) * t.player_speed * DT);
    const radius = Math.hypot(this.player.pos[0], this.player.pos[2]);
    if (radius > ISLAND_RADIUS && oldRadius <= ISLAND_RADIUS + 1e-9) {
      this.player.pos[0] *= ISLAND_RADIUS / radius;
      this.player.pos[2] *= ISLAND_RADIUS / radius;
    }
    if (this.input.jump && !before.jump && this.player.pos[1] <= 0) this.velocityY = 7;
    if (this.velocityY !== 0 || this.player.pos[1] > 0) {
      this.velocityY -= 18 * DT;
      this.player.pos[1] = Math.max(0, this.player.pos[1] + this.velocityY * DT);
      if (this.player.pos[1] === 0) this.velocityY = 0;
    }
    this.pickup();
    if (this.input.interact && !before.interact) this.deposit();
    if (this.input.pulse && !before.pulse) this.pulse();
    // Winning the interaction ends gameplay before further collision damage.
    if (this.lanterns.every((l) => l.lit)) { this.finish('won', 'all_lit'); return this.events; }
    this.moveShades();
    if (this.player.flames <= 0) this.finish('lost', 'no_flames');
    else if (this.timeLeft <= 0) this.finish('lost', 'dawn');
    return this.events;
  }

  pickup() {
    const t = this.tuning;
    this.motes = this.motes.filter((mote) => {
      if (this.player.carried >= t.carry_capacity || !inRadius(this.player.pos, mote.pos, t.pickup_radius)) return true;
      this.player.carried++;
      this.score += t.score.per_mote;
      this.event('mote_picked', { carried: this.player.carried });
      return false;
    });
  }

  deposit() {
    const t = this.tuning;
    const lantern = this.lanterns.filter((l) => !l.lit && inRadius(this.player.pos, l.pos, t.interact_radius)).sort((a, b) => distanceXZ(a.pos, this.player.pos) - distanceXZ(b.pos, this.player.pos))[0];
    if (!lantern || this.player.carried <= 0) return;
    const amount = Math.min(this.player.carried, t.lantern_cost - lantern.deposited);
    this.player.carried -= amount;
    lantern.deposited += amount;
    this.event('deposit', { lantern_id: lantern.id, amount, deposited: lantern.deposited });
    if (lantern.deposited >= t.lantern_cost) {
      lantern.lit = true;
      this.score += t.score.per_lantern;
      this.event('lantern_lit', { lantern_id: lantern.id });
    }
  }

  pulse() {
    const t = this.tuning;
    if (this.player.carried < t.pulse_cost || this.tick < this.pulseReadyAt) return;
    this.player.carried -= t.pulse_cost;
    this.pulseReadyAt = this.tick + Math.round(t.pulse_cooldown_s * TICK_RATE);
    const stunned = [];
    for (const shade of this.shades) {
      if (!inRadius(this.player.pos, shade.pos, t.pulse_radius)) continue;
      shade.state = 'stunned';
      shade.stunUntil = this.tick + Math.round(t.pulse_stun_s * TICK_RATE);
      let dx = shade.pos[0] - this.player.pos[0], dz = shade.pos[2] - this.player.pos[2];
      const length = Math.hypot(dx, dz);
      if (length < 1e-9) { dx = 1; dz = 0; }
      else { dx /= length; dz /= length; }
      shade.pos[0] += dx * t.pulse_push_m;
      shade.pos[2] += dz * t.pulse_push_m;
      stunned.push(shade.id);
      this.score += t.score.per_stun;
    }
    this.event('pulse', { stunned_ids: stunned });
  }

  moveShades() {
    const t = this.tuning;
    for (const shade of this.shades) {
      const stunned = this.tick < shade.stunUntil;
      shade.state = stunned ? 'stunned' : 'chase';
      if (!stunned) {
        const distance = distanceXZ(shade.pos, this.player.pos);
        const step = Math.min(t.shade_speed * DT, distance);
        if (distance > 1e-9) {
          shade.pos[0] += (this.player.pos[0] - shade.pos[0]) / distance * step;
          shade.pos[2] += (this.player.pos[2] - shade.pos[2]) / distance * step;
        }
      }
      for (const lantern of this.lanterns) {
        if (!lantern.lit) continue;
        const d = distanceXZ(shade.pos, lantern.pos);
        if (d < t.safe_radius + 0.0001) {
          const dx = d < 1e-9 ? 1 : (shade.pos[0] - lantern.pos[0]) / d;
          const dz = d < 1e-9 ? 0 : (shade.pos[2] - lantern.pos[2]) / d;
          shade.pos[0] = lantern.pos[0] + dx * (t.safe_radius + 0.0001);
          shade.pos[2] = lantern.pos[2] + dz * (t.safe_radius + 0.0001);
          if (!stunned) shade.state = 'afraid';
        }
      }
      if (stunned) continue;
      const protectedByLamp = this.lanterns.some((l) => l.lit && inRadius(l.pos, this.player.pos, t.safe_radius));
      if (!protectedByLamp && this.tick >= this.invulnUntil && inRadius(shade.pos, this.player.pos, t.shade_hit_radius)) {
        const dropped = Math.floor(this.player.carried * t.hit_drop_ratio);
        this.player.carried -= dropped;
        this.player.flames = Math.max(0, this.player.flames - 1);
        this.invulnUntil = this.tick + Math.round(t.invuln_s * TICK_RATE);
        // Dropped motes disappear; no immediate automatic re-pickup.
        this.event('player_hit', { by: 'shade', flames: this.player.flames, dropped });
      }
    }
  }

  finish(result, reason) {
    this.state = result;
    if (result === 'won') this.score += Math.floor(this.timeLeft) * this.tuning.score.per_second_left + this.player.flames * this.tuning.score.per_flame_left;
    this.event('game_over', { result, reason });
  }

  snapshot() {
    return {
      type: 'snapshot', tick: this.tick, sim_tick: this.tick, state: this.state,
      time_left_s: this.timeLeft, score: this.score,
      player: { pos: posCopy(this.player.pos), flames: this.player.flames, carried: this.player.carried },
      lanterns: this.lanterns.map((l) => ({ id: l.id, pos: posCopy(l.pos), lit: l.lit, deposited: l.deposited })),
      shades: this.shades.map((s) => ({ id: s.id, pos: posCopy(s.pos), state: s.state })),
      motes_active: this.motes.length,
      motes: this.motes.map((m) => ({ id: m.id, pos: posCopy(m.pos) }))
    };
  }
}
