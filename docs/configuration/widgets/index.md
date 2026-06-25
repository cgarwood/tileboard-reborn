# Widgets

Widgets are the building blocks of a TileBoard dashboard. Each widget maps to a Home Assistant entity or provides a standalone display.

## Common Properties

All widgets support these top-level config keys:

| Key | Type | Description |
|-----|------|-------------|
| `type` | string | Widget type identifier (required) |
| `entity` | string | Home Assistant entity ID |
| `title` | string / expression | Display label (defaults to entity friendly name) |
| `subtitle` | string / expression | Secondary label |
| `background` | string / map / expression | Widget background color or CSS value |
| `icon` | string / map / expression | MDI icon name |
| `icon_color` | string / map / expression | Icon color |
| `grid` | object | `{ width, height }` override in grid units |
| `restriction` | string | Restriction ID to require before interaction |
| `state_badge` | string / map / expression | Override the state badge text |
| `visibility` | object | Conditions that control whether the widget is rendered |
| `class` | string / expression | Additional CSS class |
| `style` | object | Inline CSS overrides |

## Dynamic Properties

`title`, `subtitle`, `background`, `icon`, `icon_color`, and `class` all support three forms:

**Static string**
```yaml
background: "rgb(30, 50, 80)"
```

**State map** — keyed by entity state, with an optional `default`
```yaml
background:
  on: "var(--green-9)"
  off: "var(--grey-9)"
  default: "var(--grey-9)"
```

**JavaScript expression** — wrapped in `{{ }}`
```yaml
background: "{{ state === 'on' ? '#4caf50' : '#333' }}"
subtitle: "Humidity: {{ entity('sensor.humidity').state }}%"
```

Available expression variables: `state`, `attributes`, `entity(id)`, `states`

## Visibility

The `visibility` property controls whether a widget is rendered. Widgets with no `visibility` config are always visible. Hidden widgets are removed from the DOM entirely — they take no space and consume no resources.

```yaml
visibility:
  match: all        # "all" (AND) or "any" (OR) — default: "all"
  conditions:
    - entity: binary_sensor.someone_home
      state: "on"
```

### Condition types

| Key | Description |
|-----|-------------|
| `state` | Entity state equals value |
| `not` | Entity state does not equal value |
| `above` | Entity state (numeric) is greater than value |
| `below` | Entity state (numeric) is less than value |
| `template` | JavaScript expression returning a truthy/falsy value |

All condition types except `template` require an `entity` key.

### `match`

- `all` — all conditions must pass (AND). This is the default.
- `any` — at least one condition must pass (OR).

### Examples

**Show only when someone is home:**
```yaml
visibility:
  conditions:
    - entity: binary_sensor.someone_home
      state: "on"
```

**Show fan controls only when the fan is on:**
```yaml
visibility:
  conditions:
    - entity: fan.bedroom
      not: "off"
```

**Show a widget within a temperature range:**
```yaml
visibility:
  match: all
  conditions:
    - entity: sensor.outdoor_temp
      above: 60
    - entity: sensor.outdoor_temp
      below: 95
```

**Show when either of two entities is active (OR):**
```yaml
visibility:
  match: any
  conditions:
    - entity: binary_sensor.motion_living
      state: "on"
    - entity: binary_sensor.motion_kitchen
      state: "on"
```

**JavaScript template — full `states` map is available:**
```yaml
visibility:
  conditions:
    - template: "{{ Number(states['sensor.occupancy_count'].state) > 0 }}"
```

## Widget Types

- [Sensor](sensor.md)
- [Sensor Icon](sensor-icon.md)
- [Button](button.md)
- [Switch](switch.md)
- [Light](light.md)
- [Climate](climate.md)
- [Camera](camera.md)
- [Weather](weather.md)
- [Calendar](calendar.md)
- [Fan](fan.md)
- [Number](number.md)
- [List](list.md)
