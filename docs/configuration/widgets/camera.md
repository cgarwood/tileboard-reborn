# Camera Widget

Displays a camera entity as a live snapshot or a streaming video feed. Tapping the widget opens a full-screen view.

**Default size:** 2×2

```yaml
type: camera
entity: camera.front_door
title: Front Door
```

## Properties

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `stream_mode` | `"snapshot"` / `"stream"` | `"snapshot"` | How to display the camera feed |
| `snapshot_interval` | number | `5` | Seconds between snapshot refreshes (snapshot mode only) |

## Snapshot Mode

The widget periodically fetches a still image from the camera. Use `snapshot_interval` to control how often the image refreshes. Lower values increase network traffic.

```yaml
type: camera
entity: camera.backyard
stream_mode: snapshot
snapshot_interval: 10
```

## Stream Mode

Renders a live video stream using the camera's HLS stream URL. Requires the camera entity to support streaming.

```yaml
type: camera
entity: camera.living_room
stream_mode: stream
```

## Examples

**Doorbell snapshot:**
```yaml
type: camera
entity: camera.front_doorbell
title: Doorbell
stream_mode: snapshot
snapshot_interval: 3
grid:
  width: 4
  height: 3
```

**Live stream:**
```yaml
type: camera
entity: camera.garage
title: Garage
stream_mode: stream
grid:
  width: 4
  height: 3
```
