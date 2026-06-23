/**
 * Icon mappings for Home Assistant entity types, matching the HA frontend where possible.
 * Icons are in Quasar/MDI format (mdi-xxx, not mdi:xxx).
 */

/** Binary sensor icons vary by on/off state. */
export const BINARY_SENSOR_DEVICE_CLASS_ICONS: Record<string, { on: string; off: string }> = {
  battery:          { on: 'mdi-battery-alert',          off: 'mdi-battery' },
  battery_charging: { on: 'mdi-battery-charging',       off: 'mdi-battery' },
  carbon_monoxide:  { on: 'mdi-smoke-detector-alert',   off: 'mdi-smoke-detector' },
  cold:             { on: 'mdi-snowflake-alert',         off: 'mdi-snowflake-off' },
  connectivity:     { on: 'mdi-lan-connect',             off: 'mdi-lan-disconnect' },
  door:             { on: 'mdi-door-open',               off: 'mdi-door-closed' },
  garage_door:      { on: 'mdi-garage-open',             off: 'mdi-garage' },
  gas:              { on: 'mdi-smoke-detector-alert',    off: 'mdi-smoke-detector' },
  heat:             { on: 'mdi-fire-alert',              off: 'mdi-fire-off' },
  light:            { on: 'mdi-brightness-7',            off: 'mdi-brightness-5' },
  lock:             { on: 'mdi-lock-open',               off: 'mdi-lock' },
  moisture:         { on: 'mdi-water-alert',             off: 'mdi-water-off' },
  motion:           { on: 'mdi-motion-sensor',           off: 'mdi-motion-sensor-off' },
  moving:           { on: 'mdi-motion',                  off: 'mdi-motion-sensor-off' },
  occupancy:        { on: 'mdi-home',                    off: 'mdi-home-outline' },
  opening:          { on: 'mdi-square-rounded-outline',  off: 'mdi-square-rounded' },
  plug:             { on: 'mdi-power-plug',              off: 'mdi-power-plug-off' },
  power:            { on: 'mdi-power',                   off: 'mdi-power-off' },
  presence:         { on: 'mdi-home',                    off: 'mdi-home-outline' },
  problem:          { on: 'mdi-alert-circle',            off: 'mdi-check-circle' },
  running:          { on: 'mdi-play-circle',             off: 'mdi-stop-circle' },
  safety:           { on: 'mdi-shield-alert',            off: 'mdi-shield-check' },
  smoke:            { on: 'mdi-smoke-detector-alert',    off: 'mdi-smoke-detector' },
  sound:            { on: 'mdi-ear-hearing',             off: 'mdi-ear-hearing-off' },
  tamper:           { on: 'mdi-alert',                   off: 'mdi-check' },
  update:           { on: 'mdi-package-up',              off: 'mdi-package' },
  vibration:        { on: 'mdi-vibrate',                 off: 'mdi-vibrate-off' },
  window:           { on: 'mdi-window-open',             off: 'mdi-window-closed' },
};

