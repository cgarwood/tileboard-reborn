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

Each folder that contains a `config.yaml` is a config, served at `/config/<folder name>`. Folders without one, like `_common` above, are only used for includes.

## Choosing a Config on a Device

The first time a device opens TileBoard, it asks which config to use. When TileBoard is served by the TileBoard server, it shows a dropdown of the configs on the server, listed by their `name`. You can still enter the URL of a config hosted elsewhere with **Use a custom URL instead**.

To set a device up without using the dropdown, add `?config=<folder name>` to the URL it opens. This works well as a Fully Kiosk Browser start URL:

```
http://<server>:9090/?config=living_room
```

The device loads that config and remembers it. If the config fails to load, an error page shows the reason and keeps retrying, with a button to choose another config. See [Issues and Errors](issues.md#config-errors). The parameter also works after the `#` (`http://<server>:9090/#/?config=living_room`).

## Top-Level `config.yaml` Structure

```yaml
name: My Dashboard
ha_url: http://homeassistant.local:8123
grid_size: 64 # default tile size in pixels (optional)

layout: # optional; see Pages > Layout and orientation
  orientation: auto # auto | landscape | portrait
  nav_position: auto # auto | left | bottom
  header:
    battery: true # Fully Kiosk battery/charging status in the top bar
    issues: true # badge that opens the Issues dialog when there are problems
    notifications: true # bell with the unread notification count
    volume: true # Fully Kiosk volume sliders in the top bar menu; or a list, e.g. [media, alarm]

pages:
  - id: main
    name: Main
    icon: mdi-home
    sections:
      - ...

screensaver: ...

restrictions: ...

resources: ...

weather_alerts: ...

sendspin: ...

events: ...
```

## Key Sections

- [Pages](pages.md) — define dashboard pages, their layout, and portrait/landscape orientation
- [Widgets](widgets/index.md) — tile types and their configuration options
- [Actions](actions.md) — tap and hold actions (service calls, navigation, more-info, etc.)
- [More-info Dialog](more-info.md) — customizing the long-press detail dialog
- [Screensaver](screensaver.md) — ambient display when idle
- [Restrictions](restrictions.md) — PIN and condition-based access control
- [Resources](resources.md) — custom fonts and stylesheets
- [Weather Alerts](weather-alerts.md) — National Weather Service alerts in the footer and screensaver
- [Sendspin](sendspin.md) — play music to the tablet from Music Assistant
- [Events](events.md) — control dashboards from Home Assistant automations
