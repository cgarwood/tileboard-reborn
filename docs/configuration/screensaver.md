# Screensaver

TileBoard Reborn includes a screensaver feature that can be configured to display a rotating series of images like a digital picture frame, along with current weather conditions, weather forecasts, upcoming calendar events, menus, and slides of your own design.

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
  # (Optional) Calendars to show today's and tomorrow's events from.
  calendars:
    - entity: calendar.family
    - entity: calendar.work
      name: Work
      color: '#1e88e5'
  # (Optional) Menus to show, one slide each.
  menus:
    - entity: sensor.sunnyside_menu_lunch_today
      title: Sunnyside Lunch
  # (Optional) Slides of your own, one slide each.
  custom_slides:
    - entity: sensor.joke_of_the_day
      header: Joke of the Day
      icon: mdi-emoticon-happy-outline
      text: '{{ state }}'
```

## Calendars

Each `calendars` entry takes `entity` (required), plus optional `name` and `color`, the same as the [calendar widget](widgets/calendar.md#calendar-entry-options). A "Today's Events" slide is shown when any calendar has events today, and a "Tomorrow's Events" slide when any has events tomorrow.

## Menus

Each `menus` entry adds a slide showing that day's menu with every section and its sides. It takes the same options as the [menu widget](widgets/menu.md#properties): `entity` (required), `title`, `source`, `tomorrow_entity`, `switch_at`, `fallback_to_tomorrow`, `hide_sections` and `attribute`. `title` defaults to the entity's friendly name.

The slide follows the same rules as the widget for choosing between today's and tomorrow's menu, and is left out when that day has no menu.

A `menus` entry can also take `background`, which overrides `backgrounds.menu` for that slide. See [Backgrounds](#backgrounds).

## Custom Slides

Each `custom_slides` entry adds a slide you design yourself, for things like a joke of the day, a fun fact or a quote held in a sensor. A slide either fills in the built-in card layout or uses your own `html`.

| Property | Description |
|---|---|
| `entity` | Entity that `state`, `attributes` and state maps refer to. While it is `unavailable` or `unknown`, the slide is left out. |
| `header` | Small uppercase label at the top, e.g. `Joke of the Day` |
| `icon` | MDI icon (`mdi-...`), shown large above the text and as a faint watermark |
| `title` | Heading under the icon |
| `text` | Main text, in large type that gets smaller for long text. Line breaks are kept. |
| `footer` | Small line under the text |
| `html` | Your own markup, used instead of the card layout. See [Custom HTML](#custom-html). |
| `css` | Extra CSS for the slide. See [Custom HTML](#custom-html). |
| `class` | Extra CSS class on the slide, for your `css` to target |
| `background` | Background image, overriding `backgrounds.custom`. See [Backgrounds](#backgrounds). |
| `visibility` | Conditions for showing the slide, the same as [widget visibility](widgets/index.md#visibility) |
| `duration` | Seconds on screen. Defaults to twice `slide_duration`, like the other info slides. |

`header`, `icon`, `title`, `text` and `footer` each take plain text, a state map (`{ state: value, ..., default: value }`) or a `{{ template }}`, the same as [widget templates](widgets/index.md). A template can use `state`, `attributes`, `entity('sensor.other').state` and `states`, and any JavaScript, which is handy for tidying up scraped sensor text.

The slide is left out when `text` resolves to empty (or `title`, if there is no `text`), so an empty sensor doesn't leave a blank slide.

```yaml
screensaver:
  custom_slides:
    - entity: sensor.wallboard_fun_joke
      header: Joke of the Day
      icon: mdi-emoticon-happy-outline
      # Strip the leading ": " the scraper leaves in the state
      text: '{{ state.replace(/^:\s*/, "") }}'
    - entity: sensor.wallboard_fun_fact
      header: Fun Fact
      icon: mdi-lightbulb-on-outline
      # Keep only the fact, dropping the page text scraped after it
      text: '{{ state.replace(/^:\s*/, "").split(" Journal Entry")[0] }}'
      footer: '{{ new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) }}'
      duration: 20
```

Use single quotes around templates in YAML, so backslashes in a regular expression are kept as written.

### Custom HTML

For a layout of your own, set `html`. It replaces the card layout, and its `{{ templates }}` work the same way. Values from templates are HTML-escaped, so sensor text shows as text and can't break your markup. The rest of `html` is used exactly as written.

`css` is added to the page while the slide is showing. It isn't limited to the slide, so give the slide a `class` and start each selector with it:

```yaml
screensaver:
  custom_slides:
    - entity: sensor.wallboard_fun_joke
      class: joke-slide
      html: |
        <div class="joke-slide__bubble">
          {{ state.replace(/^:\s*/, "").split("? ")[0] }}?
        </div>
        <div class="joke-slide__punchline">
          {{ state.replace(/^:\s*/, "").split("? ").slice(1).join("? ") }}
        </div>
      css: |
        .joke-slide__bubble {
          font-size: 3rem;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 24px 40px;
          max-width: 1000px;
          text-align: center;
        }
        .joke-slide__punchline {
          margin-top: 32px;
          font-size: 2.5rem;
          font-weight: 600;
          color: #ffd54f;
        }
```

The slide centres its content, leaving room at the bottom for the clock. It draws the same dark gradient and background image as the other slides. To replace those, set `background` on `.your-class.custom-slide`.

## Backgrounds

The weather, calendar and menu slides each have a built-in background photo. Custom slides have none by default. To use your own, put the images in the server's `media` folder (`data/media/` with Docker), which is served at `/media/`, and set `backgrounds`:

```yaml
screensaver:
  weather_entity: weather.home
  backgrounds:
    # A state map picks an image by the weather entity's condition
    weather:
      sunny: /media/backgrounds/sunny.jpg
      rainy: /media/backgrounds/rain.jpg
      pouring: /media/backgrounds/rain.jpg
      clear-night: /media/backgrounds/night.jpg
      default: /media/backgrounds/weather.jpg
    calendar: /media/backgrounds/kitchen.jpg
    # false shows the plain gradient, with no photo
    menu: false
    # Used by custom slides that don't set their own background
    custom: /media/backgrounds/fun.jpg
  menus:
    - entity: sensor.sunnyside_menu_lunch_today
      background: /media/backgrounds/sunnyside.jpg
```

Each value can be:

- an image URL (`/media/...` or any full `https://` URL)
- a state map, `{ state: url, ..., default: url }`. For `weather` it matches the weather entity's condition (`sunny`, `cloudy`, `partlycloudy`, `rainy`, `pouring`, `snowy`, `fog`, `clear-night`, ...). For a menu or custom slide it matches that slide's entity's state. The calendar slide has no entity, so only `default` applies.
- a `{{ template }}`, the same as [widget templates](widgets/index.md). It can use `entity('sun.sun').state` and so on.
- `false`, for the gradient only

If the image doesn't load, or a state map has no match and no `default`, the slide falls back to the built-in photo. A dark gradient is always drawn over the image so the text stays readable. For tablets, images about 1920px wide (WebP or JPEG, a few hundred KB) work well.
