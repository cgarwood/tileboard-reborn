# TileBoard Reborn: Config Reference for AI Agents

<!--
Condensed, machine-oriented copy of docs/configuration/. Keep it in sync:
whenever a page under docs/configuration/ changes, update the matching section here.
No prose, no screenshots. One line per option. Notation:
  key: type = default. description
  "dyn" = dynamic prop: static string | state map {state: value, default: value} | "{{ js expr }}"
  *required*
-->

Home Assistant dashboard for wall tablets. Config is YAML, parsed by HA's loader (`!include`, `!include_dir_merge_list`, `!secret`, etc. work). One folder per display: `configs/<name>/config.yaml`, served at `/config/<name>`. `GET /api/configs` lists them as `[{name, title}]` (title = the config's `name`) for the onboarding dropdown. `?config=<name>` in the page URL (before or after the `#`) loads that config and remembers it. Full user docs: `docs/configuration/`.

## Shared concepts

**Dynamic props ("dyn")**: three forms.
- Static: `background: "rgb(30,50,80)"`
- State map: `background: { on: "#4caf50", off: "#333", default: "#333" }`. Lookup is `map[state] ?? map.default`.
- Template: `"{{ state === 'on' ? 'a' : 'b' }}"`. It is JavaScript, not Jinja. Scope: `state`, `attributes`, `entity(id)` (returns the entity object), `states` (all entities keyed by id). Re-evaluates when a read entity changes. If it mentions `Date`, it also re-evaluates every minute.
- In YAML, single-quote templates that contain regex backslashes.

**Visibility** (widgets, sections, pages, custom slides):
```yaml
visibility:
  match: all            # all (AND, default) | any (OR)
  conditions:
    - entity: sensor.x  # required for every type except template
      state: "on"       # or: not: "off" | above: 60 | below: 95 (numeric)
    - template: "{{ Number(states['sensor.n'].state) > 0 }}"
```
Hidden widgets and sections are removed from the DOM. A hidden page is only removed from the nav rail and can still be reached by URL or a `navigate` action.

**Icons**: MDI names with the `mdi-` prefix (`mdi-home`).

## Top level (`config.yaml`)

```yaml
name: My Dashboard            # *required*
ha_url: http://ha.local:8123  # *required*
grid_size: 64                 # px per grid cell (optional)
layout: {...}                 # orientation / nav position (optional)
pages: [...]                  # *required*
screensaver: {...}
restrictions: {...}
resources: [...]
weather_alerts: {entity}
sendspin: {server, name}
events: [{command, action}]
```

## Pages

Page keys: `id` (used in URL), `name` (toolbar), `icon` (nav rail), `visibility`, `sections` (list; the string `"break"` starts a new row), `grid_size` (overrides global), `background` (`{color, image, style}`), `toolbar_background` (string/expr), `nav_background` (string/expr; nav rail or bottom bar; the bottom bar falls back to `toolbar_background`).

Layout (top-level `layout`):
- `orientation: auto|landscape|portrait = auto`. `auto` follows the device and updates on rotation. Portrait: sections in a row wrap and the page scrolls vertically; screensaver slides use portrait layouts. A forced value also applies to the screensaver.
- `nav_position: auto|left|bottom = auto`. `auto` = `left` rail in landscape, `bottom` bar in portrait. Bottom bar background: page `nav_background` → `toolbar_background` → `--nav-bar-background` CSS var (default `var(--toolbar-background)`).

Section keys: `name` (header label), `width` (grid columns, default 4), `widgets` (list), `visibility`, `style` (inline CSS object), `name_style` (inline CSS object for the header).

## Widgets: common keys

| Key | Type | Notes |
|---|---|---|
| `type` | string | *required* |
| `entity` | string | HA entity id |
| `title` | dyn | defaults to friendly name |
| `subtitle` | dyn | |
| `background` | dyn | color or any CSS background |
| `icon` | dyn | |
| `icon_color` | dyn | |
| `state_badge` | dyn | overrides badge text |
| `class` | dyn | extra CSS class |
| `style` | object | inline CSS |
| `grid` | `{width, height}` | grid units; overrides the type's default size |
| `restriction` | string | id from `restrictions` |
| `visibility` | object | see above |
| `tap_action` / `hold_action` | action or list | see Actions |
| `more_info` | object | see More-info |

### Widget types

Size is the default `width×height`. Tap/hold defaults are listed under Actions.

