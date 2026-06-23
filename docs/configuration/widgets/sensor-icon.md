# Sensor Icon Widget

Displays an entity's state as an icon with an optional state badge.

```yaml
type: sensor_icon
entity: binary_sensor.front_door
title: Front Door
```

## Config Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | string | — | Home Assistant entity ID |
| `icon` | string / map / expression | auto | MDI icon override |
| `icon_color` | string / map / expression | `white` | Icon color |

## Icon Resolution

If no `icon` is configured, the widget resolves one automatically:

1. Entity attribute `icon` (if the entity provides one)
2. Device class mapping (state-aware for binary sensors and covers)
3. Domain fallback (`binary_sensor` → radio button, `sensor` → chart line, etc.)

## State Badge

The current state is shown as small text in the upper-right corner of the widget with a darkened background. The unit of measurement (if any) is shown alongside it.

## Examples

```yaml
# Binary sensor — icon changes on/off automatically
type: sensor_icon
entity: binary_sensor.motion_hallway
title: Hallway Motion

# Battery sensor — uses graduated battery icon based on level
type: sensor_icon
entity: sensor.phone_battery
title: Phone Battery

# Custom icon with state-aware color
type: sensor_icon
entity: binary_sensor.front_door
title: Front Door
icon_color:
  on: "#ff5555"
  off: "white"
```
