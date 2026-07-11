# Calendar Widget

Displays upcoming events from one or more Home Assistant calendar entities. Events are sorted by start time. Tapping an event opens a detail dialog with the full event information.

**Default size:** 4×4

```yaml
type: calendar
title: Calendar
calendars:
  - entity: calendar.home
  - entity: calendar.work
```

## Properties

| Key         | Type | Default | Description                             |
| ----------- | ---- | ------- | --------------------------------------- |
| `calendars` | list | —       | One or more calendar sources to display |

### Calendar entry options

| Key      | Type   | Default     | Description                                                                                                      |
| -------- | ------ | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `entity` | string | —           | Calendar entity ID (required)                                                                                    |
| `color`  | string | auto        | Color shown as a left-side bar on each event row. Defaults to the entity's color attribute or a rotating palette |
| `name`   | string | entity name | Override the calendar name shown on each event row                                                               |

## Event Display

Each event shows:

- A colored bar on the left edge (per calendar `color`)
- Event title
- Start time ("Today · 3:00 PM – 4:00 PM", "Mon, Jul 14", "All day")
- Calendar name on the right (when showing multiple calendars)

Tapping an event opens a dialog with the full title, date/time, location, description, and calendar name.

## Examples

**Single calendar:**

```yaml
type: calendar
title: Family
calendars:
  - entity: calendar.family
```

**Multiple calendars with colors:**

```yaml
type: calendar
title: Schedule
calendars:
  - entity: calendar.work
    color: '#1e88e5'
    name: Work
  - entity: calendar.personal
    color: '#43a047'
    name: Personal
  - entity: calendar.holidays
    color: '#e53935'
    name: Holidays
```
