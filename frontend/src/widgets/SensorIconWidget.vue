<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <q-card-section class="widget-body q-pa-sm" :class="{ 'widget-body--micro': isMicro }">
      <div class="state-area">
        <q-icon :name="resolvedIcon" :color="resolvedIconColor" :size="isMicro ? '28px' : '40px'" />
      </div>
      <div v-if="(stateBadge ?? state) && !isMicro" class="state-badge">
        <template v-if="stateBadge">{{ stateBadge }}</template>
        <template v-else>{{ state }}<span v-if="unitOfMeasurement" class="state-badge__unit"> {{ unitOfMeasurement }}</span></template>
      </div>
      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('sensor_icon', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { getEntityIcon } from '../utils/haIcons';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const { title, subtitle, icon, iconColor, backgroundStyle, entity, state, unitOfMeasurement, stateBadge } = useWidget(
  () => props.widget,
);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const resolvedIcon = computed(() => {
  // 1. Config icon (state-map / template / static)
  if (icon.value) return icon.value;

  // 2. Entity attribute icon (HA sometimes provides one, e.g. "mdi:thermometer")
  const attrIcon = entity.value?.attributes.icon;
  if (attrIcon) return attrIcon.replace(':', '-');

  // 3. Device class + domain fallback
  return getEntityIcon(entity.value);
});

const resolvedIconColor = computed(() => iconColor.value ?? 'white');
</script>

<style lang="scss">
.widget-sensor_icon {
  background: var(--sensor-icon-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.state-badge__unit {
  opacity: 0.75;
}
</style>
