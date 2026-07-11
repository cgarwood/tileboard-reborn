# Sensor Widget

Displays a sensor entity's state and unit of measurement. Optionally renders a smooth area chart in the widget background showing recent history.

**Default size:** 2×2

```yaml
type: sensor
entity: sensor.living_room_temperature
title: Temperature
```

## Properties

| Key      | Type             | Default | Description                                                                   |
| -------- | ---------------- | ------- | ----------------------------------------------------------------------------- |
| `entity` | string           | —       | Sensor entity ID                                                              |
| `chart`  | object / `false` | —       | Enable background chart. Omit to hide, set to `{}` or a config object to show |

## Background Chart

Add a `chart` key to render a smooth history area chart in the lower half of the widget background. The chart is purely decorative — no axes, labels, or tooltips are shown.

```yaml
type: sensor
entity: sensor.power_usage
chart: {} # show chart with all defaults
```

### Chart options

| Key         | Type                      | Default | Description                                                                                          |
| ----------- | ------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `hours`     | number                    | `24`    | How many hours of history to display                                                                 |
| `min`       | number                    | auto    | Y-axis minimum (auto-padded if omitted)                                                              |
| `max`       | number                    | auto    | Y-axis maximum (auto-padded if omitted)                                                              |
| `smoothing` | number                    | `0.3`   | Curve smoothness (0–1). Higher values reduce data points and produce a more gradual line             |
| `color`     | string / map / expression | white   | Chart line and fill color. Supports hex, `rgb()`, CSS variables, state maps, and `{{ }}` expressions |

```yaml
type: sensor
entity: sensor.power_usage
chart:
  hours: 12
  smoothing: 0.6
  color: 'var(--yellow-5)'
```

```yaml
# Color based on entity state
type: sensor
entity: sensor.battery_level
chart:
  color:
    low: '#e53935'
    medium: '#fb8c00'
    high: '#43a047'
    default: '#43a047'
```

## More-info Dialog

Long-pressing the widget opens a detail dialog with a full interactive history chart (if the entity has a numeric `unit_of_measurement`). See [More-info Configuration](../more-info.md) for customization options.

## Examples

**Simple temperature sensor:**

```yaml
type: sensor
entity: sensor.bedroom_temperature
title: Bedroom
subtitle: Temperature
```

**Power usage with background chart:**

```yaml
type: sensor
entity: sensor.power_usage
title: Power
chart:
  hours: 6
  smoothing: 0.7
  color: 'var(--q-warning)'
```

**Battery level with color-coded chart:**

```yaml
type: sensor
entity: sensor.phone_battery
title: Phone Battery
chart:
  color: "{{ Number(state) < 20 ? '#e53935' : '#43a047' }}"
```
