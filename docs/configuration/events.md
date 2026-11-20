# Events

Events let Home Assistant control your dashboards. TileBoard listens for Home Assistant events of type `tileboard`. When one arrives, it looks up the event's `command` in your `events` list and runs the matching [actions](actions.md).

Use events for things like starting the screensaver at bedtime, jumping to the camera page when the doorbell rings, or dimming the screen from an automation.

## Example Configuration

```yaml
events:
  - command: screensaver
    action:
      action: screensaver
  - command: show_cameras
    action:
      action: navigate
      page: cameras
  - command: screen_brightness
    action:
      action: javascript
      data: 'fully.setScreenBrightness(data.brightness);'
```

| Key       | Type             | Description                                             |
| --------- | ---------------- | ------------------------------------------------------- |
| `command` | string           | Name to match against the event's `command` (required)  |
| `action`  | action or list   | One action, or a list run in order (required). See [Actions](actions.md). |

Events with a `command` that isn't in the list are ignored.

`sendspin_announcement` is a built-in command used by [Sendspin](sendspin.md#announcements) to show announcement text. It works without an entry in this list.

## Sending an Event from Home Assistant

Fire an event of type `tileboard` with `command` in its data, for example from an automation or script:

```yaml
automation:
  - alias: Doorbell shows cameras
    triggers:
      - trigger: state
        entity_id: binary_sensor.doorbell
        to: 'on'
    actions:
      - event: tileboard
        event_data:
          command: show_cameras
```

You can also test it from **Developer Tools → Events**: enter `tileboard` as the event type and `command: show_cameras` as the event data.

Every dashboard that is open and has a matching `command` reacts to the event. To send a command to one tablet only, give it a `command` name that only that display's config uses, such as `kitchen_screensaver`.

## Passing Data

Any other fields in the event data are passed to `javascript` actions as `data`, so one command can take arguments:

```yaml
# Home Assistant
- event: tileboard
  event_data:
    command: screen_brightness
    brightness: 40
```

```yaml
# TileBoard config
events:
  - command: screen_brightness
    action:
      action: javascript
      data: 'fully.setScreenBrightness(data.brightness);'
```

Other action types don't read the event data. Their settings are used exactly as written in the config.

## Notes

- `more_info` actions have no effect when run from an event.
- TileBoard only receives events while it is connected to Home Assistant. Events fired while it's disconnected are missed.
- Home Assistant only sends custom event types to administrator accounts. If nothing happens, check that the user TileBoard connects as is an administrator.
