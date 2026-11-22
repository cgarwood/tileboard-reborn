import type { HassEntity } from 'home-assistant-js-websocket';

/**
 * Binary sensor state wording by device class, as the HA frontend shows it (English). The same
 * device classes as BINARY_SENSOR_DEVICE_CLASS_ICONS in haIcons.ts.
 */
export const BINARY_SENSOR_DEVICE_CLASS_STATES: Record<string, { on: string; off: string }> = {
  battery: { on: 'Low', off: 'Normal' },
  battery_charging: { on: 'Charging', off: 'Not charging' },
  carbon_monoxide: { on: 'Detected', off: 'Clear' },
  cold: { on: 'Cold', off: 'Normal' },
  connectivity: { on: 'Connected', off: 'Disconnected' },
  door: { on: 'Open', off: 'Closed' },
  garage_door: { on: 'Open', off: 'Closed' },
  gas: { on: 'Detected', off: 'Clear' },
  heat: { on: 'Hot', off: 'Normal' },
  light: { on: 'Light detected', off: 'No light' },
  lock: { on: 'Unlocked', off: 'Locked' },
  moisture: { on: 'Wet', off: 'Dry' },
  motion: { on: 'Detected', off: 'Clear' },
  moving: { on: 'Moving', off: 'Not moving' },
  occupancy: { on: 'Detected', off: 'Clear' },
  opening: { on: 'Open', off: 'Closed' },
  plug: { on: 'Plugged in', off: 'Unplugged' },
  power: { on: 'On', off: 'Off' },
  presence: { on: 'Home', off: 'Away' },
  problem: { on: 'Problem', off: 'OK' },
  running: { on: 'Running', off: 'Not running' },
  safety: { on: 'Unsafe', off: 'Safe' },
  smoke: { on: 'Detected', off: 'Clear' },
  sound: { on: 'Detected', off: 'Clear' },
  tamper: { on: 'Tampering detected', off: 'Clear' },
  update: { on: 'Update available', off: 'Up-to-date' },
  vibration: { on: 'Detected', off: 'Clear' },
  window: { on: 'Open', off: 'Closed' },
};

const COMMON_STATES: Record<string, string> = {
  on: 'On',
  off: 'Off',
  unavailable: 'Unavailable',
  unknown: 'Unknown',
};

/**
 * An entity's state as text for display: binary sensors are worded by device class (door → Open /
 * Closed, motion → Detected / Clear, …), and on/off/unavailable/unknown are capitalised. Any other
 * state (numbers, enum values) is returned unchanged. Templates and state maps still see the raw
 * state; this is only for showing it.
 */
export function formatEntityState(entity: HassEntity | null | undefined): string | null {
  if (!entity) return null;
  const s = entity.state;
  if (entity.entity_id.startsWith('binary_sensor.') && (s === 'on' || s === 'off')) {
    const dc = entity.attributes.device_class;
    const labels = dc ? BINARY_SENSOR_DEVICE_CLASS_STATES[dc] : undefined;
    if (labels) return labels[s];
  }
  return COMMON_STATES[s] ?? s;
}

/**
 * A numeric value rounded to `decimals` places (a widget's `decimals` option). Non-numeric values,
 * and any value when `decimals` isn't a number, are returned unchanged.
 */
export function roundToDecimals(value: string, decimals: unknown): string {
  if (typeof decimals !== 'number' || !Number.isFinite(decimals) || value.trim() === '')
    return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toFixed(Math.min(20, Math.max(0, Math.round(decimals))));
}

/** Decimal places in a number entity's `step` (1 → 0, 0.5 → 1, 0.25 → 2, 1e-7 → 7). */
export function stepDecimals(step: unknown): number {
  if (typeof step !== 'number' || !Number.isFinite(step) || step <= 0) return 0;
  const [mantissa = '', exponent] = String(step).split('e');
  const fraction = mantissa.split('.')[1]?.length ?? 0;
  return Math.max(0, fraction - Number(exponent ?? 0));
}
