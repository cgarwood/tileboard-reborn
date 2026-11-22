<template>
  <BaseWidget
    :widget="widget"
    :class="[`hero--${phase}`, { 'hero--overcast': overcast }, `widget-hero--h${sizeClass}`]"
    :style="backgroundStyle"
  >
    <!-- A span: QCard rounds only the corners of its first and last child divs -->
    <span class="widget-hero__glow" />
    <div class="widget-hero__body" :style="bodyStyle">
      <div class="widget-hero__main">
        <div class="widget-hero__title">{{ heroTitle }}</div>
        <div v-if="heroSubtitle" class="widget-hero__subtitle">{{ heroSubtitle }}</div>
        <div v-if="message" class="widget-hero__message">{{ message }}</div>
      </div>

      <div v-if="sideWidget" class="widget-hero__side widget-hero__side--widget">
        <WidgetRenderer :widget="sideWidget" />
      </div>
      <div v-else-if="sideStat" class="widget-hero__side">
        <q-icon v-if="sideStat.icon" :name="sideStat.icon" class="widget-hero__side-icon" />
        <div>
          <div class="widget-hero__side-value">
            {{ sideStat.value
            }}<span v-if="sideStat.unit" class="widget-hero__side-unit">{{ sideStat.unit }}</span>
          </div>
          <div v-if="sideStat.label" class="widget-hero__side-label">{{ sideStat.label }}</div>
        </div>
      </div>

      <div v-if="chips.length" class="widget-hero__chips">
        <div
          v-for="chip in chips"
          :key="chip.index"
          v-touch-hold.mouse="() => onChipHold(chip.config)"
          class="widget-hero__chip"
          :class="{ 'widget-hero__chip--tappable': chip.tappable }"
          :style="chip.color ? { background: chip.color } : undefined"
          @click.stop="onChipTap(chip.config)"
          @mousedown.stop
          @touchstart.stop
        >
          <q-icon v-if="chip.icon" :name="chip.icon" />
          <span>{{ chip.text }}</span>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('hero', { width: 8, height: 3 });
</script>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import WidgetRenderer from '../components/WidgetRenderer.vue';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { normalizeActions, useActionExecutor } from '../composables/useActionExecutor';
import { evaluateVisibility } from '../composables/useVisibility';
import { useMinuteClock } from '../composables/useMinuteClock';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useMoreInfoStore } from '../stores/more-info';
import { resolveWidgetProp, type PropResolveContext } from '../utils/resolveWidgetProp';
import { levelOrColor } from '../utils/levels';
import { formatWeatherState, getWeatherIcon } from '../utils/weatherIcons';
import type { ActionConfig } from '../types/actions';
import type { VisibilityConfig } from '../types/visibility';
import type { Widget } from '../types/widgets';

interface HeroChipConfig {
  entity?: string;
  icon?: unknown;
  text?: unknown;
  color?: unknown;
  visibility?: VisibilityConfig;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
}

interface HeroSideConfig {
  entity?: string;
  icon?: unknown;
  value?: unknown;
  unit?: unknown;
  label?: unknown;
  widget?: Widget;
  /** Width of a side widget, in grid cells. */
  width?: number;
}

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();
const moreInfoStore = useMoreInfoStore();
const minuteClock = useMinuteClock();
const { backgroundStyle, resolveCtx } = useWidget(() => props.widget);
const { withUnlock } = useRestriction(() => props.widget);
const { executeActions } = useActionExecutor();

const NULL_ENTITY = { state: null, attributes: {} };

/** Template context for an entity other than the widget's own (a chip's, the side's). */
function ctxFor(entityId: string | undefined): PropResolveContext {
  const entity = entityId ? haStore.states[entityId] : undefined;
  return {
    state: entity?.state ?? null,
    attributes: entity?.attributes ?? {},
    entity: (id) => haStore.states[id] ?? NULL_ENTITY,
    states: haStore.states,
  };
}

// ── Text ──────────────────────────────────────────────────────────────────────────────────────
const heroTitle = computed(() => {
  if (props.widget.title != null) return resolveWidgetProp(props.widget.title, resolveCtx.value);
  void minuteClock.value; // re-greet as the day goes on
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
});

const heroSubtitle = computed(() => {
  if (props.widget.subtitle != null) {
    return resolveWidgetProp(props.widget.subtitle, resolveCtx.value);
  }
  void minuteClock.value;
  const now = new Date();
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
});

const message = computed(() => resolveWidgetProp(props.widget.message, resolveCtx.value));

