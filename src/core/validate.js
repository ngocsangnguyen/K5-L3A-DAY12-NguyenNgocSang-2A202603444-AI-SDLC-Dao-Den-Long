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
    for (const key of Object.keys(frame)) if (!['tick', 'move', 'cam_yaw_deg', 'jump', 'interact', 'pulse', 'dash', 'pause'].includes(key)) fail(`${name}: unknown field ${key}`);
    if ('move' in frame) {
      if (!Array.isArray(frame.move) || frame.move.length !== 2) fail(`${name}.move must be [x,z]`);
      frame.move.forEach((n) => { finite(n, `${name}.move`); if (n < -1 || n > 1) fail('move components must be in [-1,1]'); });
    }
    if ('cam_yaw_deg' in frame) finite(frame.cam_yaw_deg, `${name}.cam_yaw_deg`);
    for (const key of ['jump', 'interact', 'pulse', 'dash', 'pause']) if (key in frame && typeof frame[key] !== 'boolean') fail(`${name}.${key} must be boolean`);
  }
  return input;
}
export function validateScenario(scenario = {}, tuning, night = 1) {
  object(scenario, 'scenario');
  if ('player' in scenario) {
    object(scenario.player, 'player');
    if ('pos' in scenario.player) position(scenario.player.pos, 'player.pos');
    for (const key of ['carried', 'flames', 'invuln_ticks', 'dash_cd_ticks', 'pulse_cd_ticks', 'charm_ticks']) if (key in scenario.player) nonnegative(scenario.player[key], `player.${key}`, true);
    if ('vel' in scenario.player) position(scenario.player.vel, 'player.vel');
    if (scenario.player.carried > tuning.carry_capacity) fail('player.carried exceeds carry_capacity');
  }
  for (const key of ['random_motes', 'random_shades', 'random_drifters', 'wind_enabled']) if (key in scenario && typeof scenario[key] !== 'boolean') fail(`${key} must be boolean`);
  if ('time_left_s' in scenario) nonnegative(scenario.time_left_s, 'time_left_s');
  if ('motes' in scenario) {
    if (!Array.isArray(scenario.motes)) fail('motes must be an array');
    const moteIds = new Set();
    scenario.motes.forEach((v, i) => { if (Array.isArray(v)) position(v, `motes[${i}]`); else { object(v, 'mote'); position(v.pos, 'mote.pos'); if ('ttl_s' in v && v.ttl_s !== null) nonnegative(v.ttl_s, 'mote.ttl_s'); if ('kind' in v && !['random','dropped'].includes(v.kind)) fail('invalid mote.kind'); } });
    for (const [i,v] of scenario.motes.entries()) { const id=Array.isArray(v)?`M${i+1}`:v.id??`M${i+1}`; if(typeof id!=='string'||!id||moteIds.has(id))fail('mote IDs must be unique strings');moteIds.add(id); }
  }
  if ('shades' in scenario) {
    if (!Array.isArray(scenario.shades)) fail('shades must be an array');
    const ids = new Set();
    scenario.shades.forEach((v, i) => {
      object(v, `shades[${i}]`); position(v.pos, `shades[${i}].pos`);
      const id = v.id ?? `S${i + 1}`;
      if (typeof id !== 'string' || !id || ids.has(id)) fail('shade IDs must be nonempty unique strings');
      ids.add(id);
      if ('state' in v && !['spawning','wander','chase','recoil','stunned'].includes(v.state)) fail('invalid shade state');
      if ('state_ticks_left' in v) nonnegative(v.state_ticks_left,'shade.state_ticks_left',true);
    });
  }
  if ('lanterns' in scenario) {
    if (!Array.isArray(scenario.lanterns)) fail('lanterns must be an array');
    const ids = new Set();
    scenario.lanterns.forEach((v, i) => {
      object(v, `lanterns[${i}]`);
      if (!Array.from({ length: [0,5,6,7][night] }, (_, n) => `L${n + 1}`).includes(v.id) || ids.has(v.id)) fail('lantern ID must be unique and belong to this night');
      ids.add(v.id);
      if ('pos' in v) position(v.pos, `lanterns[${i}].pos`);
      if ('deposited' in v) {
        nonnegative(v.deposited, 'lantern.deposited', true);
        if (v.deposited > tuning.lantern_cost) fail('deposited exceeds lantern_cost');
      }
      if ('lit' in v && typeof v.lit !== 'boolean') fail('lantern.lit must be boolean');
    });
  }
  for (const key of ['drifters','charms']) if (key in scenario) {
    if (!Array.isArray(scenario[key])) fail(`${key} must be an array`);
    const ids = new Set();
    for (const [i,v] of scenario[key].entries()) {
      object(v,key); if (typeof v.id !== 'string' || !v.id || ids.has(v.id)) fail(`${key} IDs must be unique strings`); ids.add(v.id);
      if ('pos' in v) position(v.pos, `${key}.pos`); else if(key==='drifters') fail('drifter.pos required');
      for(const k of ['stolen','state_ticks_left','respawn_ticks']) if(k in v) nonnegative(v[k], `${key}.${k}`,true);
      if('respawn_s' in v) nonnegative(v.respawn_s,'charm.respawn_s');
      if('available' in v && typeof v.available!=='boolean') fail('charm.available must be boolean');
      if(key==='drifters' && 'state' in v && !['idle','chase','flee','removed'].includes(v.state)) fail('invalid drifter state');
    }
  }
  return scenario;
}