- **`sensor`** (2×2): state plus unit. `chart`: absent = no chart, `false` = disabled, `{}`/`null` = defaults, or `{hours=24, min, max, smoothing=0.3 (0–1), color (dyn, default white)}`. The chart is a decorative background sparkline.
- **`sensor_icon`**: icon plus a state badge (top right, with unit). `icon_color` defaults to white. Auto-icon order: entity `icon` attribute, then device class (state-aware for binary_sensor/cover), then domain fallback.
- **`button`** (2×2): no extra keys. Default tap is `button.press` on `entity`. Often used without an entity, with a custom `tap_action`.
- **`switch`** (2×2): no extra keys. Tap calls `homeassistant.toggle`.
- **`light`** (2×2): `step` = 10. Brightness % change for the on-widget +/− controls. Badge shows brightness.
- **`climate`** (4×2): `features: {mode=true, setpoint=true, fan_mode=true}`. Layout depends on size: compact (small), wide (width ≥ 4), vertical (height ≥ 4). In `heat_cool` mode, +/− moves both setpoints.
- **`camera`** (2×2): `stream_mode` = `snapshot` | `stream` (HLS). `snapshot_interval` = 5 (seconds). Tap opens fullscreen.
- **`weather`** (2×4): no extra keys. Layouts are compact, wide (w ≥ 4, horizontal forecast) or vertical (h ≥ 4, forecast list).
- **`calendar`** (4×4): `calendars`: list of `{entity*, color, name}`. `color` defaults to the entity's color attribute, then a rotating palette. Tapping an event opens an event dialog.
- **`fan`** (2×2): no extra keys. Tap toggles. +/− change speed %.
- **`number`** (2×2): works with `number` / `input_number`. Step, min and max come from entity attributes. +/− step the value. Tap opens a value prompt.
- **`lock`** (2×2): no extra keys. Tap calls `lock.lock`/`lock.unlock`. States: locked, unlocked, locking, unlocking, jammed. Usually paired with `restriction`.
- **`list`** (4×4): `items`: list of rows. Row keys: `entity`, `name` (dyn), `caption` (dyn), `icon` (dyn), `state` (dyn, right-hand text), `restriction`, `refresh_interval` (ms; only needed for faster-than-minute templates), `features`: list of
  - `brightness_slider`
  - `color_presets: { presets: [{name, color_temp (K) | rgb: [r,g,b]}] }`
- **`menu`** (4×4): a day's menu, such as a school lunch. Keys: `entity`*, `source` = `nutrislice` | `sections`, `tomorrow_entity` (nutrislice default: `entity` with `_today` replaced by `_tomorrow`), `switch_at` = `"00:00"` (HH:MM; time from which tomorrow is shown), `fallback_to_tomorrow` = true, `hide_sections` (case-insensitive; nutrislice default `[Extra Extra, Milk & Condiments]`), `attribute` = `categories` (sections source only). A `date` attribute (YYYY-MM-DD) on the entity is used to match it to a day. The `sections` source expects an attribute shaped as `{SectionName: [items]}`. Tap opens a full-day dialog (replaced if `tap_action` is set). CSS var: `--menu-widget-background`.

## Actions

`tap_action` / `hold_action` take one action or a list (run in order). Setting `tap_action` replaces the widget's default tap. `action: none` disables the gesture.

| `action` | Keys |
|---|---|
| `service` | `service` (`domain.service`), `data` |
| `navigate` | `page` (page id) or `url` (external) |
| `more_info` | `entity` (optional; defaults to widget entity) |
| `none` | — |
| `screensaver` | — (activates it) |
| `event` | `event` (type), `data` (fires an HA event) |
| `javascript` | `data` (JS string, not a template). The only variable in scope is `data`: the event data when run from `events`, `{}` otherwise. Example (Fully Kiosk API): `fully.setScreenBrightness(10)` |

Action `data` fields are never templated.

Defaults:

| Widget | Tap | Hold |
|---|---|---|
| switch, fan, lock | toggle | more-info |
| light | toggle | more-info |
| button | `button.press` | more-info |
| number | value prompt | more-info |
| camera | fullscreen | none |
| sensor, sensor_icon, weather | none | more-info |
| menu | full-day dialog | more-info |

## More-info dialog

The view depends on the entity's domain: `light` (toggle, brightness, color temp), `climate` (modes, setpoints, fan mode), `number`/`input_number` (slider, +/−), `weather` (conditions plus Daily/Hourly/Twice Daily tabs). Every other domain gets the state plus a history chart if the entity has a unit of measurement.

`more_info` keys: `disabled` = false, `entity_id` (show another entity), `title` (dyn), `subtitle` (dyn), `header_background` (dyn), `chart` (`false` hides the chart), `chart_hours` = 24, `chart_min`, `chart_max`.

## Screensaver