// ── Side ──────────────────────────────────────────────────────────────────────────────────────
const weatherId = computed(() =>
  typeof props.widget.weather === 'string' ? props.widget.weather : undefined,
);
const side = computed(() => props.widget.side as HeroSideConfig | undefined);
const sideWidget = computed(() => side.value?.widget);

const sideStat = computed(() => {
  if (side.value && !side.value.widget) {
    const ctx = ctxFor(side.value.entity);
    const entity = side.value.entity ? haStore.states[side.value.entity] : undefined;
    return {
      icon: resolveWidgetProp(side.value.icon, ctx),
      value: resolveWidgetProp(side.value.value, ctx) ?? entity?.state ?? '—',
      unit:
        side.value.unit !== undefined
          ? resolveWidgetProp(side.value.unit, ctx)
          : entity?.attributes.unit_of_measurement,
      label: resolveWidgetProp(side.value.label, ctx) ?? entity?.attributes.friendly_name,
    };
  }
  const weather = weatherId.value ? haStore.states[weatherId.value] : undefined;
  if (!weather) return null;
  const temp = Number(weather.attributes.temperature);
  const humidity = weather.attributes.humidity as number | undefined;
  return {
    icon: getWeatherIcon(weather.state),
    value: Number.isFinite(temp) ? `${Math.round(temp)}°` : '—',
    unit: undefined,
    label: [formatWeatherState(weather.state), humidity != null ? `${humidity}%` : null]
      .filter(Boolean)
      .join(' · '),
  };
});

const heroWidth = computed(() => props.widget.grid?.width ?? 8);
const heroHeight = computed(() => props.widget.grid?.height ?? 3);
const sizeClass = computed(() => Math.min(4, Math.max(2, heroHeight.value)));

// A side widget gets a column `side.width` cells wide (default 2)
const bodyStyle = computed<CSSProperties | undefined>(() => {
  if (!sideWidget.value) return undefined;
  const cells = Math.min(heroWidth.value - 1, Math.max(1, side.value?.width ?? 2));
  return { gridTemplateColumns: `1fr ${(cells / heroWidth.value) * 100}%` };
});

// ── Background ────────────────────────────────────────────────────────────────────────────────
const OVERCAST = new Set([
  'cloudy',
  'fog',
  'hail',
  'lightning',
  'lightning-rainy',
  'pouring',
  'rainy',
  'snowy',
  'snowy-rainy',
]);

/** day / dawn / dusk / night from the sun's elevation: twilight is within 6° of the horizon. */
const phase = computed(() => {
  const sunId = typeof props.widget.sun_entity === 'string' ? props.widget.sun_entity : 'sun.sun';
  const sun = haStore.states[sunId];
  const elevation = Number(sun?.attributes.elevation);
  if (!sun || !Number.isFinite(elevation)) {
    // No elevation: fall back to above/below the horizon, or the clock
    if (sun) return sun.state === 'above_horizon' ? 'day' : 'night';
    void minuteClock.value;
    const hour = new Date().getHours();
    return hour >= 7 && hour < 19 ? 'day' : 'night';
  }
  if (elevation >= 6) return 'day';
  if (elevation <= -6) return 'night';
  return sun.attributes.rising ? 'dawn' : 'dusk';
});

const overcast = computed(() => {
  const weather = weatherId.value ? haStore.states[weatherId.value] : undefined;
  return !!weather && OVERCAST.has(weather.state);
});

// ── Chips ─────────────────────────────────────────────────────────────────────────────────────
function hasActions(actions: ActionConfig | undefined) {
  const list = normalizeActions(actions);
  return list.length > 0 && list[0]!.action !== 'none';
}

const chips = computed(() => {
  const list = Array.isArray(props.widget.chips) ? (props.widget.chips as HeroChipConfig[]) : [];
  return list
    .map((config, index) => ({ config, index }))
    .filter(({ config }) => config && evaluateVisibility(config.visibility, haStore.states))
    .map(({ config, index }) => {
      const ctx = ctxFor(config.entity);
      const entity = config.entity ? haStore.states[config.entity] : undefined;
      const unit = entity?.attributes.unit_of_measurement;
      const fallback = entity ? `${entity.state}${unit ? ` ${unit}` : ''}` : '';
      const color = resolveWidgetProp(config.color, ctx);
      return {
        index,
        config,
        icon: resolveWidgetProp(config.icon, ctx),
        text: resolveWidgetProp(config.text, ctx) ?? fallback,
        color: color ? levelOrColor(color) : undefined,
        tappable: hasActions(config.tap_action),
      };
    });
});

