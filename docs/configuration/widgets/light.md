# Light Widget

Controls a light entity. Tapping toggles the light on/off. When on, brightness can be adjusted with +/− controls. Long-pressing opens a detail dialog with a brightness slider and, if supported, a color temperature slider.

**Default size:** 2×2

```yaml
type: light
entity: light.living_room
title: Living Room
```

## Properties

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `step` | number | `10` | Brightness increment (%) for the +/− tap controls |

## Brightness Controls

When the light is on, tap the dimmer icon (left/right side) to decrease/increase brightness by `step` percent. The current brightness is displayed as a state badge.

```yaml
type: light
entity: light.kitchen
title: Kitchen
step: 5       # fine-grained control
```

## More-info Dialog

Long-pressing opens a detail panel with:
- Toggle button
- Brightness slider (if supported)
- Color temperature slider (if `color_temp` is in the entity's `supported_color_modes`)

See [More-info Configuration](../more-info.md) for customization options.

## Examples

**Basic light:**
```yaml
type: light
entity: light.bedroom
title: Bedroom
```

**Coarse brightness steps:**
```yaml
type: light
entity: light.living_room_strip
title: Strip Light
step: 25
```

**Custom background per state:**
```yaml
type: light
entity: light.desk_lamp
title: Desk Lamp
background: "{{ state === 'on' ? `rgb(${Math.round(attributes.brightness/2.55)}, ${Math.round(attributes.brightness/2.55)}, 50)` : 'rgb(20,20,30)' }}"
```
