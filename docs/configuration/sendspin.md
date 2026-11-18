# Sendspin Audio Player

[Sendspin](https://www.sendspin-audio.com) is an audio streaming protocol supported by Music Assistant. With `sendspin` configured, the tablet joins your Sendspin server as a speaker. You can then play music to it from Music Assistant, on its own or grouped with other speakers in sync.

## Example Configuration

```yaml
sendspin:
  server: http://music-assistant.local:8095
  name: Kitchen Tablet
```

| Key      | Type   | Description                                                      |
| -------- | ------ | ---------------------------------------------------------------- |
| `server` | string | Address of the Sendspin server, such as your Music Assistant server (required) |
| `name`   | string | Player name shown in Music Assistant (required)                   |

## Player ID

Each tablet registers with a player ID that stays the same between visits, so Music Assistant recognizes it as the same speaker each time:

- In Fully Kiosk Browser, the ID is based on the Fully Kiosk device ID.
- In other browsers, a random ID is created on first load and saved in the browser. Clearing the browser's site data creates a new player.

## Now Playing Bar

While something is playing, a bar appears at the bottom of the screen with artwork, title, artist, progress, and previous, play/pause and next buttons.

- Tap the track title to open a larger player with shuffle, repeat and volume controls.
- Tap the down arrow to shrink the bar to a small music-note button. Tap the button to bring the bar back. The bar opens again by itself when playback starts.

If the server can't be reached, the tablet keeps retrying in the background and the rest of the dashboard works normally.

**Note:** browsers only allow audio after someone has interacted with the page. If audio doesn't play after the tablet loads, tap the screen once.
