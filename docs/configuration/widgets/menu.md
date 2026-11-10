# Menu Widget

Shows a day's menu, such as a school lunch menu, grouped by serving line or section. Each section shows its main items. Tapping the widget opens a dialog with the full day, including sides.

By default the widget shows today's menu. When there is no menu today (weekends, holidays), it shows tomorrow's menu if there is one. Set `switch_at` to move to tomorrow's menu at a set time each day.

**Default size:** 4×4

```yaml
type: menu
entity: sensor.sunnyside_menu_lunch_today
title: Sunnyside Lunch
```

## Properties

| Key                    | Type    | Default                                                             | Description                                                                                        |
| ---------------------- | ------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `entity`               | string  | —                                                                   | Entity holding today's menu (required)                                                             |
| `source`               | string  | `nutrislice`                                                        | How to read the entity: `nutrislice` or `sections` (see [Sources](#sources))                       |
| `tomorrow_entity`      | string  | derived                                                             | Entity holding tomorrow's menu. For `nutrislice`, defaults to `entity` with `_today` → `_tomorrow` |
| `switch_at`            | string  | `"00:00"`                                                           | Time (`HH:MM`, 24-hour) from which tomorrow's menu is shown. `"00:00"` always shows today's menu   |
| `fallback_to_tomorrow` | boolean | `true`                                                              | Show tomorrow's menu when there is no menu today                                                   |
| `hide_sections`        | list    | `[Extra Extra, Milk & Condiments]` for `nutrislice`, none otherwise | Section names to leave out (case-insensitive)                                                      |
| `attribute`            | string  | `categories`                                                        | `sections` source only: the attribute holding the menu                                             |

The widget also supports the [common properties](index.md#common-properties). Setting `tap_action` replaces the full-day dialog. Holding the widget opens the more-info dialog for `entity`, as with other widgets.

Today's and tomorrow's entities are matched to days by their `date` attribute when they have one (`YYYY-MM-DD`). So a "today" entity that hasn't refreshed since midnight is not shown as today's menu.

## Sources

### `nutrislice`

For the today and tomorrow sensors created by the Nutrislice School Menus custom integration (for example `sensor.sunnyside_menu_lunch_today`). Sections come from the sensor's `categories` attribute, which lists the school's serving lines in order. Each line's entrees are its main items. Condiments are left out, and the remaining sides are shown in the tap dialog and on the screensaver slide.

Some schools have separate lines (for example "Grill", "2Mato", "On the Go"). Others have a single "Main Entrees" section. Both work.

### `sections`

For any entity with an attribute shaped as section names mapped to lists of items, for example a template sensor:

```yaml
categories:
  Hot Lunch: [Chicken Tenders, Dinner Roll]
  Cold Lunch: [Turkey Wrap]
```

Every item is treated as a main item. Set `tomorrow_entity` to show tomorrow's menu. An optional `date` attribute (`YYYY-MM-DD`) is used to match the entity to a day.

## Examples

**One school per tablet:**

```yaml
type: menu
entity: sensor.earhart_menu_lunch_today
title: Earhart Lunch
```

**Switch to tomorrow's menu after school:**

```yaml
type: menu
entity: sensor.sunnyside_menu_lunch_today
title: Sunnyside Lunch
switch_at: '15:00'
```

**Show every section:**

```yaml
type: menu
entity: sensor.sunnyside_menu_lunch_today
hide_sections: []
```

## Styling

The background uses the `--menu-widget-background` CSS variable, or `background` on the widget.