```yaml
screensaver:
  timeout: 300            # *required*, seconds idle before it starts
  media_source: 'media-source://media_source/local/...'  # *required*, image folder
  slide_duration: 5       # seconds per image; info slides default to 2x this
  weather_entity: weather.home
  calendars: [{entity*, name, color}]  # "Today's" / "Tomorrow's Events" slides, shown only when there are events
  menus: [...]            # one slide each; same keys as the menu widget, plus `title` and `background`
  custom_slides: [...]
  backgrounds: {weather, calendar, menu, custom}
```

**custom_slides** entry keys: `entity` (slide is hidden while it is unavailable/unknown), `header`, `icon`, `title`, `text`, `footer` (each takes text, a state map or a template), `html` (replaces the card layout; template output is HTML-escaped), `css` (global while the slide shows, so scope it with `class`), `class`, `background`, `visibility`, `duration` (seconds; default 2× `slide_duration`). The slide is hidden when `text` (or `title` if there is no text) resolves to empty. Content is centred with room for the clock at the bottom. Override the background with `.your-class.custom-slide { background: ... }`.

**Backgrounds** values: an image URL (`/media/...` from the server's `media` folder, or `https://`), a state map (`weather` matches the weather condition; `menu` and `custom` match the slide's entity; `calendar` only uses `default`), a template, or `false` (gradient only). Weather, calendar and menu slides have built-in photos. Custom slides have none. If an image fails or nothing matches, the built-in photo is used.

## Restrictions

```yaml
restrictions:
  <id>:                       # referenced by widget/list-row `restriction`
    name: Child Lock
    conditions: [{entity, state}]   # optional; if omitted, the restriction always applies
    pin: { code: 1234, message: "..." }   # numeric code
    # or
    confirm: { message: "..." }
    unlock_time: 5            # seconds unlocked after success; default relocks immediately
```

## Resources

```yaml
resources:
  - url: /local/theme.css          # /local/ = server's www folder (data/www/ in Docker)
  - url: https://fonts.googleapis.com/css2?family=X
    type: css                      # required when the URL doesn't end in .css
```
Stylesheets load in order after the app styles, so they override them. A reload applies changes to the list. Failed loads only log a warning. `type: module` is reserved for future custom widgets and is skipped.

**Theming CSS variables**: `--page-background`, `--toolbar-background`, `--nav-bar-background`, `--text-light`/`-dark`/`-lighter`, `--widget-title-color`, `--widget-subtitle-color`, `--widget-border-radius`, `--section-padding`, `--section-gap`, `--{type}-widget-background`, `--{type}-widget-background-on` (sensor, switch, light, fan), `--climate-heating-background`, `--climate-cooling-background`, `--lock-widget-background-locked`, `--lock-widget-background-jammed`.

**Selectors**: `.widget-{type}` and the state classes `state--on`, `state--off` and `state--{slugified-state}`.

## Weather alerts

```yaml
weather_alerts:
  entity: sensor.weatheralerts_1   # *required*; sensor from the weatheralerts HACS integration (NWS, US only)
```
Reads the sensor's `alerts` attribute. While alerts are active, a footer bar on every page cycles through them every 7 seconds (icon, event name, expiry), and the screensaver shows one badge per alert. Tapping either opens a dialog with the headline, description and instructions. Each alert gets a CSS class from its event name, lowercased with dashes (`flood-watch`). Built-in colors cover thunderstorm, tornado, flood and winter storm types; anything else uses the default blue. Override or add colors with a stylesheet, e.g. `.heat-advisory { background-color: ... }`.

## Sendspin

```yaml
sendspin:
  server: http://music-assistant.local:8095   # *required*, Sendspin server base URL (e.g. Music Assistant)
  name: Kitchen Tablet                        # *required*, player name shown in the server
```
The tablet registers as a Sendspin speaker. Its player ID is generated, not configured: `fk-<Fully Kiosk device id>` in Fully Kiosk, otherwise a random UUID kept in `localStorage`. A now-playing bar (prev/play-pause/next, can be minimized) appears while media is present. Tapping the title opens a player with shuffle, repeat and volume. The player reconnects automatically.

## Events

```yaml
events:
  - command: show_cameras      # *required*, matched against the event's data.command
    action:                    # *required*, one action or a list
      action: navigate
      page: cameras
```
Listens for HA events of type `tileboard`. Fire one with `event: tileboard`, `event_data: {command: show_cameras, ...}`. Unmatched commands are ignored. Every open dashboard with a matching `command` reacts; there is no per-device targeting, so use a command name unique to one display's config. Extra event-data fields reach `javascript` actions as `data` (`data.brightness`). Other action types use their config as written. `more_info` does nothing here. Events fired while disconnected are missed. HA only sends custom events to admin users.
