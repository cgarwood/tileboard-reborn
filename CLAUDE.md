# TileBoard Reborn — Claude Context

Home Assistant dashboard UI. Quasar 2 + Vue 3 + TypeScript (strict) frontend with Pinia (composition API style), hash-mode Vue Router, SCSS and MDI icons (`mdi-*`). Python/aiohttp server (HA add-on). See `frontend/package.json` for versions.

## Commands

Run from `frontend/`:

- `yarn typecheck`: run before finishing any frontend change.
- `yarn lint:check`: lint without changing files.
- Don't run `yarn lint` unless asked. It runs prettier `--write` across the whole repo.

## Layout

- `frontend/src/widgets/`: one `.vue` file per widget type. Shared building blocks are in `components/`, `composables/`, `stores/`, `types/` and `utils/`.
- `server/tileboardserver/server.py`: aiohttp app. It serves the built frontend, `/config/{name}` (from `server/configs/{name}/config.yaml` plus secrets), and media. Server settings are in `server/server.config.yaml`. `server/venv` is a local virtualenv, so leave it alone.
- `docs/`: the user-facing mkdocs site. `docs/configuration/` is the config reference (widgets, actions, more-info, screensaver, restrictions, pages). **When you add or change a config option, update the matching page.**
- `plans/`: gitignored local planning docs. Read them for context, but never commit them.

## Widget System

Widget shape:

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

- Wrap content in `<BaseWidget :widget="widget">`. It handles tap/hold actions, the more-info dialog, the missing-entity placeholder and the lock badge.
- `useWidget` returns `entity`, `title`, `subtitle`, `state`, `unitOfMeasurement`, `isOn`, `cardClass`, `cardStyle`, `background`, `backgroundStyle`, `icon`, `iconColor`, `titleColor`, `subtitleColor`, `stateBadge`, `resolveCtx`.
- `Widget` has `[key: string]: unknown`, so read widget-specific config with type assertions.

**Adding a widget type:**
1. Create `frontend/src/widgets/XxxWidget.vue` with `registerWidgetDefaults`.
2. Add it to `WIDGET_MAP` in `components/WidgetRenderer.vue`.
3. Create `docs/configuration/widgets/<type>.md`.
4. Add it to `docs/configuration/widgets/index.md`.
5. Add it to the `mkdocs.yml` nav.

### BaseWidget

- Renders as a `q-card flat bordered` with `overflow: hidden` and `position: relative`. The border is a real 1px border, so absolutely-positioned children stop at the padding edge.
- **entitiesLoaded guard:** it shows the missing-entity placeholder only when `haStore.entitiesLoaded && !(entity in states)`. Entities arrive asynchronously after connection, so anything else that reports a missing entity must check `entitiesLoaded` the same way.
- Opens `MoreInfoDialog` on hold by default, or on tap when `tap_action: more_info`.

## resolveWidgetProp

`resolveWidgetProp(value, ctx) → string | undefined` (`utils/resolveWidgetProp.ts`, which also defines `PropResolveContext`).

- `string`: returned as-is, with any `{{ expr }}` templates evaluated.
- `Record<string, string>`: state map, `map[state] ?? map.default`.
- Anything else returns `undefined`.

Templates run through `new Function` with `(state, attributes, entity, states)` in scope. Each template is compiled once and cached by its source (`useVisibility` conditions work the same way), so never call `new Function` per evaluation. Expressions that mention `Date` also read the shared `useMinuteClock()` ref, so they re-evaluate every minute. Use that clock for any other once-a-minute time dependency instead of adding a per-component timer.

`useWidget` provides `resolveCtx`. Outside `useWidget`, build the context from `haStore.states`.

## Home Assistant Store

```typescript
const haStore = useHomeAssistantStore();
haStore.states           // HassEntities keyed by entity_id
haStore.connected
haStore.entitiesLoaded   // true after first subscribeEntities callback; reset on disconnect
haStore.callService(domain, service, data)
haStore.sendMessage<T>(msg)          // one-shot WS command
haStore.subscribeMessage<T>(cb, msg) // returns unsubscribe fn
haStore.signPath(path)               // sign a media URL
```

