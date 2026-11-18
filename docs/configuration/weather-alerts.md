# Weather Alerts

TileBoard Reborn can show active National Weather Service alerts for your area. Alerts come from a sensor created by the [weatheralerts](https://github.com/custom-components/weatheralerts) custom integration (available through HACS), so this feature covers US locations only.

## Example Configuration

```yaml
weather_alerts:
  entity: sensor.weatheralerts_1
```

| Key      | Type   | Description                                   |
| -------- | ------ | --------------------------------------------- |
| `entity` | string | The weatheralerts sensor (required) |

## What You'll See

When at least one alert is active:

- **Dashboard footer.** A bar appears at the bottom of every page with the alert's icon, name and expiry time ("Tornado Warning until 7:45pm Tuesday, June 3rd"). With several alerts, the bar cycles through them every 7 seconds.
- **Screensaver.** Each alert is shown as a badge on the screensaver.
- **Alert details.** Tapping the footer or a screensaver badge opens a dialog with the full headline, description and safety instructions.

When the last alert expires, the footer goes away by itself.

## Colors and Icons

Common alert types get their own icon and color, such as orange for severe thunderstorms, red for tornadoes, green for floods and blue for winter storms. Other alerts use a generic alert icon and the default blue.

To change a color, or to add one for another alert type, use a [stylesheet](resources.md#theming). The footer bar, the screensaver badge and the dialog header each get a class named after the alert, in lowercase with dashes (`Flood Watch` becomes `flood-watch`):

```css
.heat-advisory {
  background-color: #e65100;
}
```
