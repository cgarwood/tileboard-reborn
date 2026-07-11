# More-info Dialog

The more-info dialog provides an expanded view of an entity's details and controls. It opens automatically when a widget is long-pressed (unless disabled).

The dialog content is determined by the entity's domain:

| Domain | Content |
|--------|---------|
| `light` | Toggle, brightness slider, color temperature slider |
| `climate` | Current temp, HVAC mode buttons, setpoint controls, fan mode |
| `number` / `input_number` | Large value display, slider, +/− buttons |
| `weather` | Current conditions, attributes, tabbed forecast (Daily / Hourly / Twice Daily) |
| everything else | State display and history chart (if entity has a unit of measurement) |

## Configuration

The `more_info` key on any widget customizes or disables the dialog:

```yaml
type: sensor
entity: sensor.living_room_temperature
more_info:
  title: Living Room Temperature
  chart_hours: 48
```

### Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `disabled` | boolean | `false` | Set to `true` to disable the dialog entirely |
| `entity_id` | string | widget entity | Show a different entity in the dialog |
| `title` | string / map / expression | widget title | Override the dialog header title |
| `subtitle` | string / map / expression | widget subtitle | Override the dialog header subtitle |
| `header_background` | string / map / expression | — | Override the header background color |
| `chart` | `false` | enabled | Set to `false` to hide the history chart for sensor entities |
| `chart_hours` | number | `24` | How many hours of history to show in the chart |
| `chart_min` | number | auto | Y-axis minimum for the chart |
| `chart_max` | number | auto | Y-axis maximum for the chart |

## Disabling the Dialog

```yaml
type: sensor
entity: sensor.power_usage
more_info:
  disabled: true
```

Or use `hold_action: none` to disable only the hold gesture while keeping the dialog accessible via `tap_action: more_info`.

## Showing a Different Entity

Use `entity_id` to open the dialog for a different entity than the widget's own:

```yaml
type: sensor
entity: sensor.outdoor_temperature
title: Outside
more_info:
  entity_id: weather.home     # open weather dialog instead
```

## Customizing the Header

`title`, `subtitle`, and `header_background` all support static strings, state maps, and `{{ }}` expressions:

```yaml
type: sensor
entity: sensor.battery
more_info:
  title: "Battery — {{ state }}%"
  header_background: "{{ Number(state) < 20 ? '#e53935' : '#1e1e2e' }}"
```

## History Chart Options

For sensor entities with a unit of measurement, the dialog shows a history chart. Configure it with:

```yaml
type: sensor
entity: sensor.power_usage
more_info:
  chart_hours: 72         # show 3 days of history
  chart_min: 0            # pin Y-axis at 0
  chart_max: 5000         # cap at 5000W
```

Suppress the chart entirely:
```yaml
more_info:
  chart: false
```

## Examples

**Sensor with custom chart range:**
```yaml
type: sensor
entity: sensor.indoor_humidity
title: Humidity
more_info:
  chart_hours: 48
  chart_min: 0
  chart_max: 100
```

**Widget that opens a weather dialog:**
```yaml
type: sensor
entity: sensor.outdoor_temperature
title: Outside
subtitle: "Tap for forecast"
tap_action:
  action: more_info
more_info:
  entity_id: weather.home
  title: Weather
```

**Light with custom header color:**
```yaml
type: light
entity: light.living_room
more_info:
  header_background: "{{ state === 'on' ? 'rgb(255, 200, 80)' : '#1e1e2e' }}"
```

**Disable more-info completely:**
```yaml
type: switch
entity: switch.christmas_lights
more_info:
  disabled: true
```
