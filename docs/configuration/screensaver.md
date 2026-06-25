# Screensaver

TileBoard Reborn includes a screensaver feature that can be configured to display a rotating series of images like a digital picture frame, along with current weather conditions, weather forecasts, and upcoming calendar events.

## Example Configuration

```yaml
screensaver:
  # Timeout (in seconds) before the screensaver activates
  timeout: 300
  # Home Assistant media source containing pictures to display in the screensaver.
  media_source: 'media-source://media_source/local/tileboard/living_room'
  # Slide duration (in seconds) for each image
  slide_duration: 5
  # (Optional) Entity for current weather conditions and forecasts
  weather_entity: weather.nws
  # (Optional) Calendar entities to display upcoming events.
  calendar_entities:
    - calendar.family
    - calendar.work
```
