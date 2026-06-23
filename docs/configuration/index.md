# Configuration Overview

TileBoard Reborn is configured via a YAML file (`tileboard.yaml` by default).

## Top-Level Structure

```yaml
name: My Dashboard
ha_url: http://homeassistant.local:8123
grid_size: 64          # default tile size in pixels (optional)

pages:
  - id: main
    name: Main
    icon: mdi-home
    sections:
      - ...

screensaver:
  ...

restrictions:
  ...
```

## Key Sections

- [Pages](pages.md) — define dashboard pages and their layout
- [Widgets](widgets/index.md) — tile types and their configuration options
- [Screensaver](screensaver.md) — ambient display when idle
- [Restrictions](restrictions.md) — PIN and condition-based access control
