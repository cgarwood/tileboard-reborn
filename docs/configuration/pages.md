# Pages

Pages are the top-level containers for your dashboard. Each page has a list of sections, and each section contains a grid of widgets.

## Page properties

| Key | Type | Description |
|-----|------|-------------|
| `id` | string | Unique identifier used in the URL |
| `name` | string | Display name shown in the toolbar |
| `icon` | string | MDI icon shown in the nav rail |
| `visibility` | object | Conditions that control whether the page appears in the nav rail |
| `sections` | list | Ordered list of sections (or `"break"` to start a new row) |
| `grid_size` | number | Grid cell size in pixels for this page (overrides global) |
| `background` | object | Page background (`color`, `image`, `style`) |
| `toolbar_background` | string / expression | Toolbar background color for this page |
| `nav_background` | string / expression | Page navigation background for this page (left rail or bottom bar). The bottom bar falls back to `toolbar_background`, then the `--nav-bar-background` CSS variable; the left rail has no background unless this is set. |

## Sections

A section is a named group of widgets rendered in a CSS grid column.

```yaml
sections:
  - name: Lights
    width: 4       # number of grid columns
    widgets:
      - type: light
        entity: light.living_room
      - type: light
        entity: light.bedroom
```

### Section properties

| Key | Type | Description |
|-----|------|-------------|
| `name` | string | Optional header label displayed above the section |
| `width` | number | Grid column count (default: 4) |
| `widgets` | list | List of widget configs |
| `visibility` | object | Conditions that control whether the section is rendered |
| `style` | object | Inline CSS applied to the section container |
| `name_style` | object | Inline CSS applied to the section header label |

### Section rows

Place the string `"break"` in the sections list to start a new horizontal row:

```yaml
sections:
  - name: Climate
    widgets: [...]
  - name: Lights
    widgets: [...]
  - "break"
  - name: Security
    widgets: [...]
```

In portrait orientation (see below), sections in a row also wrap onto a new line when they don't fit the screen width, and the page scrolls vertically. `"break"` still forces a new row.

## Layout and orientation

The top-level `layout` block controls how pages are arranged for landscape or portrait displays. Both options default to `auto`, so a config with no `layout` block adapts to the device and follows it when it rotates.

```yaml
layout:
  orientation: auto     # auto | landscape | portrait
  nav_position: auto    # auto | left | bottom
  header:
    battery: true
    volume: true        # true | false | list of streams
```

| Key | Default | Description |
|-----|---------|-------------|
| `orientation` | `auto` | `auto` follows the device's orientation. Set `landscape` or `portrait` to force one. |
| `nav_position` | `auto` | Where the page navigation goes. `auto` uses a rail on the `left` in landscape and a bar at the `bottom` in portrait. |
| `header.battery` | `true` | Show the device's battery level and charging status in the top bar. It only appears when the dashboard runs in Fully Kiosk Browser. Set `false` for devices without a battery that still report a fixed level, such as the Lenovo ThinkSmart View. |
| `header.volume` | `true` | Device volume sliders in the top bar's menu (⋮). They only appear when the dashboard runs in Fully Kiosk Browser. `true` shows only the media volume. A list picks which to show and their order, from `media`, `notification`, `alarm`, `system` and `ring`. `false` hides them. [Sendspin](sendspin.md) and other dashboard audio play at the media volume. |

In portrait:

- Sections wrap onto new lines instead of scrolling sideways.
- The page navigation is a bar along the bottom of the screen, above any weather alert footer. Its background matches the header: the page's `nav_background`, then its `toolbar_background`, then the `--nav-bar-background` CSS variable (default: `var(--toolbar-background)`).
- Screensaver slides switch to portrait layouts: the daily forecast becomes a vertical list, the hourly forecast becomes a 4×2 grid, and the menu slide uses a single column.

The forced `orientation` also applies to the screensaver, so `orientation: portrait` gives portrait slides even when the device reports landscape.

## Page visibility

The `visibility` property on a page controls whether it appears in the nav rail. The page is still accessible by direct URL or programmatic navigation — only the icon is hidden.

**Show a page in the nav only when a specific mode is active:**
```yaml
pages:
  - id: guest
    name: Guest
    icon: mdi-account
    visibility:
      conditions:
        - entity: input_boolean.guest_mode
          state: "on"
    sections:
      - widgets: [...]
```

**Always hide a page from the nav (e.g. a detail page only reached via navigation actions):**
```yaml
pages:
  - id: detail
    name: Detail
    icon: mdi-information
    visibility:
      conditions:
        - template: "{{ false }}"
    sections:
      - widgets: [...]
```

## Section visibility

The `visibility` property on a section uses the same condition syntax as [widget visibility](widgets/index.md#visibility). When a section is hidden it is removed from the DOM entirely.

**Show a section only when the house is occupied:**
```yaml
- name: Guest Controls
  visibility:
    conditions:
      - entity: binary_sensor.guest_mode
        state: "on"
  widgets:
    - type: light
      entity: light.guest_room
```

**Show a section when any of several sensors are active:**
```yaml
- name: Active Alerts
  visibility:
    match: any
    conditions:
      - entity: binary_sensor.smoke_alarm
        state: "on"
      - entity: binary_sensor.co_alarm
        state: "on"
  widgets:
    - type: sensor_icon
      entity: binary_sensor.smoke_alarm
    - type: sensor_icon
      entity: binary_sensor.co_alarm
```
