<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <SensorWidgetChart
      v-if="chartConfig && widget.entity"
      :entity-id="widget.entity"
      :hours="chartConfig.hours"
      :min="chartConfig.min"
      :max="chartConfig.max"
      :smoothing="chartConfig.smoothing"
      :color="chartColor"
    />
    <q-card-section class="widget-body q-pa-sm" :class="{ 'widget-body--micro': isMicro }">
      <div class="state-area">
        <span class="state">{{ state ?? '—' }}</span>
        <span v-if="unitOfMeasurement" class="text-caption q-ml-xs">{{ unitOfMeasurement }}</span>
      </div>
      <div v-if="stateBadge && !isMicro" class="state-badge">{{ stateBadge }}</div>
      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import SensorWidgetChart from '../components/widgets/SensorWidgetChart.vue';
import { useWidget } from '../composables/useWidget';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import type { PropResolveContext } from '../utils/resolveWidgetProp';
import type { Widget } from '../types/widgets';

interface SensorChartConfig {
  hours?: number;
  min?: number;
  max?: number;
  smoothing?: number;
  color?: string | Record<string, string>;
}

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();
const { title, subtitle, state, unitOfMeasurement, backgroundStyle, stateBadge } = useWidget(
  () => props.widget,
);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const chartConfig = computed((): SensorChartConfig | null => {
  const cfg = props.widget.chart;
  if (cfg === undefined || cfg === false) return null;
  const c = (typeof cfg === 'object' && !Array.isArray(cfg) && cfg !== null ? cfg : {}) as Record<string, unknown>;
  return {
    hours: c.hours as number | undefined,
    min: c.min as number | undefined,
    max: c.max as number | undefined,
    smoothing: c.smoothing as number | undefined,
    color: c.color as string | Record<string, string> | undefined,
  };
});

const NULL_ENTITY = { state: null as unknown as string, attributes: {} };

const resolveCtx = computed<PropResolveContext>(() => {
  const entityId = props.widget.entity;
  const entity = entityId ? (haStore.states[entityId] ?? null) : null;
  return {
    state: entity?.state ?? null,
    attributes: entity?.attributes ?? {},
    entity: (id) => haStore.states[id] ?? NULL_ENTITY,
    states: haStore.states,
  };
});

const chartColor = computed(() => {
  const color = chartConfig.value?.color;
  if (!color) return undefined;
  return resolveWidgetProp(color, resolveCtx.value);
});
</script>

<style lang="scss">
.widget-sensor {
  background: var(--sensor-widget-background);
  color: var(--text-light);

  &.state--on {
    background: var(--sensor-widget-background-on);
  }
}
</style>

<style lang="scss" scoped>
@use '../css/widget';
</style>