To fetch history, see `useSensorHistory` or `SensorHistoryChart`. With `minimal_response`, `history/history_during_period` returns `{ s, lu }` per entity, where `lu` is in **seconds** (a float), not milliseconds.

## Actions

Types are in `types/actions.ts`. `tap_action`/`hold_action` take one action or an array. `action: 'none'` stops execution. The widget's default tap behavior runs only when `tap_action` is unset. Run actions with `useActionExecutor().executeActions(actions, {}, openMoreInfo)`.

## More-Info Dialog

`MoreInfoDialog` picks a view by entity domain: `light`, `climate`, `number` and `weather` each have their own `MoreInfo*` component, and everything else uses `MoreInfoSensor` (with an optional history chart). Per-widget config is `widget.more_info` (`types/more-info.ts`). `MoreInfoCalendarEvent` is a standalone dialog that takes event props directly and doesn't go through `MoreInfoDialog`.

## Styling Conventions

- Scoped SCSS in components by default. BEM-like names (`.widget-sensor__chart`).
- Default widget layout classes (`.widget-body`, `.state-area`, `.label-group`, `.title`, `.subtitle`, `.state`, `.state-badge`, `.widget-body--micro`) are in `css/_widget.scss`, which `quasar.config.ts` `css` loads globally. Widgets must **not** `@use` it.
  - Every default selector is wrapped in `:where(.widget …)` (zero specificity), so any scoped rule in a widget overrides it. A global `.widget-{type} .title` overrides it for one widget type.
  - `BaseWidget` renders two root nodes (card + dialog), so a widget's scoped styles don't reach the card root. Target the card with a global `.widget-{type}` rule.
- Theme variables: `--widget-title-color`, `--widget-subtitle-color`, `--page-background`, `--section-gap`, per-widget `--{type}-widget-background`, etc.
- BaseWidget adds state classes automatically: `state--on`, `state--off`, `state--{slugified-state}`.
- Prefer SVG/CSS to canvas, so colors can be `var(--foo)` without resolving them first.

## Charts

- **`components/more-info/SensorHistoryChart.vue`**: the interactive Chart.js chart. It is only reachable through `MoreInfoDialog`, which `BaseWidget` loads with `defineAsyncComponent`, so Chart.js stays out of the dashboard bundle. **Never import Chart.js from widgets.**
- **`components/widgets/SensorWidgetChart.vue`**: the decorative background sparkline for `SensorWidget`. Plain inline SVG with `pointer-events: none`. `color` goes straight into the SVG `stroke`/`fill`, so `var()` works.
  - Data comes from `composables/useSensorHistory.ts`. Series are shared per (entity, hours, buckets) and update live in place. They stay cached for 10 minutes after the last chart unmounts, and reload on (re)connect once `entitiesLoaded`.
- `widget.chart` can be absent (no chart), `false` (disabled), `{}` or `null` (all defaults), or `{ hours, min, max, smoothing, color }`.

## Menu Widget and Slide

`utils/menuSources.ts` is the only place that knows a menu provider's attribute shape. Its adapters turn entity attributes into a `MenuDay`. **Add new providers there, not in `MenuWidget` or `ScreensaverMenuSlide`.** `components/menu/MenuDayView.vue` is shared by the widget, the dialog and the slide. Its sizes are in `em`, so parents scale it with `font-size`.

## Key Patterns

**Fragment root nodes:** widgets that render two sibling elements (widget + standalone dialog) use `inheritAttrs: false` and `v-bind="$attrs"` on the intended root. Example: `CalendarWidget` renders `<BaseWidget>` then `<MoreInfoCalendarEvent>`.

## Stores

| Store | Purpose |
|---|---|
| `useHomeAssistantStore` | WS connection, entity states, service calls |
| `useConfigStore` | Dashboard JSON config, page/section/widget tree |
| `useCalendarStore` | Ref-counted calendar event subscriptions; window moves forward at local midnight |
| `useRestrictionsStore` | PIN/confirmation locks, unlock timers |
| `useScreensaverStore` | Screensaver activation, slides |
| `useWeatherAlertsStore` | HA weatheralerts sensor, footer carousel |
| `useSendspinStore` | Music player protocol (Sendspin) |
