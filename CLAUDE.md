# TileBoard Reborn — Claude Context

Home Assistant dashboard UI. Quasar/Vue 3 frontend + Python/aiohttp server (HA add-on).

## Stack

| Layer | Tech |
|---|---|
| Frontend framework | Quasar 2 + Vue 3 + TypeScript (strict) |
| Build | Vite via Quasar CLI |
| State | Pinia (composition API style) |
| Routing | Vue Router (hash mode) |
| HA connection | home-assistant-js-websocket 9.6.0 |
| Charts | Chart.js 4 + vue-chartjs 5 |
| Icons | MDI v7 (`mdi-*`) |
| Styles | SCSS, scoped by default |

## Project Layout

```
frontend/src/
  components/       # Shared components (BaseWidget, dialogs, more-info/*)
  composables/      # Vue composables (useWidget, useActionExecutor, ...)
  css/              # Global SCSS (_widget.scss, variables.scss, app.scss)
  stores/           # Pinia stores
  types/            # TypeScript types
  utils/            # Pure utilities (resolveWidgetProp, widgetRegistry, ...)
  widgets/          # One file per widget type (SensorWidget.vue, etc.)
server/             # Python aiohttp HA add-on
```

## Widget System

Every widget is a `.vue` file in `frontend/src/widgets/`. They all share the same shape:

```vue
<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('mytype', { width: 2, height: 2 });
</script>

<script setup lang="ts">
const props = defineProps<{ widget: Widget }>();
const { title, subtitle, state, backgroundStyle, ... } = useWidget(() => props.widget);
</script>
```

- Wrap content in `<BaseWidget :widget="widget">` — handles click/hold actions, more-info dialog, missing-entity guard, lock badge.
- `Widget` type uses `[key: string]: unknown` so widget-specific config is accessed via type assertions.
- Register new types in `WidgetRenderer.vue`.

### BaseWidget

