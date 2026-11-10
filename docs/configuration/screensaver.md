# Screensaver

TileBoard Reborn includes a screensaver feature that can be configured to display a rotating series of images like a digital picture frame, along with current weather conditions, weather forecasts, upcoming calendar events, and menus.

## Example Configuration

```yaml
screensaver:
  # Timeout (in seconds) before the screensaver activates
  timeout: 300
  # Home Assistant media source containing pictures to display in the screensaver.
  media_source: 'media-source://media_source/local/tileboard/living_room'
  # Slide duration (in seconds) for each image
  slide_duration: 5
  # (Optional) Entity for current weather conditions and forecasts
  weather_entity: weather.nws
  # (Optional) Calendars to show today's and tomorrow's events from.
  calendars:
    - entity: calendar.family
    - entity: calendar.work
      name: Work
      color: '#1e88e5'
  # (Optional) Menus to show, one slide each.
  menus:
    - entity: sensor.sunnyside_menu_lunch_today
      title: Sunnyside Lunch
```

## Calendars

Each `calendars` entry takes `entity` (required), plus optional `name` and `color`, the same as the [calendar widget](widgets/calendar.md#calendar-entry-options). A "Today's Events" slide is shown when any calendar has events today, and a "Tomorrow's Events" slide when any has events tomorrow.

## Menus

Each `menus` entry adds a slide showing that day's menu with every section and its sides. It takes the same options as the [menu widget](widgets/menu.md#properties): `entity` (required), `title`, `source`, `tomorrow_entity`, `switch_at`, `fallback_to_tomorrow`, `hide_sections` and `attribute`. `title` defaults to the entity's friendly name.

The slide follows the same rules as the widget for choosing between today's and tomorrow's menu, and is left out when that day has no menu.
