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

Binary sensor states are worded by device class, the way Home Assistant shows them, so you don't need a `state_badge` template for the usual cases:

| Device class | On | Off |
|---|---|---|
| `door`, `garage_door`, `opening`, `window` | Open | Closed |
| `motion`, `occupancy`, `gas`, `smoke`, `sound`, `vibration`, `carbon_monoxide` | Detected | Clear |
| `presence` | Home | Away |
| `connectivity` | Connected | Disconnected |
| `problem` | Problem | OK |
| `moisture` | Wet | Dry |
| `lock` | Unlocked | Locked |
| `safety` | Unsafe | Safe |
| `battery` | Low | Normal |
| `battery_charging` | Charging | Not charging |
| `cold` / `heat` | Cold / Hot | Normal |
| `light` | Light detected | No light |
| `moving` | Moving | Not moving |
| `plug` | Plugged in | Unplugged |
| `running` | Running | Not running |
| `tamper` | Tampering detected | Clear |
| `update` | Update available | Up-to-date |

Other `on`/`off` states show as On/Off, and `unavailable`/`unknown` are capitalised. Other states are shown as they are. `state_badge` replaces the text, and templates and state maps still see the raw state (`on`/`off`). The `sensor` widget's value, `list` rows and the more-info dialog use the same wording.

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
