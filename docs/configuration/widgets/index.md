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