/** Sensor device class icons (state-independent). */
export const SENSOR_DEVICE_CLASS_ICONS: Record<string, string> = {
  apparent_power:                  'mdi-flash',
  aqi:                             'mdi-air-filter',
  atmospheric_pressure:            'mdi-thermometer-lines',
  battery:                         'mdi-battery',
  carbon_dioxide:                  'mdi-molecule-co2',
  carbon_monoxide:                 'mdi-molecule-co',
  current:                         'mdi-current-ac',
  data_rate:                       'mdi-transmission-tower',
  data_size:                       'mdi-database',
  date:                            'mdi-calendar',
  distance:                        'mdi-arrow-left-right',
  duration:                        'mdi-progress-clock',
  energy:                          'mdi-lightning-bolt',
  energy_storage:                  'mdi-lightning-bolt',
  frequency:                       'mdi-sine-wave',
  gas:                             'mdi-meter-gas',
  humidity:                        'mdi-water-percent',
  illuminance:                     'mdi-brightness-5',
  irradiance:                      'mdi-sun-wireless',
  moisture:                        'mdi-water-percent',
  monetary:                        'mdi-cash',
  nitrogen_dioxide:                'mdi-molecule',
  nitrogen_monoxide:               'mdi-molecule',
  nitrous_oxide:                   'mdi-molecule',
  ozone:                           'mdi-molecule',
  ph:                              'mdi-ph',
  pm1:                             'mdi-air-filter',
  pm10:                            'mdi-air-filter',
  pm25:                            'mdi-air-filter',
  power:                           'mdi-lightning-bolt',
  power_factor:                    'mdi-angle-acute',
  precipitation:                   'mdi-water',
  precipitation_intensity:         'mdi-water-pound',
  pressure:                        'mdi-gauge',
  reactive_power:                  'mdi-flash',
  signal_strength:                 'mdi-wifi',
  sound_pressure:                  'mdi-ear-hearing',
  speed:                           'mdi-speedometer',
  sulphur_dioxide:                 'mdi-molecule',
  temperature:                     'mdi-thermometer',
  timestamp:                       'mdi-clock',
  volatile_organic_compounds:      'mdi-molecule',
  volatile_organic_compounds_parts:'mdi-molecule',
  voltage:                         'mdi-sine-wave',
  volume:                          'mdi-gauge',
  volume_flow_rate:                'mdi-gauge',
  volume_storage:                  'mdi-gauge',
  water:                           'mdi-water',
  weight:                          'mdi-weight',
  wind_speed:                      'mdi-weather-windy',
};

/** Cover device class icons vary by open/closed state. */
export const COVER_DEVICE_CLASS_ICONS: Record<string, { open: string; closed: string }> = {
  awning:   { open: 'mdi-awning',               closed: 'mdi-awning-outline' },
  blind:    { open: 'mdi-blinds-open',           closed: 'mdi-blinds' },
  curtain:  { open: 'mdi-curtains',              closed: 'mdi-curtains-closed' },
  damper:   { open: 'mdi-circle-slice-8',        closed: 'mdi-circle-outline' },
  door:     { open: 'mdi-door-open',             closed: 'mdi-door-closed' },
  garage:   { open: 'mdi-garage-open',           closed: 'mdi-garage' },
  gate:     { open: 'mdi-gate-open',             closed: 'mdi-gate' },
  shade:    { open: 'mdi-roller-shade',          closed: 'mdi-roller-shade-closed' },
  shutter:  { open: 'mdi-window-shutter-open',   closed: 'mdi-window-shutter' },
  window:   { open: 'mdi-window-open',           closed: 'mdi-window-closed' },
};

/** Fallback icons by HA entity domain. */
export const DOMAIN_ICONS: Record<string, string> = {
  air_quality:      'mdi-air-filter',
  alarm_control_panel: 'mdi-shield-home',
  automation:       'mdi-robot',
  binary_sensor:    'mdi-radiobox-blank',
  button:           'mdi-gesture-tap',
  calendar:         'mdi-calendar',
  camera:           'mdi-camera',
  climate:          'mdi-thermostat',
  counter:          'mdi-counter',
  cover:            'mdi-window-closed',
  device_tracker:   'mdi-map-marker',
  fan:              'mdi-fan',
  group:            'mdi-group',
  humidifier:       'mdi-air-humidifier',
  image:            'mdi-image',
  input_boolean:    'mdi-toggle-switch-outline',
  input_button:     'mdi-gesture-tap',
  input_datetime:   'mdi-calendar-clock',
  input_number:     'mdi-ray-vertex',
  input_select:     'mdi-format-list-bulleted',
  input_text:       'mdi-form-textbox',
  lawn_mower:       'mdi-robot-mower',
  light:            'mdi-lightbulb',
  lock:             'mdi-lock',
  media_player:     'mdi-cast',
  number:           'mdi-ray-vertex',
  person:           'mdi-account',
  remote:           'mdi-remote',
  scene:            'mdi-palette',
  script:           'mdi-script-text',
  select:           'mdi-format-list-bulleted',
  sensor:           'mdi-chart-line',
  siren:            'mdi-bugle',
  sun:              'mdi-weather-sunny',
  switch:           'mdi-toggle-switch',
  text:             'mdi-form-textbox',
  timer:            'mdi-timer',
  todo:             'mdi-clipboard-list',
  update:           'mdi-package-up',
  vacuum:           'mdi-robot-vacuum',
  valve:            'mdi-pipe-valve',
  water_heater:     'mdi-water-boiler',
  weather:          'mdi-cloud',
  zone:             'mdi-map-marker-radius',
};

