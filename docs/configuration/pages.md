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
