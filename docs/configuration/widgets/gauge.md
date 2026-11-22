# Gauge Widget

Shows a numeric value as a colored ring or arc, with the value and unit in the middle. The color can change with the value, for example red when a battery is low and green when it's full.

**Default size:** 2×2

```yaml
type: gauge
entity: sensor.home_battery
title: Battery
segments:
  - { from: 0, color: error }
  - { from: 20, color: warning }
  - { from: 50, color: success }
```

## Properties

| Key        | Type                      | Description                                                                                                        |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `min`      | number                    | Value at the start of the gauge. Default `0`.                                                                      |
| `max`      | number                    | Value at a full gauge. Default `100`. Values outside `min`–`max` show as an empty or full gauge.                   |
| `shape`    | `ring` / `arc`            | `ring` (default) is a full circle starting at the top. `arc` is a 270° arc open at the bottom, like a speedometer. |
| `segments` | list                      | Colors by value. See [Colors](#colors).                                                                            |
| `color`    | string / map / expression | One color for the gauge, used instead of `segments`.                                                               |
| `decimals` | number                    | Round the value to this many decimal places. By default it's shown as the entity reports it.                       |
| `unit`     | string / map / expression | Unit shown after the value. Defaults to the entity's unit of measurement.                                          |
| `value`    | string / map / expression | Show this instead of the entity's state, e.g. a template that calculates a value.                                  |

The [common properties](index.md#common-properties) also apply. `title` and `subtitle` are drawn in the bottom-left corner like on other widgets, and `title` defaults to the entity's name. Holding opens the more-info dialog; there's no default tap action.

When the value isn't a number (for example `unavailable`), the gauge is empty and shows "—".

## Colors

Each segment has a `from` value and a `color`. The gauge uses the color of the highest `from` the value has reached. List them in any order.

```yaml
segments:
  - { from: 0, color: success }
  - { from: 60, color: warning }
  - { from: 85, color: error }
```

A color can be a level name (`info`, `success`, `warning`, `error`, and their aliases such as `good` or `critical`) or any CSS color such as `"#ff9800"` or `"var(--my-color)"`. Level names use a slightly lighter shade of the [alert](alert.md) and [notification](../notifications.md) colors, which stands out better on the gauge's dark background: the `--level-info-bright`, `--level-success-bright`, `--level-warning-bright` and `--level-error-bright` CSS variables.

`color` sets a single color, and can be a template:

```yaml
type: gauge
entity: sensor.memory_use_percent
color: "{{ +state > 80 ? 'error' : 'info' }}"
```

With neither `segments` nor `color`, the gauge uses the `info` color.

## Example: Thermostat-style arc

```yaml
type: gauge
entity: sensor.living_room_temperature
title: Living Room
shape: arc
min: 50
max: 90
decimals: 1
segments:
  - { from: 50, color: info }
  - { from: 68, color: success }
  - { from: 78, color: warning }
```

The widget background is the `--gauge-widget-background` CSS variable.
