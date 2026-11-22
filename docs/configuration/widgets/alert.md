# Alert Widget

A colored banner with an icon and a message. Its color comes from a severity level (info, success, warning or error), which can follow an entity's state or a template, so one widget can say "All clear" in green and "Smoke detected" in red.

**Default size:** 4×1. Any width works; at 2 rows or taller, the icon and text get bigger.

```yaml
type: alert
entity: binary_sensor.smoke_kitchen
grid: { width: 8, height: 1 }
title: Smoke alarm
level:
  'on': error
  default: success
message:
  'on': Smoke detected in the kitchen!
  default: All clear
```

## Properties

| Key       | Type                      | Description                                                                                                   |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `level`   | string / map / expression | `info` (default), `success`, `warning` or `error`. See [Levels](#levels).                                     |
| `message` | string / map / expression | The banner text. Defaults to the entity's state. Long messages wrap to 2 lines (4 when the widget is taller). |
| `title`   | string / map / expression | Optional small uppercase label on the right. The entity's name is not used as a default.                      |
| `icon`    | string / map / expression | MDI icon. Defaults to an icon for the level.                                                                  |
| `pulse`   | boolean                   | Make the banner slowly brighten and dim while the level is `error`. Default `false`.                          |

The [common properties](index.md#common-properties) also apply. `background` replaces the level's color. Taps run `tap_action` if set; there's no default tap action. Holding opens the more-info dialog when there's an entity.

## Levels

| Level     | Also accepted               | Color  | Default icon                |
| --------- | --------------------------- | ------ | --------------------------- |
| `info`    |                             | Blue   | `mdi-information-outline`   |
| `success` | `good`, `ok`                | Green  | `mdi-check-circle-outline`  |
| `warning` | `warn`                      | Orange | `mdi-alert-outline`         |
| `error`   | `bad`, `critical`, `danger` | Red    | `mdi-alert-octagon-outline` |

These are the same colors as [notifications](../notifications.md). [Gauge](gauge.md) segments use slightly lighter shades of them. Change them for the whole dashboard with the `--level-info`, `--level-success`, `--level-warning` and `--level-error` CSS variables, for example in a [resource](../resources.md) stylesheet. The widget also gets a `level--<level>` class for your own styling.

## Example: System status from a template

```yaml
type: alert
grid: { width: 8, height: 1 }
title: System status
level: >-
  {{ +entity('sensor.disk_use_percent').state > 85 || +entity('sensor.processor_use').state > 80
  ? 'error' : 'success' }}
message: >-
  {{ [
    +entity('sensor.disk_use_percent').state > 85 ? 'Disk ' + entity('sensor.disk_use_percent').state + '% full' : null,
    +entity('sensor.processor_use').state > 80 ? 'CPU at ' + entity('sensor.processor_use').state + '%' : null
  ].filter(Boolean).join(', ') || 'All systems normal' }}
```

To show an alert only while there's a problem, add `visibility`, or put it in a [conditional](conditional.md) widget to keep its space when it's hidden.
