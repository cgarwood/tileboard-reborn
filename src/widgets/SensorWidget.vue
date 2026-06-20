<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <q-card-section class="widget-body q-pa-sm" :class="{ 'widget-body--micro': isMicro }">
      <div class="state-area">
        <span class="state">{{ state ?? '—' }}</span>
        <span v-if="unitOfMeasurement" class="text-caption q-ml-xs">{{ unitOfMeasurement }}</span>
      </div>
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
import { useWidget } from '../composables/useWidget';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const { title, subtitle, state, unitOfMeasurement, backgroundStyle } = useWidget(() => props.widget);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});
</script>

<style lang="scss">
.widget-sensor {
  background: var(--sensor-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';
</style>