/**
 * Maps a battery level (0–100) to the corresponding MDI battery icon.
 * Uses mdi-battery-outline for 0–9%, mdi-battery-10 through mdi-battery-90,
 * and mdi-battery for 100%.
 */
export function getBatteryIcon(level: number): string {
  if (level >= 100) return 'mdi-battery';
  if (level >= 90)  return 'mdi-battery-90';
  if (level >= 80)  return 'mdi-battery-80';
  if (level >= 70)  return 'mdi-battery-70';
  if (level >= 60)  return 'mdi-battery-60';
  if (level >= 50)  return 'mdi-battery-50';
  if (level >= 40)  return 'mdi-battery-40';
  if (level >= 30)  return 'mdi-battery-30';
  if (level >= 20)  return 'mdi-battery-20';
  if (level >= 10)  return 'mdi-battery-10';
  return 'mdi-battery-outline';
}

import type { HassEntity } from 'home-assistant-js-websocket';

/**
 * Returns the best icon for a given HA entity based on its domain, device class, and state.
 * Priority: device class (state-aware) → domain fallback.
 * Pass null to get the domain fallback or the generic unknown icon.
 */
export function getEntityIcon(entity: HassEntity | null): string {
  const entityId = entity?.entity_id ?? '';
  const domain = entityId.split('.')[0] ?? '';
  const dc = (entity?.attributes.device_class as string) ?? null;
  const s = entity?.state ?? 'off';
  const attrs = (entity?.attributes ?? {}) as Record<string, unknown>;

  if (domain === 'binary_sensor' && dc) {
    // Binary sensor battery: use battery_level attribute if available for a more precise icon
    if (dc === 'battery') {
      const level = attrs.battery_level as number | undefined;
      if (level != null) return getBatteryIcon(level);
    }
    const pair = BINARY_SENSOR_DEVICE_CLASS_ICONS[dc];
    if (pair) return s === 'on' ? pair.on : pair.off;
  }

  if (domain === 'sensor' && dc) {
    // Sensor battery: state IS the percentage
    if (dc === 'battery') {
      const level = parseFloat(s);
      if (!isNaN(level)) return getBatteryIcon(level);
    }
    const icon = SENSOR_DEVICE_CLASS_ICONS[dc];
    if (icon) return icon;
  }

  if (domain === 'cover') {
    const isOpen = s === 'open';
    if (dc) {
      const pair = COVER_DEVICE_CLASS_ICONS[dc];
      if (pair) return isOpen ? pair.open : pair.closed;
    }
    return isOpen ? 'mdi-window-open' : 'mdi-window-closed';
  }

  if (domain === 'lock') {
    return s === 'unlocked' ? 'mdi-lock-open' : 'mdi-lock';
  }

  if (domain === 'light') {
    return s === 'on' ? 'mdi-lightbulb' : 'mdi-lightbulb-off';
  }

  if (domain === 'switch') {
    return s === 'on' ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off-outline';
  }

  if (domain === 'fan') {
    return s === 'on' ? 'mdi-fan' : 'mdi-fan-off';
  }

  if (domain === 'media_player') {
    return s === 'playing' ? 'mdi-cast-connected' : 'mdi-cast';
  }

  if (domain === 'input_boolean') {
    return s === 'on' ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off-outline';
  }

  return DOMAIN_ICONS[domain] ?? 'mdi-help-circle-outline';
}
