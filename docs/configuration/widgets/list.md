# List Widget

Displays a scrollable list of entity rows, each with an icon, label, and optional controls. Useful for groups of lights, media players, or any collection of related entities.

**Default size:** 4×4

```yaml
type: list
title: Lights
items:
  - entity: light.living_room
    name: Living Room
  - entity: light.kitchen
    name: Kitchen
  - entity: light.bedroom
    name: Bedroom
```

## Properties

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `items` | list | — | List of row definitions |

### Item options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | string | — | Entity to bind this row to |
| `name` | string / map / expression | entity name | Row label |
| `caption` | string / map / expression | — | Secondary label shown below the name |
| `icon` | string / map / expression | — | MDI icon. Falls back to entity device class icon |
| `state` | string / map / expression | — | Override the state text shown on the right |
| `restriction` | string | — | Restriction ID required before interacting with this row |
| `features` | list | — | Additional inline controls |
| `refresh_interval` | number | — | Polling interval in milliseconds for this item |

### Features

Features add extra inline controls to a list row.

**`brightness_slider`** — brightness slider for light entities:
```yaml
features:
  - brightness_slider
```

**`color_presets`** — color swatch buttons:
```yaml
features:
  - color_presets:
      presets:
        - name: Warm
          color_temp: 3000
        - name: Cool
          color_temp: 5500
        - name: Red
          rgb: [255, 50, 50]
```

Each preset accepts either `color_temp` (Kelvin) or `rgb` ([R, G, B] 0–255).

## Dynamic Properties

`name`, `caption`, `icon`, and `state` all support static strings, state maps, and `{{ }}` expressions — the same as [common widget properties](index.md#dynamic-properties).

## Examples

**Light list with brightness sliders:**
```yaml
type: list
title: Bedroom Lights
items:
  - entity: light.ceiling
    name: Ceiling
    features:
      - brightness_slider
  - entity: light.bedside_left
    name: Left Bedside
    features:
      - brightness_slider
  - entity: light.bedside_right
    name: Right Bedside
    features:
      - brightness_slider
```

**Mixed entity list:**
```yaml
type: list
title: Downstairs
items:
  - entity: light.living_room
    name: Living Room
  - entity: switch.tv
    name: TV
    icon: mdi-television
  - entity: climate.living_room
    name: Thermostat
    state: "{{ state === 'heat' ? `${attributes.temperature}°` : state }}"
```

**List with color presets:**
```yaml
type: list
title: Accent Lights
items:
  - entity: light.shelf
    name: Shelf Light
    features:
      - brightness_slider
      - color_presets:
          presets:
            - name: Warm
              color_temp: 2700
            - name: Daylight
              color_temp: 5000
            - name: Blue
              rgb: [50, 100, 255]
            - name: Red
              rgb: [255, 50, 50]
```
