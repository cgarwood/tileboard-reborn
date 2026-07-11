# Actions

Actions define what happens when a widget is tapped or long-pressed. They are configured via `tap_action` and `hold_action` on any widget.

Both properties accept a single action or a list of actions. When a list is provided, actions are executed in order.

```yaml
# Single action
tap_action:
  action: service
  service: light.toggle
  data:
    entity_id: light.living_room

# Multiple actions
tap_action:
  - action: service
    service: scene.turn_on
    data:
      entity_id: scene.movie_mode
  - action: navigate
    page: living-room
```

## Default Behavior

If `tap_action` is not set, each widget type has its own default behavior:

| Widget                         | Default tap            | Default hold     |
| ------------------------------ | ---------------------- | ---------------- |
| switch / fan / lock            | `homeassistant.toggle` | more-info dialog |
| light                          | toggle on/off          | more-info dialog |
| button                         | `button.press`         | more-info dialog |
| number                         | open value prompt      | more-info dialog |
| camera                         | open fullscreen        | —                |
| sensor / sensor_icon / weather | nothing                | more-info dialog |

Set `tap_action: none` or `hold_action: none` to explicitly disable a default behavior.

---

## Action Types

### `service`

Calls a Home Assistant service.

```yaml
tap_action:
  action: service
  service: light.turn_on
  data:
    entity_id: light.living_room
    brightness_pct: 80
```

| Key       | Type   | Description                             |
| --------- | ------ | --------------------------------------- |
| `service` | string | Service name in `domain.service` format |
| `data`    | object | Service call parameters                 |

---

### `navigate`

Navigates to another dashboard page or an external URL.

```yaml
# Go to a dashboard page
tap_action:
  action: navigate
  page: upstairs

# Open an external URL
tap_action:
  action: navigate
  url: https://example.com
```

| Key    | Type   | Description                        |
| ------ | ------ | ---------------------------------- |
| `page` | string | Dashboard page `id` to navigate to |
| `url`  | string | External URL to open               |

---

### `more_info`

Opens the more-info dialog for an entity. Defaults to the widget's own entity if `entity` is omitted.

```yaml
tap_action:
  action: more_info

# Or open the dialog for a different entity
tap_action:
  action: more_info
  entity: sensor.outdoor_temperature
```

| Key      | Type   | Description                                              |
| -------- | ------ | -------------------------------------------------------- |
| `entity` | string | Entity ID to show (optional — defaults to widget entity) |

---

### `none`

Does nothing and prevents the widget's default behavior from running.

```yaml
# Disable tap entirely
tap_action:
  action: none
```

---

### `screensaver`

Activates the screensaver.

```yaml
tap_action:
  action: screensaver
```

---

### `event`

Fires a Home Assistant event.

```yaml
tap_action:
  action: event
  event: my_custom_event
  data:
    room: living_room
```

| Key     | Type   | Description        |
| ------- | ------ | ------------------ |
| `event` | string | Event type name    |
| `data`  | object | Event data payload |

---

### `javascript`

Executes arbitrary JavaScript in the browser. This can be useful for controlling tablets running Fully Kiosk Browser using the Fully Kiosk javascript API.

```yaml
tap_action:
  action: javascript
  data: "console.log('state is', state)"
```

| Key    | Type   | Description                |
| ------ | ------ | -------------------------- |
| `data` | string | JavaScript code to execute |

The code runs with access to `state`, `attributes`, `entity(id)`, and `states` — the same variables available in `{{ }}` expressions.

---

## Examples

**Toggle a light, then navigate to the lighting page:**

```yaml
tap_action:
  - action: service
    service: light.toggle
    data:
      entity_id: light.living_room
  - action: navigate
    page: lighting
```

**Open more-info on tap, activate a scene on hold:**

```yaml
tap_action:
  action: more_info
hold_action:
  action: service
  service: scene.turn_on
  data:
    entity_id: scene.relax
```

**Disable long-press more-info on a sensor:**

```yaml
type: sensor
entity: sensor.temperature
hold_action:
  action: none
```
