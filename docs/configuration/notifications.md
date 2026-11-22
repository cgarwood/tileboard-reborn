# Notifications

Home Assistant can show text notifications on your dashboards: a banner across the top of the screen for everyday messages, or a large card that stays until someone dismisses it for urgent ones. Notifications also show over the screensaver.

## Sending a Notification

Fire a `tileboard` event with `command: notify` from an automation or script:

```yaml
actions:
  - event: tileboard
    event_data:
      command: notify
      title: Laundry
      message: The washer is done
      icon: mdi-washing-machine
```

| Key        | Description                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `message`  | The notification text. Line breaks are kept. (`message` or `title` is required.)                                       |
| `title`    | Bold heading above the message.                                                                                        |
| `level`    | `info` (default), `warning` or `critical`. See below.                                                                  |
| `icon`     | MDI icon, e.g. `mdi-garage-open`. Defaults to an icon for the level.                                                   |
| `duration` | Seconds the banner stays on screen (`info` and `warning` only). Defaults to the `notifications.duration` setting.      |
| `target`   | Which dashboards show it: one name or a list. Leave it out to show it on every dashboard. See [Targeting](#targeting). |

This is a built-in command: you don't need to add it to your [`events`](events.md) list. You can try it from **Developer Tools → Events** with `tileboard` as the event type.

## Levels

- **`info`** and **`warning`** slide in as a banner at the top of the screen (blue or orange). A bar along the bottom edge shows how long it will stay. Tap it to dismiss it early. If several arrive together, they're shown one after another.
- **`critical`** covers the screen with a large red card that stays until someone taps **Dismiss**. Use it for things that need attention now, like a smoke alarm or a water leak. If more than one is waiting, the card says how many more there are.

Both appear over the screensaver without stopping it.

## Targeting

`target` sends a notification to specific dashboards. Each name can be:

- the name of the config on the TileBoard server (the `<name>` in `?config=<name>`),
- the config's top-level `id`, or
- the device's TileBoard ID, shown in **Device Info** (top bar menu ⋮).

```yaml
- event: tileboard
  event_data:
    command: notify
    message: Bedtime in 15 minutes
    target: [kids_room, playroom]
```

## History

A bell appears in the top bar once a notification has arrived, with a count of unread ones. Tap it, or choose **Notifications** in the top bar's menu, to see the last 50 notifications. New ones are marked with a dot and count as read once you close the list. A notification also counts as read when you tap its banner or dismiss its critical card. **Clear** empties the list.

History is kept on the tablet, so it survives reloads and config changes.

## Settings

```yaml
notifications:
  duration: 15 # seconds a banner stays up (default 10)

layout:
  header:
    notifications: false # hide the bell (the menu item still works)
```

Set `notifications: false` to ignore notifications on a dashboard.

## Notes

- Home Assistant only sends custom events like `tileboard` to administrator accounts, so the dashboard has to be logged in as an administrator to receive notifications.
- Notifications sent while the dashboard is disconnected from Home Assistant are missed.
- To also speak a message, pair the event with a text-to-speech or [Sendspin announcement](sendspin.md#announcements).
