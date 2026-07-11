# Weather Widget

Displays current weather conditions from a weather entity. The layout adapts based on grid size. A decorative weather icon fills the background.

**Default size:** 2×4

```yaml
type: weather
entity: weather.home
title: Weather
```

## Properties

This widget has no widget-specific config keys beyond the [common properties](index.md#common-properties).

## Layouts

The widget automatically selects a layout based on its grid dimensions:

- **Compact** (small): current temperature and condition only
- **Wide** (width ≥ 4): temperature, condition, and today's high/low inline, with a horizontal forecast row
- **Vertical** (height ≥ 4): temperature, condition, and a vertical forecast list

## More-info Dialog

Long-pressing opens a detail panel showing:

- Current temperature, condition, and today's high/low
- Humidity, wind speed, dew point, visibility, and pressure
- Tabbed forecast panels — Daily, Hourly, and/or Twice Daily tabs are shown based on what the entity supports

## Examples

**Portrait weather card:**
```yaml
type: weather
entity: weather.home
title: Home
grid:
  width: 2
  height: 4
```

**Wide weather card:**
```yaml
type: weather
entity: weather.home
title: Today
grid:
  width: 4
  height: 2
```
