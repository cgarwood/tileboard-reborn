# Number Widget

Displays and adjusts a `number` or `input_number` entity. Shows the current value with +/− buttons for quick increments. Tapping the value opens a prompt to type a specific number.

**Default size:** 2×2

```yaml
type: number
entity: number.tv_volume
title: Volume
```

## Properties

This widget has no widget-specific config keys beyond the [common properties](index.md#common-properties).

The step size, minimum, and maximum are read automatically from the entity's `step`, `min`, and `max` attributes.

## Default Behavior

- **+/−**: adjusts value by the entity's configured step
- **Tap**: opens a number input dialog to enter a specific value
- **Long press**: opens the more-info dialog

## Examples

**Volume control:**
```yaml
type: number
entity: number.tv_volume
title: TV Volume
icon: mdi-volume-high
```

**Timer duration:**
```yaml
type: number
entity: input_number.timer_minutes
title: Timer
subtitle: minutes
icon: mdi-timer-outline
```
