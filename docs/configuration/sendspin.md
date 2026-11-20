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

## Announcements

Music Assistant announcements (`music_assistant.play_announcement`, for example a chime followed by text-to-speech) play on the tablet like any other audio. While one plays, the bar shows a bullhorn and "Announcement" instead of track details. If the bar was shrunk before the announcement, it shrinks again when the announcement ends.

Music Assistant doesn't pass the announcement's text to the player. To show the message in the bar, fire a `tileboard` event with `command: sendspin_announcement` just before playing the announcement:

```yaml
sequence:
  - event: tileboard
    event_data:
      command: sendspin_announcement
      message: "{{ message }}"
  - action: music_assistant.play_announcement
    target:
      entity_id: media_player.tileboard_kitchen
    data:
      message: "{{ message }}"
      tts_entity_id: tts.home_assistant_cloud
```

Every open dashboard with Sendspin configured receives the event. The text is shown only by tablets that start playing an announcement within the next minute, so the tablets you didn't target ignore it. If several messages are sent in a row, each tablet shows them in order, one per announcement. This is a built-in command: you don't need to add it to your [`events`](events.md) list. As with other events, Home Assistant only sends it to administrator accounts.

In Fully Kiosk Browser, the tablet's own media volume also applies. You can change it from the top bar's menu (⋮); see [`header.volume`](pages.md#layout-and-orientation).

If the server can't be reached, the tablet keeps retrying in the background and the rest of the dashboard works normally.

**Note:** browsers only allow audio after someone has interacted with the page. If audio doesn't play after the tablet loads, tap the screen once.
