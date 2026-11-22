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

The step size, minimum, and maximum are read automatically from the entity's `step`, `min`, and `max` attributes. The value is shown with the step's precision: with step 1 a state of `71.0` shows as "71", step 0.5 shows "71.5" and step 0.25 shows "71.25". The more-info dialog does the same.

## Default Behavior

- **+/−**: adjusts value by the entity's configured step
- **Tap**: opens a number input dialog to enter a specific value
- **Long press**: opens the more-info dialog

On a one-row tile (`height: 1`), the value sits above the title on the left and the +/− buttons sit side by side on the right. The state badge is hidden.

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
