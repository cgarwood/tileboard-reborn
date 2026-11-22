# Issues and Errors

TileBoard shows problems on the dashboard itself, so you can find a broken template or a failing button without opening the browser's developer tools.

## The Issues badge

When something needs attention, a badge with a count appears in the top bar, next to the connection status. It's red when at least one issue is an error and amber when there are only warnings. Tap it to open the **Issues** dialog, which lists each problem with where it came from, any details (such as the template that failed), and when it happened. The dialog is also in the top bar's menu (⋮), and its **Clear** button empties the list.

These are listed:

| Source         | Examples                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template       | A `{{ }}` template or `visibility` template that doesn't compile or throws when it runs. The failing expression is shown.                                              |
| Action         | A service call Home Assistant rejected (unknown service, invalid data), an action tapped while disconnected, a `javascript` action that threw, an unknown action type. |
| Config         | A failed **Reload Config**, widget `css` that can't be parsed.                                                                                                         |
| Home Assistant | Not connected for more than 10 seconds (with the reason, if there is one), sensor history that failed to load.                                                         |
| Sendspin       | Not connected for more than 10 seconds, the player failing to load or connect.                                                                                         |
| Resource       | A `resources` entry with a bad URL or unknown type, a stylesheet that failed to load.                                                                                  |
| Screensaver    | Screensaver images that couldn't be loaded from the media source.                                                                                                      |
| Events         | Subscribing to `tileboard` events failed.                                                                                                                              |

Each problem is listed once, however often it happens. Connection problems are removed as soon as the connection is back. Template and config issues are cleared when the config is reloaded. The list keeps the 50 most recent issues.

To hide the badge, set `header.issues` to `false`. Issues are still collected and can be opened from the menu.

```yaml
layout:
  header:
    issues: false
```

## Pop-up messages

When something you just did fails, such as tapping a button whose service call is rejected or choosing **Reload Config** when the config has an error, a short message also appears at the top of the screen. Problems that happen on their own, like template errors or a dropped connection, only appear in the badge, so a wall display isn't covered in messages.

## Config errors

When the TileBoard server can't read a config, for example because of a YAML syntax error or a missing `!secret`, it reports the reason, including the file, line and column for syntax errors.

- **At startup**, the dashboard shows the error on a full-screen page and retries on its own (after 5, 10, 20 and 30 seconds, then every minute). A tablet that boots before the server is up, or while you're fixing the config, recovers without anyone touching it. **Choose another config** goes to the config picker.
- **Reload Config** shows the error in a pop-up and keeps the current dashboard running on the config it already has.