- Renders as `q-card flat bordered` with `overflow: hidden` and `position: relative`.
- The `q-card` with `bordered` has a real 1px border; absolutely-positioned children are constrained to the padding edge.
- Shows a placeholder when `entitiesLoaded && entity not in states` (don't show before first HA callback).
- Opens `MoreInfoDialog` on hold (default) or tap (if `tap_action: more_info`).

## resolveWidgetProp

```typescript
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import type { PropResolveContext } from '../utils/resolveWidgetProp';

resolveWidgetProp(value, ctx)  // → string | undefined
```

**`value` can be:**
- `string` — returned as-is (or with `{{ expr }}` template evaluated)
- `Record<string, string>` — state map: `{ on: 'green', off: 'red', default: 'grey' }` → `map[state] ?? map.default`
- anything else → `undefined`

**`PropResolveContext`:**
```typescript
{
  state: string | null;
  attributes: Record<string, unknown>;
  entity: (id: string) => { state: string | null; attributes: Record<string, unknown> };
  states: HassEntities;
}
```

Template expressions (`{{ ... }}`) are evaluated with `new Function` with `(state, attributes, entity, states)` in scope.

`useWidget` builds `resolveCtx` automatically. When using `resolveWidgetProp` outside `useWidget` (e.g. in a widget that needs to resolve its own custom prop), build the context manually from `haStore.states`.

## Home Assistant Store

```typescript
const haStore = useHomeAssistantStore();

haStore.states           // HassEntities — keyed by entity_id
haStore.connected        // boolean
haStore.entitiesLoaded   // true after first subscribeEntities callback; reset on disconnect
haStore.callService(domain, service, data)
haStore.sendMessage<T>(msg)          // Promise<T> — one-shot WS command
haStore.subscribeMessage<T>(cb, msg) // returns unsubscribe fn
haStore.signPath(path)               // sign a media URL
```

Entity state shape: `{ state: string, attributes: Record<string, unknown>, last_changed: string, last_updated: string }`.

History fetching pattern (used in chart components):
```typescript
const result = await haStore.sendMessage<Record<string, Array<{ s: string; lu: number }>>>({
  type: 'history/history_during_period',
  entity_ids: [entityId],
  start_time: new Date(Date.now() - hours * 3_600_000).toISOString(),
  significant_changes_only: false,
  no_attributes: true,
  minimal_response: true,
});
// result[entityId] = [{ s: '21.5', lu: 1234567890.123 }, ...]
// lu = unix timestamp in seconds (float), s = state string
```

## Action System

**`TapAction` union** (`types/actions.ts`):
```typescript
{ action: 'service';    service: 'domain.service'; data?: Record<string, unknown> }
{ action: 'javascript'; data: string }   // executed via new Function
{ action: 'event';      event: string; data?: Record<string, unknown> }
{ action: 'navigate';   page?: string; url?: string }
{ action: 'screensaver' }
{ action: 'more_info';  entity?: string }
{ action: 'none' }      // stops execution, disables default widget behavior
```

Widget config: `tap_action` and `hold_action` accept a single action or an array. Default widget behavior runs only when `tap_action` is not set.

**`useActionExecutor`:**
```typescript
const { executeActions } = useActionExecutor();
executeActions(widget.tap_action, {}, openMoreInfo);
```

## More-Info Dialog

Opened automatically by `BaseWidget` on hold. Routes on entity domain:

| Domain | Component |
|---|---|
| `light` | `MoreInfoLight` |
| `climate` | `MoreInfoClimate` |
| `number` | `MoreInfoNumber` |
| `weather` | `MoreInfoWeather` |
| everything else | `MoreInfoSensor` (with optional history chart) |

Calendar event details use a separate standalone dialog `MoreInfoCalendarEvent` (not routed through `MoreInfoDialog` — it takes event-specific props directly).

**`MoreInfoConfig`** (on `widget.more_info`):
```typescript
{
  disabled?: boolean;
  entity_id?: string;       // override which entity to show
  title?: string | Record<string, string>;
  subtitle?: string | Record<string, string>;
  header_background?: string | Record<string, string>;
  chart?: false;            // suppress the history chart
  chart_hours?: number;
  chart_min?: number;
  chart_max?: number;
}
```

## Styling Conventions

- Scoped SCSS in components by default.
- Global widget layout classes live in `css/_widget.scss` (`.widget-body`, `.state-area`, `.label-group`, `.title`, `.subtitle`, `.state`, `.state-badge`).
- CSS variables for theming: `--widget-title-color`, `--widget-subtitle-color`, `--page-background`, `--section-gap`, per-widget `--{type}-widget-background`, etc.
- State classes applied automatically by BaseWidget: `state--on`, `state--off`, `state--{slugified-state}`.
- BEM-like naming: `.widget-sensor__chart`, `.cal-widget__item`, etc.
- Widget-type global class: `.widget-sensor`, `.widget-light`, etc. (for background color variables).

## Chart Components

Two chart components exist:

**`SensorHistoryChart.vue`** (in `components/more-info/`) — full interactive history chart used inside more-info dialogs. Has axes, tooltips, legend-less but hoverable.

**`SensorWidgetChart.vue`** (in `components/widgets/`) — decorative background chart for `SensorWidget`. Key traits:
- Positioned `absolute; bottom: -2px; left: -2px; right: -2px; height: 55%` (negative inset to reach card edges past the 1px border)
- `pointer-events: none`, no axes, no tooltip, no legend
- `cubicInterpolationMode: 'monotone'` (not `tension` — monotone prevents overshoot)
- Mean-based downsampling: `target = Math.max(8, Math.round(12 / smoothing))` (default smoothing 0.3 → 40 points)
- `smoothing` capped at 1.0 via `Math.min(props.smoothing ?? 0.3, 1)`
- CSS variable colors resolved at runtime via a temp DOM element + `getComputedStyle`

## Key Patterns

**Fragment root nodes** — Some widgets render as two sibling elements (widget + standalone dialog). Use `inheritAttrs: false` on the script block + `v-bind="$attrs"` on the intended root. Example: `CalendarWidget` renders `<BaseWidget>` then `<MoreInfoCalendarEvent>`.

**entitiesLoaded guard** — Never show "entity doesn't exist" until `haStore.entitiesLoaded` is true, since entities arrive asynchronously after connection.

**Widget chart config** — `widget.chart` can be:
- `undefined` / absent → no chart
- `false` → explicitly disabled
- `{}` / `null` / any object → show chart with all defaults
- object with keys → `{ hours, min, max, smoothing, color }`

**Color resolution for canvas** — CSS variables can't be read by canvas. Pattern: create a temp div, set `el.style.color = value`, append to body, read `getComputedStyle(el).color`, remove. Handles `var(--foo)`, `rgb()`, `rgba()`, hex.

## Stores Summary

| Store | Purpose |
|---|---|
| `useHomeAssistantStore` | WS connection, entity states, service calls |
| `useConfigStore` | Dashboard JSON config, page/section/widget tree |
| `useRestrictionsStore` | PIN/confirmation locks, unlock timers |
| `useScreensaverStore` | Screensaver activation, slides |
| `useWeatherAlertsStore` | HA weatheralerts sensor, footer carousel |
| `useSendspinStore` | Music player protocol (Sendspin) |
