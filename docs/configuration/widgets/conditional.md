# Conditional Widget

Holds a slot on the grid and fills it with different widgets depending on conditions. Use it to show a "Goodnight" button in the evening and a "Goodbye" button the rest of the day, or one large button in one state and a grid of smaller buttons in another.

**Default size:** 2×2. Set `grid` to the size you want the slot to take.

```yaml
type: conditional
grid: { width: 4, height: 2 }
cases:
  - conditions:
      - template: '{{ new Date().getHours() >= 21 || new Date().getHours() < 5 }}'
    widgets:
      - type: button
        title: Goodnight
        icon: mdi-weather-night
        grid: { width: 4, height: 2 }
        tap_action:
          action: service
          service: script.goodnight
default:
  - { type: switch, entity: light.bedroom, grid: { width: 2, height: 1 } }
  - { type: switch, entity: fan.bedroom, grid: { width: 2, height: 1 } }
  - { type: switch, entity: cover.blinds, grid: { width: 2, height: 1 } }
  - { type: switch, entity: media_player.tv, grid: { width: 2, height: 1 } }
```

## Properties

| Key       | Type            | Description                                                           |
| --------- | --------------- | --------------------------------------------------------------------- |
| `cases`   | list            | Cases checked in order. The first one whose conditions pass is shown. |
| `default` | list of widgets | Widgets shown when no case matches. Optional.                         |

The conditional itself has no card, border, background or tap action. Each widget inside it looks and behaves exactly like it would directly in the section.

### Case keys

| Key          | Type            | Description                                                                                                                  |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `conditions` | list            | Conditions, in the same form as [visibility conditions](index.md#condition-types). A case with no conditions always matches. |
| `match`      | `all` / `any`   | Whether all conditions must pass (default) or just one.                                                                      |
| `widgets`    | list of widgets | Widgets shown while this case is active.                                                                                     |
| `grid`       | object          | `{ width, height }` slot size while this case is active. Defaults to the conditional's own `grid`.                           |

## Layout

The widgets inside the slot are laid out on a grid with the same cell size and gap as the section, so they line up with the widgets around the conditional. Each child's `grid` (or its type's default size) sets how many cells it covers inside the slot. Anything that doesn't fit inside the slot is cut off.

### Keeping the layout still

By default, the slot is always the size of the conditional's `grid`, whichever case is showing. Switching cases never moves the widgets around it. This also makes a conditional with a single case and no `default` a way to show a widget only under some condition **without** moving the rest of the section. The empty slot stays in place when nothing matches, where a widget hidden with `visibility` would let everything after it shift up.

Children can still use `visibility`. A hidden child only lets the other widgets inside the slot move up.

### Letting a case take more room

Give a case its own `grid` when it should be bigger (or smaller) than the usual slot. While that case is active, the slot takes that size and the section reflows around it:

```yaml
type: conditional
grid: { width: 4, height: 2 }
cases:
  - conditions:
      - entity: binary_sensor.smoke_detected
        state: 'on'
    grid: { width: 4, height: 4 } # grows while smoke is detected
    widgets:
      - type: sensor_icon
        entity: binary_sensor.smoke_detected
        title: Smoke detected
        grid: { width: 4, height: 4 }
default:
  - type: sensor
    entity: sensor.bedroom_temperature
    grid: { width: 4, height: 2 }
```

### Removing the slot entirely

Put `visibility` on the conditional itself to remove the whole slot, like any other widget.

## Notes

- Conditions use the same rules as `visibility`, including templates that re-check every minute when they use `Date`.
- Conditionals can be nested.
