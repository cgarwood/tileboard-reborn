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
Hidden widgets and sections are removed from the DOM, and later widgets move up (use `conditional` to keep the space). A hidden page is only removed from the nav rail and can still be reached by URL or a `navigate` action.

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
notifications: {duration} | false
```

## Pages

Page keys: `id` (used in URL), `name` (toolbar), `icon` (nav rail), `visibility`, `sections` (list; the string `"break"` starts a new row), `grid_size` (overrides global), `background` (`{color, image, style}`), `toolbar_background` (string/expr), `nav_background` (string/expr; nav rail or bottom bar; the bottom bar falls back to `toolbar_background`).

Layout (top-level `layout`):
- `orientation: auto|landscape|portrait = auto`. `auto` follows the device and updates on rotation. Portrait: sections in a row wrap and the page scrolls vertically; screensaver slides use portrait layouts. A forced value also applies to the screensaver.
- `nav_position: auto|left|bottom = auto`. `auto` = `left` rail in landscape, `bottom` bar in portrait. Bottom bar background: page `nav_background` → `toolbar_background` → `--nav-bar-background` CSS var (default `var(--toolbar-background)`).
- `header.battery: bool = true`. Fully Kiosk battery level and charging status in the top bar. Set false on battery-less devices that report a fake level.
- `header.issues: bool = true`. Red/amber badge with a count in the top bar when there are issues; opens the Issues dialog (also in the ⋮ menu). See Issues.
- `header.notifications: bool = true`. Bell with unread count, shown once a notification has arrived; opens the history. See Notifications.
- `header.volume: bool | list = true`. Fully Kiosk device volume sliders (with mute toggle) in the header ⋮ menu. `true` = `[media]`; a list picks streams/order from `media|notification|alarm|system|ring`; `false` hides. Sendspin/web audio use `media`.

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

Small tiles (switch, light, fan, lock, button, sensor_icon, sensor, number): 1×1 shows a smaller icon/value and the title only. One cell high and 2+ wide is a single row: icon left, subtitle and title beside it, state badge inline on the right.

- **`sensor`** (2×2): state plus unit. `chart`: absent = no chart, `false` = disabled, `{}`/`null` = defaults, or `{hours=24, min, max, smoothing=0.3 (0–1), color (dyn, default white)}`. The chart is a decorative background sparkline in the bottom 40%, drawn faintly (fill 20%, line 40% opacity of `color`). One-row tile: title left, value right, no chart.
- **`sensor_icon`**: icon plus a state badge (top right, with unit). Binary sensor states are worded by device class like HA (door/window/opening/garage_door Open/Closed, motion/occupancy/smoke/… Detected/Clear, presence Home/Away, connectivity Connected/Disconnected, problem Problem/OK, moisture Wet/Dry, lock Unlocked/Locked, …); other on/off/unavailable/unknown are capitalised. `state_badge` overrides it; templates see the raw state. The same wording is used by the sensor value, list rows and more-info. `icon_color` defaults to white. Auto-icon order: entity `icon` attribute, then device class (state-aware for binary_sensor/cover), then domain fallback.
- **`button`** (2×2): no extra keys. Default tap is `button.press` on `entity`. Often used without an entity, with a custom `tap_action`.
- **`switch`** (2×2): no extra keys. Tap calls `homeassistant.toggle`.
- **`light`** (2×2): `step` = 10. Brightness % change for the on-widget +/− controls. Badge shows brightness. One-row tile: +/− in a row when width ≥ 3, hidden at 2×1.
- **`climate`** (4×2): `features: {mode=true, setpoint=true, fan_mode=true}`. Layout depends on size: compact (small), wide (width ≥ 4), vertical (height ≥ 4). In `heat_cool` mode, +/− moves both setpoints.
- **`camera`** (2×2): `stream_mode` = `snapshot` | `stream` (HLS). `snapshot_interval` = 5 (seconds). Tap opens fullscreen.
- **`weather`** (2×4): no extra keys. Layouts are compact, wide (w ≥ 4, horizontal forecast) or vertical (h ≥ 4, forecast list).
- **`calendar`** (4×4): `calendars`: list of `{entity*, color, name}`. `color` defaults to the entity's color attribute, then a rotating palette. Tapping an event opens an event dialog.
- **`fan`** (2×2): no extra keys. Tap toggles. +/− change speed %. One-row tile: +/− in a row when width ≥ 3, hidden at 2×1.
- **`number`** (2×2): works with `number` / `input_number`. Step, min and max come from entity attributes. +/− step the value. Tap opens a value prompt. One-row tile: value over title on the left, +/− in a row on the right, no badge.
- **`lock`** (2×2): no extra keys. Tap calls `lock.lock`/`lock.unlock`. States: locked, unlocked, locking, unlocking, jammed. Usually paired with `restriction`.
- **`list`** (4×4): `items`: list of rows. Row keys: `entity`, `name` (dyn), `caption` (dyn), `icon` (dyn), `state` (dyn, right-hand text), `restriction`, `refresh_interval` (ms; only needed for faster-than-minute templates), `features`: list of
  - `brightness_slider`
  - `color_presets: { presets: [{name, color_temp (K) | rgb: [r,g,b]}] }`
- **`menu`** (4×4): a day's menu, such as a school lunch. Keys: `entity`*, `source` = `nutrislice` | `sections`, `tomorrow_entity` (nutrislice default: `entity` with `_today` replaced by `_tomorrow`), `switch_at` = `"00:00"` (HH:MM; time from which tomorrow is shown), `fallback_to_tomorrow` = true, `hide_sections` (case-insensitive; nutrislice default `[Extra Extra, Milk & Condiments]`), `attribute` = `categories` (sections source only). A `date` attribute (YYYY-MM-DD) on the entity is used to match it to a day. The `sections` source expects an attribute shaped as `{SectionName: [items]}`. Tap opens a full-day dialog (replaced if `tap_action` is set). CSS var: `--menu-widget-background`.
- **`conditional`** (2×2): a fixed slot that shows different widgets by condition. It has no card or actions of its own. Keys: `cases`: list of `{conditions, match, widgets, grid}` (`conditions`/`match` as in visibility; no conditions = always matches; first match wins), `default`: list of widgets shown when no case matches. With no match and no `default`, the slot stays empty but keeps its size. Children are laid out on an inner grid that lines up with the section's cells, each sized by its own `grid`; overflow is clipped. The slot uses the active case's `grid`, falling back to the conditional's `grid`, so only cases with their own `grid` reflow the section. Children's `visibility` reflows only inside the slot. `visibility` on the conditional removes the whole slot. Can be nested.
- **`html`** (2×2): custom markup in a widget card. Keys: `html`* (string, template or state map; a state-map entry may contain templates; `{{ }}` results are HTML-escaped, the rest is used as written; fills the card with no padding), `css` (scoped to this widget: every selector is prefixed with a widget class, `:scope` = the card itself; `@media`/`@supports` work; `@keyframes` names stay global), `entity` (optional; sets `state`/`attributes`). `title`/`subtitle` are drawn bottom-left like built-in widgets only when set (no entity-name fallback for `title`); `icon` is not drawn. `<script>` doesn't run. No default tap; `tap_action`/`hold_action` work as usual. Icons: `<i class="mdi mdi-NAME"></i>`. Defaults: `--html-widget-background`, white text, headings/paragraphs with no margin (`h1` 1.6em, `h2` 1.35em, `h3` 1.15em, others 1em). The standard layout classes work in the markup for a native tile look: `state-area` (centered), `state`, `state-badge` (top-right), and `label-group` (bottom-left) holding `subtitle`/`title` for hand-made labels. Don't use `cqw`/`cqh` (needs a newer WebView than Chrome 100).
- **`alert`** (4×1): colored banner: icon, message, optional label on the right. Keys: `level` (dyn; `info` default | `success` (`good`, `ok`) | `warning` (`warn`) | `error` (`bad`, `critical`, `danger`)), `message` (dyn; default entity state; wraps to 2 lines, 4 when height ≥ 2), `title` (dyn; small uppercase label on the right; no entity-name fallback), `icon` (dyn; default per level), `pulse` (bool; brightness pulse while `error`). Color = `--level-{level}` (shared with notifications); `background` overrides. Card gets `level--{level}` class. Height ≥ 2 = larger icon/text. No default tap.
- **`gauge`** (2×2): SVG ring/arc with value + unit centred; standard title/subtitle (title defaults to entity name). Keys: `min` = 0, `max` = 100 (out-of-range clamps), `shape` = `ring` (full circle from top) | `arc` (270°, open at bottom), `segments`: list of `{from, color}` (highest `from` reached wins; any order), `color` (dyn; overrides segments), `decimals` (round; default shows the raw state), `unit` (dyn; default entity unit), `value` (dyn; instead of entity state). Colors: level names (as alert, incl. aliases; drawn with the lighter `--level-*-bright` shades) or CSS colors; default `info`. Non-numeric value = empty gauge + "—". CSS var: `--gauge-widget-background`.
- **`hero`** (8×3): large welcome banner. Keys: `title` (dyn; default time-of-day greeting), `subtitle` (dyn; default "Weekday, Month D · h:mm"; both refresh each minute), `message` (dyn; extra line under the subtitle), `weather` (weather entity on the side: icon, temp, condition · humidity; also drives the overcast background), `side` (instead of weather: `{entity, value, unit, icon, label}` stat, or `{widget: {...any widget}, width: 2}` column in cells), `chips`: list of `{text (dyn; default entity state + unit), icon, entity (sets state/attributes in chip templates), color (level name or CSS), visibility, tap_action (no default), hold_action (default: more-info for the chip's entity)}`; chip `more_info` opens the chip's entity unless the action names one; chip gestures don't trigger the hero's own; the hero's `restriction` applies to chips. `sun_entity` = `sun.sun`. Background (unless `background` is set): class `hero--day` (sun > 6°), `hero--dawn`/`hero--dusk` (within 6°, by `rising`), `hero--night` (< -6°), plus `hero--overcast` when `weather` is cloudy/rainy/snowy/fog/stormy; themes restyle `.widget-hero.hero--night` etc. Height 2 = smaller text, ≥ 4 = bigger.

## Actions

`tap_action` / `hold_action` take one action or a list (run in order), on every widget type. Setting `tap_action` replaces the widget's default tap. `action: none` disables the gesture. Actions with no other keys can be written as a bare string: `tap_action: more_info` (also `none`, `screensaver`).

| `action` | Keys |
|---|---|
| `service` | `service` (`domain.service`), `data` |
| `navigate` | `page` (page id) or `url` (external) |
| `more_info` | `entity` (optional; defaults to widget entity; another entity gets its own name and default dialog settings) |
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

**Theming CSS variables**: `--page-background`, `--toolbar-background`, `--nav-bar-background`, `--header-menu-background`, `--text-light`/`-dark`/`-lighter`, `--widget-title-color`, `--widget-subtitle-color`, `--widget-border-radius`, `--section-padding`, `--section-gap`, `--{type}-widget-background`, `--{type}-widget-background-on` (sensor, switch, light, fan), `--climate-heating-background`, `--climate-cooling-background`, `--level-info`/`-success`/`-warning`/`-error` (alert, notifications); `--level-*-bright` (lighter shades, gauge rings), `--lock-widget-background-locked`, `--lock-widget-background-jammed`.

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

Announcements: playback with no track title (e.g. `music_assistant.play_announcement`) shows a bullhorn and "Announcement", hides prev/next/time, and restores the bar's earlier minimized state when it ends. To show the TTS text, fire `event: tileboard` with `event_data: {command: sendspin_announcement, message: "..."}` just before the announcement. This is a built-in command, so no `events` entry is needed. A tablet shows the message only if an announcement starts on it within 60s; queued messages show in order, one per announcement.

## Events

```yaml
events:
  - command: show_cameras      # *required*, matched against the event's data.command
    action:                    # *required*, one action or a list
      action: navigate
      page: cameras
```
Listens for HA events of type `tileboard`. Fire one with `event: tileboard`, `event_data: {command: show_cameras, ...}`. Unmatched commands are ignored (`notify` and `sendspin_announcement` are built in, see Notifications and Sendspin). Every open dashboard with a matching `command` reacts; there is no per-device targeting, so use a command name unique to one display's config. Extra event-data fields reach `javascript` actions as `data` (`data.brightness`). Other action types use their config as written. `more_info` needs an `entity` here (no widget to default to). Events fired while disconnected are missed. HA only sends custom events to admin users.

## Issues

Problems are shown on the dashboard, not just the console. Issues dialog (header badge or ⋮ menu) lists: template compile/runtime errors (with the expression), rejected service calls/events and taps while disconnected, `javascript` action errors, unknown action types, failed Reload Config, unparseable widget `css`, bad `resources` entries/stylesheets, screensaver image load failures, tileboard event subscription failures, and HA/Sendspin disconnected for more than 10 s (removed when reconnected). Each issue is listed once; template/config issues clear on config reload; max 50. Only failures of something the user just did (tap, Reload Config) also show a toast at the top. The server reports config load errors (YAML file/line/column, missing secret) as `{ "error": "..." }`; at startup a failed config load shows an error page that retries after 5/10/20/30 s then every 60 s, with a button to the config picker. A failed Reload Config keeps the current config.

## Notifications

Built-in `tileboard` event command `notify` (no `events` entry needed). Event data: `message`, `title` (one required), `level` = `info` | `warning` | `critical`, `icon` (mdi-*; default per level), `duration` (s, banner only), `target` (name or list; matches the server config name from `?config=<name>`, the config's top-level `id`, or the TileBoard ID from Device Info; omitted = every dashboard).
```yaml
- event: tileboard
  event_data: {command: notify, title: Laundry, message: Washer is done, target: kitchen}
```
info/warning: banner at the top, timed (default 10 s, `notifications.duration`), tap to dismiss, queued one at a time. critical: full-screen red card until Dismiss. Both show over the screensaver without stopping it. History: last 50, stored on the tablet (survives reloads), bell in the header with unread count (appears once one arrives; `header.notifications: false` hides it), also in the ⋮ menu. Read = banner tapped, critical dismissed, or history list closed. `notifications: false` ignores them. Needs an HA admin user (custom events).
