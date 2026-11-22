# Hero Widget

A large welcome banner for the top of a page: a greeting, the date and time, an optional message, a row of chips, and the weather (or another value or widget) on the side. By default its background follows the sun and the weather.

**Default size:** 8×3. At 2 rows tall the text gets smaller; at 4 rows or taller it gets bigger.

```yaml
type: hero
weather: weather.home
chips:
  - icon: mdi-lightbulb-group
    text: "{{ Object.keys(states).filter(id => id.startsWith('light.') && states[id].state === 'on').length }} lights on"
    tap_action: { action: navigate, page: lights }
  - entity: sensor.home_battery
    icon: mdi-battery
    text: '{{ state }}% battery'
```

## Properties

| Key          | Type                      | Description                                                                                                 |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `title`      | string / map / expression | Large heading. Defaults to a greeting for the time of day: Good morning, afternoon, evening or night.       |
| `subtitle`   | string / map / expression | Line under the title. Defaults to the date and time, e.g. "Saturday, November 21 · 9:58 PM".                |
| `message`    | string / map / expression | Optional extra line under the subtitle.                                                                     |
| `weather`    | string                    | Weather entity shown on the side (icon, temperature, condition and humidity). Also used for the background. |
| `side`       | object                    | Show something else on the side instead. See [Side](#side).                                                 |
| `chips`      | list                      | Small rounded labels along the bottom. See [Chips](#chips).                                                 |
| `sun_entity` | string                    | Entity the background follows. Default `sun.sun`.                                                           |

The [common properties](index.md#common-properties) also apply. The greeting and the default subtitle update every minute. `tap_action` and `hold_action` work on the whole widget; there's no default tap action.

## Side

`weather` puts the weather on the right. To show something else, use `side`. It can be a single value:

```yaml
side:
  entity: sensor.outdoor_temperature
  icon: mdi-thermometer
  label: Outside
```

| Key      | Description                                                |
| -------- | ---------------------------------------------------------- |
| `entity` | Entity whose state is shown.                               |
| `value`  | Show this instead of the state (string, map or template).  |
| `unit`   | Unit after the value. Defaults to the entity's unit.       |
| `icon`   | MDI icon to the left of the value.                         |
| `label`  | Small text under the value. Defaults to the entity's name. |

Or any other widget, drawn in a column on the right:

```yaml
side:
  width: 2 # columns, in grid cells (default 2)
  widget:
    type: gauge
    entity: sensor.home_battery
    title: Battery
```

## Chips

| Key           | Description                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `text`        | Chip text (string, map or template). With an `entity`, it defaults to the entity's state and unit.               |
| `icon`        | MDI icon before the text.                                                                                        |
| `entity`      | Entity the chip is about: `state` and `attributes` in its templates refer to it.                                 |
| `color`       | Fill color: a level name (`info`, `success`, `warning`, `error`, see [alert](alert.md#levels)) or any CSS color. |
| `visibility`  | Show the chip only when these [conditions](index.md#visibility) pass.                                            |
| `tap_action`  | [Action](../actions.md) when the chip is tapped. No default.                                                     |
| `hold_action` | Action when the chip is held. Defaults to the more-info dialog for the chip's `entity`.                          |

A `more_info` action on a chip opens the chip's own entity unless the action names another. Tapping or holding a chip doesn't trigger the widget's own `tap_action` or `hold_action`. If the widget has a `restriction`, it also applies to its chips.

```yaml
chips:
  - entity: cover.garage_door
    icon: mdi-garage-open
    text: Garage open
    color: warning
    visibility:
      conditions:
        - entity: cover.garage_door
          state: open
    tap_action:
      action: service
      service: cover.close_cover
      data: { entity_id: cover.garage_door }
```

## Background

Unless you set `background`, the widget picks a gradient from the sun's position:

| Phase      | When                                      |
| ---------- | ----------------------------------------- |
| Day        | The sun is more than 6° above the horizon |
| Dawn, dusk | The sun is within 6° of the horizon       |
| Night      | The sun is more than 6° below the horizon |

When `weather` is cloudy, rainy, snowy, foggy or stormy, a greyer version is used. The widget gets `hero--day`, `hero--dawn`, `hero--dusk` or `hero--night`, plus `hero--overcast`, so a theme stylesheet can replace each one:

```css
.widget-hero.hero--night {
  background: linear-gradient(120deg, #000 0%, #1a1a40 100%);
}
```

`background` (which can be a template) replaces the automatic one entirely.
