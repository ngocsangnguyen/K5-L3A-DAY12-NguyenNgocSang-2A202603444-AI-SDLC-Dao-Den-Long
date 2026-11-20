export class InputError extends Error {
  constructor(message) { super(message); this.name = 'InputError'; }
}
const fail = (message) => { throw new InputError(message); };
const object = (v, name) => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) fail(`${name} must be an object`);
};
const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${name} must be finite`); };
const nonnegative = (v, name, integer = false) => {
  finite(v, name);
  if (v < 0 || (integer && !Number.isSafeInteger(v))) fail(`${name} must be a nonnegative ${integer ? 'integer' : 'number'}`);
};
function position(v, name) {
  if (!Array.isArray(v) || v.length !== 3) fail(`${name} must contain [x,y,z]`);
  v.forEach((n, i) => finite(n, `${name}[${i}]`));
}
export function validateInputs(input = { frames: [] }) {
  object(input, 'inputs');
  if (!Array.isArray(input.frames)) fail('inputs.frames must be an array');
  let previous = -1;
  for (const [i, frame] of input.frames.entries()) {
    const name = `frames[${i}]`;
    object(frame, name);
    nonnegative(frame.tick, `${name}.tick`, true);
    if (frame.tick <= previous) fail('frame ticks must strictly increase');
    previous = frame.tick;
    for (const key of Object.keys(frame)) if (!['tick', 'move', 'cam_yaw_deg', 'jump', 'interact', 'pulse', 'dash'].includes(key)) fail(`${name}: unknown field ${key}`);
    if ('move' in frame) {
      if (!Array.isArray(frame.move) || frame.move.length !== 2) fail(`${name}.move must be [x,z]`);
      frame.move.forEach((n) => { finite(n, `${name}.move`); if (n < -1 || n > 1) fail('move components must be in [-1,1]'); });
    }
    if ('cam_yaw_deg' in frame) finite(frame.cam_yaw_deg, `${name}.cam_yaw_deg`);
    for (const key of ['jump', 'interact', 'pulse', 'dash']) if (key in frame && typeof frame[key] !== 'boolean') fail(`${name}.${key} must be boolean`);
  }
  return input;
}
export function validateScenario(scenario = {}, tuning) {
  object(scenario, 'scenario');
  if ('player' in scenario) {
    object(scenario.player, 'player');
    if ('pos' in scenario.player) position(scenario.player.pos, 'player.pos');
    for (const key of ['carried', 'flames']) if (key in scenario.player) nonnegative(scenario.player[key], `player.${key}`, true);
    if (scenario.player.carried > tuning.carry_capacity) fail('player.carried exceeds carry_capacity');
  }
  for (const key of ['random_motes', 'random_shades']) if (key in scenario && typeof scenario[key] !== 'boolean') fail(`${key} must be boolean`);
  if ('time_left_s' in scenario) nonnegative(scenario.time_left_s, 'time_left_s');
  if ('motes' in scenario) {
    if (!Array.isArray(scenario.motes)) fail('motes must be an array');
    scenario.motes.forEach((v, i) => position(v, `motes[${i}]`));
  }
  if ('shades' in scenario) {
    if (!Array.isArray(scenario.shades)) fail('shades must be an array');
    const ids = new Set();
    scenario.shades.forEach((v, i) => {
      object(v, `shades[${i}]`); position(v.pos, `shades[${i}].pos`);
      const id = v.id ?? `S${i + 1}`;
      if (typeof id !== 'string' || !id || ids.has(id)) fail('shade IDs must be nonempty unique strings');
      ids.add(id);
    });
  }
  if ('lanterns' in scenario) {
    if (!Array.isArray(scenario.lanterns)) fail('lanterns must be an array');
    const ids = new Set();
    scenario.lanterns.forEach((v, i) => {
      object(v, `lanterns[${i}]`);
      if (!Array.from({ length: tuning.lantern_count_night1 }, (_, n) => `L${n + 1}`).includes(v.id) || ids.has(v.id)) fail('lantern ID must be unique and belong to L1...L5');
      ids.add(v.id);
      if ('pos' in v) position(v.pos, `lanterns[${i}].pos`);
      if ('deposited' in v) {
        nonnegative(v.deposited, 'lantern.deposited', true);
        if (v.deposited > tuning.lantern_cost) fail('deposited exceeds lantern_cost');
      }
      if ('lit' in v && typeof v.lit !== 'boolean') fail('lantern.lit must be boolean');
    });
  }
  return scenario;
}
