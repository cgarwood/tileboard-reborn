# Climate Widget

Displays and controls a climate (thermostat) entity. The layout adapts based on the widget's grid size: compact for small widgets, wide for landscape orientations, and vertical for tall widgets.

**Default size:** 4×2

```yaml
type: climate
entity: climate.living_room
title: Living Room
```

## Properties

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `features` | object | all enabled | Controls which inline controls are shown |

### `features` options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | boolean | `true` | Show HVAC mode buttons (heat, cool, off, etc.) |
| `setpoint` | boolean | `true` | Show +/− temperature setpoint controls |
| `fan_mode` | boolean | `true` | Show fan mode buttons |

```yaml
type: climate
entity: climate.bedroom
features:
  fan_mode: false   # hide fan mode controls
```

## Layouts

The widget automatically selects a layout based on its grid dimensions:

- **Compact** (small): shows current temperature and active mode only
- **Wide** (width ≥ 4): shows setpoint controls and mode buttons inline
- **Vertical** (height ≥ 4): shows full controls stacked vertically

## Heat/Cool Mode

When the thermostat is in `heat_cool` mode, the widget shows both a heating and cooling setpoint. The +/− controls adjust both targets together.

## More-info Dialog

Long-pressing opens a detail panel with the full set of controls regardless of widget size.

## Examples

**Standard thermostat:**
```yaml
type: climate
entity: climate.main_floor
title: Main Floor
grid:
  width: 4
  height: 2
```

**Compact — setpoints only:**
```yaml
type: climate
entity: climate.office
title: Office
grid:
  width: 2
  height: 2
features:
  mode: false
  fan_mode: false
```

**Tall layout with all controls:**
```yaml
type: climate
entity: climate.bedroom
title: Bedroom
grid:
  width: 2
  height: 4
```
