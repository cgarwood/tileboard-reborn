# Switch Widget

Displays and controls a switch, input boolean, or any toggleable entity. Tapping calls `homeassistant.toggle`. The widget reflects on/off state with background color and icon styling.

**Default size:** 2×2

```yaml
type: switch
entity: switch.living_room_fan
title: Fan
```

## Properties

This widget has no widget-specific config keys beyond the [common properties](index.md#common-properties).

## Default Behavior

Tapping calls `homeassistant.toggle` on the widget's `entity`.

## Examples

**Basic switch:**

```yaml
type: switch
entity: switch.porch_light
title: Porch Light
```

**Input boolean with custom colors:**

```yaml
type: switch
entity: input_boolean.vacation_mode
title: Vacation Mode
icon: mdi-airplane
background:
  'on': 'rgb(30, 80, 150)'
  'off': 'rgb(30, 30, 50)'
```