// A chip's more_info opens its own entity unless the action names another
function openChipMoreInfo(chip: HeroChipConfig, entityId?: string) {
  moreInfoStore.open(entityId ?? chip.entity);
}

// Chips use the hero's restriction. There's no default tap; holding opens more-info by default.
function onChipTap(chip: HeroChipConfig) {
  if (!hasActions(chip.tap_action)) return;
  withUnlock(() => executeActions(chip.tap_action, {}, (id) => openChipMoreInfo(chip, id)));
}

function onChipHold(chip: HeroChipConfig) {
  if (chip.hold_action !== undefined) {
    if (hasActions(chip.hold_action)) {
      withUnlock(() => executeActions(chip.hold_action, {}, (id) => openChipMoreInfo(chip, id)));
    }
    return;
  }
  if (chip.entity) withUnlock(() => openChipMoreInfo(chip));
}
</script>

<style lang="scss">
// Default backgrounds by sun phase, greyed when the weather is overcast. A `background` on the
// widget (inline style) replaces them; themes can restyle each phase with these classes.
.widget-hero {
  color: #fff;
  background: linear-gradient(120deg, #1e3c72 0%, #2a5298 55%, #6dd5ed 130%);

  &.hero--dawn {
    background: linear-gradient(120deg, #2c3e70 0%, #8e5a8f 55%, #f0a17a 120%);
  }

  &.hero--dusk {
    background: linear-gradient(120deg, #1f1c3a 0%, #6b3a7d 50%, #e8875a 125%);
  }

  &.hero--night {
    background: linear-gradient(120deg, #0f0c29 0%, #302b63 60%, #24243e 100%);
  }

  &.hero--overcast {
    background: linear-gradient(120deg, #34495e 0%, #5d6d7e 60%, #8a99a8 130%);
  }

  &.hero--overcast.hero--dawn,
  &.hero--overcast.hero--dusk {
    background: linear-gradient(120deg, #2e3248 0%, #5e566d 55%, #9a8584 125%);
  }

  &.hero--overcast.hero--night {
    background: linear-gradient(120deg, #12161e 0%, #262d3a 60%, #343c4a 100%);
  }
}
</style>

<style lang="scss" scoped>
.widget-hero__glow {
  display: block;
  position: absolute;
  right: -60px;
  top: -80px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  pointer-events: none;
}

.widget-hero__body {
  position: relative;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  gap: 10px 16px;
  padding: 18px 22px;
}

.widget-hero__main {
  min-width: 0;
}

.widget-hero__title {
  font-size: 2.2rem;
  font-weight: 300;
  line-height: 1.1;
}

.widget-hero__subtitle {
  margin-top: 6px;
  font-size: 1rem;
  opacity: 0.75;
}

// Secondary to the title and subtitle: between the chips and the subtitle in size
.widget-hero__message {
  margin-top: 10px;
  font-size: 0.9rem;
  line-height: 1.3;
  opacity: 0.85;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.widget-hero__side {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: start;

  // A widget fills the whole side column
  &--widget {
    display: block;
    align-self: stretch;
    min-height: 0;
  }
}

.widget-hero__side-icon {
  font-size: 3.6rem;
}

.widget-hero__side-value {
  font-size: 2.6rem;
  font-weight: 300;
  line-height: 1;
  white-space: nowrap;
}

.widget-hero__side-unit {
  font-size: 1.1rem;
  margin-left: 2px;
  opacity: 0.8;
}

.widget-hero__side-label {
  margin-top: 2px;
  font-size: 0.8rem;
  opacity: 0.75;
}

.widget-hero__chips {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.widget-hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 0.8rem;
  white-space: nowrap;
  user-select: none;

  &--tappable {
    cursor: pointer;
  }
}

// Shorter heroes: smaller text, and the message moves up
.widget-hero--h2 {
  .widget-hero__body {
    padding: 12px 18px;
    gap: 6px 14px;
  }

  .widget-hero__title {
    font-size: 1.6rem;
  }

  .widget-hero__subtitle {
    margin-top: 2px;
    font-size: 0.9rem;
  }

  .widget-hero__message {
    margin-top: 4px;
    font-size: 0.8rem;
    -webkit-line-clamp: 1;
  }

  .widget-hero__side-icon {
    font-size: 2.6rem;
  }

  .widget-hero__side-value {
    font-size: 2rem;
  }
}

.widget-hero--h4 {
  .widget-hero__title {
    font-size: 2.8rem;
  }

  .widget-hero__message {
    font-size: 1rem;
    -webkit-line-clamp: 3;
  }
}
</style>
