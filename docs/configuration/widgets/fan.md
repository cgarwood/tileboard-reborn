# Fan Widget

Displays and controls a fan entity. Shows the current speed as a percentage and animates the fan icon at different speeds. Use the +/− controls to adjust speed, or tap to toggle on/off.

**Default size:** 2×2

```yaml
type: fan
entity: fan.bedroom_ceiling
title: Bedroom Fan
```

## Properties

This widget has no widget-specific config keys beyond the [common properties](index.md#common-properties).

## Default Behavior

- **Tap**: toggles fan on/off
- **+/−**: adjusts fan speed percentage

## Examples

**Basic fan:**

```yaml
type: fan
entity: fan.living_room_ceiling
title: Living Room Fan
```

**Fan with custom icon color:**

```yaml
type: fan
entity: fan.office
title: Office Fan
icon_color:
  'on': 'green'
  'off': 'rgba(255,255,255,0.5)'
```
