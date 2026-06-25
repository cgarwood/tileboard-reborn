# Configuration Overview

TileBoard Reborn is configured via folders containing one or more YAML files. `config.yaml` is the main configuration file, but additional files can be included. We use the same YAML parser as Home Assistant, so functions such as !include, !include_dir_merge_list, !secret, etc. are supported.

## Folder Structure

Create subdirectories in the `configs` folder for each display you want to configure. Each subdirectory needs its own `config.yaml` file. Additional YAML files can be included using the various !include directives.

The following is an example of a multi-device config structure:

```
configs/
├── living_room/
│   ├── config.yaml
│   ├── pages/
│   │   ├── dashboard.yaml
│   │   ├── security.yaml
│   │   ├── media.yaml
├── bedroom/
│   ├── config.yaml
│   ├── pages.yaml
├── _common/
│   ├── page-rooms.yaml
│   ├── weather-widget-custom.yaml

```

## Top-Level `config.yaml` Structure

```yaml
name: My Dashboard
ha_url: http://homeassistant.local:8123
grid_size: 64 # default tile size in pixels (optional)

pages:
  - id: main
    name: Main
    icon: mdi-home
    sections:
      - ...

screensaver: ...

restrictions: ...
```

## Key Sections

- [Pages](pages.md) — define dashboard pages and their layout
- [Widgets](widgets/index.md) — tile types and their configuration options
- [Screensaver](screensaver.md) — ambient display when idle
- [Restrictions](restrictions.md) — PIN and condition-based access control
