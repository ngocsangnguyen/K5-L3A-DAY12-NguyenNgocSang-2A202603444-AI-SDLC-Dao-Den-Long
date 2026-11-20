// Fuel is stored in integer 1/60 units. Simulation never reads rounded output.
export const FUEL_SCALE = 60;
export const fuelOf = lamp => lamp.fuelUnits / FUEL_SCALE;
export const fuelOutput = lamp => lamp.lit ? Math.round(fuelOf(lamp) * 10) / 10 : 0;
export const capacityFor = (tuning, successfulLights = 0) => Math.min(tuning.capacity_max, tuning.carry_capacity + 2 * successfulLights);
export const lightCost = (lamp, tuning) => lamp.everLit ? tuning.relight_cost : tuning.lantern_cost;
export const acceptsLight = (lamp, tuning) => !lamp.lit || lamp.fuelUnits < tuning.fuel_max * FUEL_SCALE;
export const hasSafeZone = (lamp, tuning) => lamp.lit && lamp.fuelUnits >= tuning.low_fuel_threshold * FUEL_SCALE;

export function makeLantern(id, position, tuning, override = {}) {
  const everLit = override.ever_lit ?? Boolean(override.lit);
  const cost = everLit ? tuning.relight_cost : tuning.lantern_cost;
  const lit = Boolean(override.lit || (override.deposited ?? 0) >= cost);
  const units = lit ? Math.round((override.fuel ?? tuning.fuel_max) * FUEL_SCALE) : 0;
  return {
    id, pos: [...(override.pos ?? position)], lit: lit && units > 0,
    deposited: lit && units > 0 ? (override.deposited ?? (override.relit_count > 0 ? tuning.relight_cost : tuning.lantern_cost)) : units <= 0 && lit ? 0 : (override.deposited ?? 0),
    fuelUnits: Math.max(0, Math.min(tuning.fuel_max * FUEL_SCALE, units)),
    everLit: everLit || lit, relitCount: override.relit_count ?? 0
  };
}
