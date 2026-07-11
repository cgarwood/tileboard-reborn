# Button Widget

A tappable button that triggers an action. By default, pressing the button calls the `button.press` service on the configured entity. Use `tap_action` to override with any other action.

**Default size:** 2×2

```yaml
type: button
entity: button.restart_server
title: Restart
```

## Properties

This widget has no widget-specific config keys beyond the [common properties](index.md#common-properties).

## Default Behavior

When no `tap_action` is configured, tapping calls `button.press` on the widget's `entity`.

## Custom Actions

Use `tap_action` to override with any action type:

```yaml
type: button
title: Good Night
icon: mdi-weather-night
tap_action:
  action: service
  service: scene.turn_on
  data:
    entity_id: scene.good_night
```

```yaml
type: button
title: Cameras
icon: mdi-cctv
tap_action:
  action: navigate
  page: cameras
```

See [Actions](../actions.md) for all available action types.

## Examples

**Button with hold action:**

```yaml
type: button
  title: Quack
  icon: mdi-duck
  grid:
    width: 1
    height: 1
  background: orange
  tap_action:
    - action: service
      service: light.toggle
      data:
        entity_id: light.entryway_light
        brightness: 50
  hold_action:
    - action: more_info
      entity: light.entryway_light
```

**Mini Button with javascript action:**

```yaml
type: button
grid:
  width: 1
  height: 1
icon: mdi-brightness-5
title: Dim
tap_action:
  - action: javascript
    data: 'fully.setScreenBrightness(10);'
```
