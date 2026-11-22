# HTML Widget

Shows your own HTML and CSS inside a widget card. Use it for anything the other widgets don't cover: a large alert message, a custom status panel, a formatted block of entity data.

**Default size:** 2×2

```yaml
type: html
entity: sensor.washer_status
html: |
  <div class="washer">
    <i class="mdi mdi-washing-machine"></i>
    <span>{{ state }}</span>
  </div>
css: |
  :scope { padding: 12px; }
  .washer { display: flex; align-items: center; gap: 8px; height: 100%; font-size: 1.4rem; }
  .mdi { font-size: 2.5rem; }
```

## Properties

| Key      | Type                      | Description                                                                                                                            |
| -------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `html`   | string / map / expression | Markup shown in the card (required).                                                                                                   |
| `css`    | string                    | CSS for this widget only. See [Styling](#styling).                                                                                     |
| `entity` | string                    | Optional. Sets `state` and `attributes` in templates, and the widget shows the missing-entity placeholder if the entity doesn't exist. |

The [common properties](index.md#common-properties) also apply. `background`, `class`, `style`, `visibility`, `restriction`, `tap_action` and `hold_action` work as on any widget.

`title` and `subtitle`, when set, are drawn in the bottom-left corner like on the built-in widgets, on top of your markup. Leave them out to draw your own labels. Unlike other widgets, `title` does not fall back to the entity's name. `icon` is not drawn.

## Markup

The markup fills the whole card, with no padding. It is used exactly as written, except for `{{ }}` templates, which are evaluated the same way as in other [dynamic properties](index.md#dynamic-properties) (`state`, `attributes`, `entity(id)` and `states` are available). Template results are HTML-escaped, so entity data always shows as text and can't add markup to the page.

A state map gives different markup for each state of `entity`. The chosen markup can contain templates too:

```yaml
html:
  'on': '<div class="big">{{ attributes.friendly_name }} is open</div>'
  default: '<div class="big">Closed</div>'
```

Use MDI icons with `<i class="mdi mdi-NAME"></i>`.

`<script>` tags don't run. Use `tap_action` and `hold_action` to make the widget do something when tapped; there's no default tap action.

## Styling

`css` applies only to this widget. Write selectors as if the widget were the whole page:

- Every selector is limited to elements inside the widget, so `h1 { }` styles this widget's headings and no others.
- `:scope` means the widget card itself, e.g. `:scope { padding: 12px; }`.
- `@media` and `@supports` blocks work. `@keyframes` and `@font-face` work too, but their names are global, so give them names unique to the widget.

Widget rules override the dashboard's default widget styles. Widgets with identical `css` share one stylesheet.

By default the card uses the `--html-widget-background` theme color with white text. Headings and paragraphs have no margins and are sized for a card: `h1` is 1.6em, `h2` 1.35em, `h3` 1.15em, and the rest match the surrounding text.

### Matching the standard tile look

The classes the built-in widgets use for their layout also work in your markup, so a custom tile can look like the rest of the dashboard without writing that CSS yourself:

| Class         | What it gives you                       |
| ------------- | --------------------------------------- |
| `state-area`  | Full-card area that centers its content |
| `state`       | Large state text                        |
| `state-badge` | Small pill in the top-right corner      |

```yaml
type: html
grid: { width: 2, height: 2 }
title: CPU
subtitle: Server
html: |
  <div class="state-area"><span class="state">{{ entity('sensor.processor_use').state }}%</span></div>
  <span class="state-badge"><i class="mdi mdi-cpu-64-bit"></i></span>
```

For labels with markup of their own, leave out `title`/`subtitle` and use `label-group` (pinned to the bottom-left corner) holding `subtitle` and `title` elements.

Size text with `rem`, `em` or `px`. Container query units (`cqw`, `cqh`) need a newer WebView than some kiosk tablets have.

## Example: Smoke alarm page

An alert page that shows a large message while any smoke alarm is triggered, with each alarm's state below it. The message sits in a [conditional](conditional.md) slot, so the alarm row never moves:

```yaml
pages:
  - name: Alerts
    id: alerts
    icon: mdi-alarm-light
    sections:
      - width: 8
        widgets:
          - type: conditional
            grid: { width: 8, height: 4 }
            cases:
              - match: any
                conditions:
                  - { entity: binary_sensor.smoke_kitchen, state: 'on' }
                  - { entity: binary_sensor.smoke_bedroom, state: 'on' }
                  - { entity: binary_sensor.smoke_basement, state: 'on' }
                widgets:
                  - type: html
                    grid: { width: 8, height: 4 }
                    background: 'var(--red-10)'
                    html: |
                      <div class="alarm">
                        <i class="mdi mdi-fire"></i>
                        <div class="where">
                          Smoke detected in
                          {{ ['kitchen', 'bedroom', 'basement']
                               .filter((room) => entity('binary_sensor.smoke_' + room).state === 'on')
                               .join(', ') }}
                        </div>
                      </div>
                    css: |
                      .alarm {
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        height: 100%; color: white; text-align: center;
                      }
                      .mdi { font-size: 6rem; }
                      .where { font-size: 2.5rem; font-weight: 500; text-transform: capitalize; }
            default:
              - type: html
                grid: { width: 8, height: 4 }
                html: '<div class="ok"><i class="mdi mdi-shield-check"></i> No alarms</div>'
                css: |
                  .ok { display: flex; align-items: center; justify-content: center; gap: 12px; height: 100%; font-size: 2rem; }
          - { type: sensor_icon, entity: binary_sensor.smoke_kitchen, title: Kitchen }
          - { type: sensor_icon, entity: binary_sensor.smoke_bedroom, title: Bedroom }
          - { type: sensor_icon, entity: binary_sensor.smoke_basement, title: Basement }
```

To jump to this page when an alarm goes off, fire a `tileboard` event from a Home Assistant automation that runs a `navigate` action. See [Events](../events.md).
