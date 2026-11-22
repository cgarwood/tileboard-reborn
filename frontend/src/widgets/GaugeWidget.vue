<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <div class="widget-gauge__dial" :class="{ 'widget-gauge__dial--labelled': title || subtitle }">
      <svg viewBox="0 0 100 100" class="widget-gauge__svg" role="img" :aria-label="ariaLabel">
        <circle
          cx="50"
          cy="50"
          :r="RADIUS"
          class="widget-gauge__track"
          :stroke-dasharray="`${sweepLength} ${CIRCUMFERENCE}`"
          :transform="`rotate(${startAngle} 50 50)`"
        />
        <circle
          v-if="fraction > 0"
          cx="50"
          cy="50"
          :r="RADIUS"
          class="widget-gauge__value"
          :stroke="color"
          :stroke-dasharray="`${fraction * sweepLength} ${CIRCUMFERENCE}`"
          :transform="`rotate(${startAngle} 50 50)`"
        />
        <text x="50" :y="shape === 'arc' ? 54 : 50" class="widget-gauge__text">
          <!-- Separate tspans so no space is rendered between the value and its unit -->
          <tspan>{{ displayValue }}</tspan>
          <tspan v-if="unit && numeric != null" class="widget-gauge__unit">{{ unit }}</tspan>
        </text>
      </svg>
    </div>
    <div v-if="title || subtitle" class="label-group">
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
      <div v-if="title" class="title ellipsis">{{ title }}</div>
    </div>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('gauge', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import { levelOrColor } from '../utils/levels';
import type { Widget } from '../types/widgets';

interface GaugeSegment {
  from: number;
  color: string;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const props = defineProps<{ widget: Widget }>();
const { title, subtitle, state, unitOfMeasurement, backgroundStyle, resolveCtx } = useWidget(
  () => props.widget,
);

const num = (v: unknown, fallback: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const min = computed(() => num(props.widget.min, 0));
const max = computed(() => num(props.widget.max, 100));

// `ring` is a full circle starting at the top; `arc` is a 270° sweep open at the bottom
const shape = computed(() => (props.widget.shape === 'arc' ? 'arc' : 'ring'));
const sweepLength = computed(() => CIRCUMFERENCE * (shape.value === 'arc' ? 0.75 : 1));
const startAngle = computed(() => (shape.value === 'arc' ? 135 : -90));

const rawValue = computed(() =>
  props.widget.value !== undefined
    ? resolveWidgetProp(props.widget.value, resolveCtx.value)
    : (state.value ?? undefined),
);

/** The value as a number, or null when it isn't one (unavailable, unknown, text). */
const numeric = computed(() => {
  const raw = rawValue.value;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
});

const fraction = computed(() => {
  if (numeric.value == null || max.value <= min.value) return 0;
  return Math.min(1, Math.max(0, (numeric.value - min.value) / (max.value - min.value)));
});

const displayValue = computed(() => {
  if (numeric.value == null) return '—';
  const decimals = props.widget.decimals;
  return typeof decimals === 'number' ? numeric.value.toFixed(decimals) : String(rawValue.value);
});

const unit = computed(() =>
  props.widget.unit !== undefined
    ? resolveWidgetProp(props.widget.unit, resolveCtx.value)
    : unitOfMeasurement.value || undefined,
);

const segments = computed<GaugeSegment[]>(() => {
  const list = props.widget.segments;
  if (!Array.isArray(list)) return [];
  return (list as Partial<GaugeSegment>[])
    .filter((s) => typeof s?.color === 'string' && Number.isFinite(Number(s.from)))
    .map((s) => ({ from: Number(s.from), color: s.color! }))
    .sort((a, b) => a.from - b.from);
});

// `color` wins; otherwise the highest segment the value reaches; otherwise the info color.
// Level names use the lighter ring shades, which read better on the dark tile.
const color = computed(() => {
  const configured = resolveWidgetProp(props.widget.color, resolveCtx.value);
  if (configured) return levelOrColor(configured, 'bright');
  const value = numeric.value;
  const segment = value == null ? undefined : segments.value.filter((s) => value >= s.from).pop();
  return levelOrColor(segment?.color ?? 'info', 'bright');
});

const ariaLabel = computed(() => `${displayValue.value}${unit.value ?? ''}`);
</script>

<style lang="scss">
.widget-gauge {
  background: var(--gauge-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
.widget-gauge__dial {
  position: absolute;
  inset: 8px;

  // Leave room for the title in the bottom-left corner
  &--labelled {
    bottom: 26px;
  }
}

.widget-gauge__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.widget-gauge__track,
.widget-gauge__value {
  fill: none;
  stroke-width: 9;
}

.widget-gauge__track {
  stroke: rgba(255, 255, 255, 0.14);
  stroke-linecap: round;
}

.widget-gauge__value {
  stroke-linecap: round;
  transition:
    stroke-dasharray 0.8s ease,
    stroke 0.8s ease;
}

.widget-gauge__text {
  fill: currentColor;
  font-size: 20px;
  text-anchor: middle;
  dominant-baseline: central;
}

.widget-gauge__unit {
  font-size: 11px;
  opacity: 0.8;
}
</style>
