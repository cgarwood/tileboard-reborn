# Resources

`resources` loads extra stylesheets into the dashboard. Use it to add custom fonts, for example in a [custom screensaver slide](screensaver.md#custom-html), or to theme the dashboard with your own CSS.

```yaml
resources:
  - url: /local/fonts/fredoka.css
  - url: /local/theme.css
  - url: https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap
    type: css
```

| Option | Description |
|---|---|
| `url` | Address of the file. A path such as `/local/theme.css` is loaded from the TileBoard server that served the config, so it works even when the dashboard itself is opened from somewhere else. Full `https://` URLs work too. |
| `type` | `css`. Optional when the URL ends in `.css`. Required otherwise, such as for Google Fonts URLs. |

Stylesheets load after the dashboard's own styles, in the order listed, so your rules override the defaults. When you reload the config, changes to the list apply straight away. Stylesheets that are still listed stay loaded, and ones you remove are taken away. If a file fails to load, the dashboard carries on without it and logs a warning in the browser console.

`type: module` is reserved for custom widgets, which aren't supported yet. Entries with that type are skipped.

## Hosting files on the TileBoard server

Files in the server's `www` folder are served at `/local/`. With Docker the folder is `data/www/`. The server creates it on first start. For example, `www/fonts/fredoka.css` is served at `/local/fonts/fredoka.css`.

Browsers check for changes to these files every time they're loaded. After you edit a file, reload the config (or the page) to pick up the change.

## Custom fonts

To use a font, first load a stylesheet that defines it, then set `font-family` in your CSS.

### From the TileBoard server

Download the font as `.woff2` files and put them in `www/fonts/` next to a CSS file that declares them:

```
www/
└── fonts/
    ├── fredoka.css
    ├── Fredoka-Regular.woff2
    └── Fredoka-SemiBold.woff2
```

`www/fonts/fredoka.css`:

```css
@font-face {
  font-family: 'Fredoka';
  font-weight: 400;
  font-display: swap;
  src: url('Fredoka-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Fredoka';
  font-weight: 600;
  font-display: swap;
  src: url('Fredoka-SemiBold.woff2') format('woff2');
}
```

URLs inside a stylesheet are relative to the stylesheet, so `Fredoka-Regular.woff2` resolves to `/local/fonts/Fredoka-Regular.woff2`.

```yaml
resources:
  - url: /local/fonts/fredoka.css
```

Fonts served this way keep working when the tablet can't reach the internet.

### From a font service

Services such as Google Fonts give you a stylesheet URL. Because it doesn't end in `.css`, set `type: css`:

```yaml
resources:
  - url: https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap
    type: css
```

### Using the font

Once it's loaded, use the font anywhere CSS is accepted, such as a custom slide's `css`:

```yaml
screensaver:
  custom_slides:
    - entity: sensor.wallboard_fun_joke
      class: joke-slide
      html: |
        <div class="joke-slide__text">{{ state }}</div>
      css: |
        .joke-slide__text {
          font-family: 'Fredoka', sans-serif;
          font-size: 3rem;
        }
```

## Theming

A stylesheet can override the CSS variables the dashboard uses for its colors and spacing. Set them on `:root`:

`www/theme.css`:

```css
:root {
  --page-background: #1b1b2f;
  --widget-border-radius: 16px;
  --sensor-widget-background: #3a506b;
  --light-widget-background-on: #e09f3e;
}

body {
  font-family: 'Fredoka', sans-serif;
}
```

| Variable | Used for |
|---|---|
| `--page-background` | Page background |
| `--toolbar-background` | Top toolbar background |
| `--text-light`, `--text-dark`, `--text-lighter` | Text colors |
| `--widget-title-color`, `--widget-subtitle-color` | Widget title and subtitle text |
| `--widget-border-radius` | Widget corner rounding |
| `--section-padding`, `--section-gap` | Section padding and the gap between widgets |
| `--{type}-widget-background` | Background of each widget type, such as `--sensor-widget-background` or `--climate-widget-background` |
| `--{type}-widget-background-on` | Background of a widget whose entity is on, for `sensor`, `switch`, `light` and `fan` |
| `--climate-heating-background`, `--climate-cooling-background` | Climate widget while heating or cooling |
| `--lock-widget-background-locked`, `--lock-widget-background-jammed` | Lock widget states |

To style one kind of widget, target its `.widget-{type}` class. Widgets also get state classes, such as `state--on`, `state--off` and `state--{state}`:

```css
.widget-sensor .title {
  text-transform: uppercase;
}

.widget-light.state--on {
  box-shadow: 0 0 16px rgba(255, 200, 80, 0.6);
}
```
