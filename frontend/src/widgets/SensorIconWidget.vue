<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <q-card-section class="widget-body q-pa-sm" :class="bodyClass">
      <div class="state-area">
        <q-icon :name="resolvedIcon" :color="resolvedIconColor" :size="iconSize" />
      </div>
      <div v-if="(stateBadge ?? stateDisplay) && !isMicro" class="state-badge">
        <template v-if="stateBadge">{{ stateBadge }}</template>
        <template v-else>{{ stateDisplay }}<span v-if="unitOfMeasurement" class="state-badge__unit"> {{ unitOfMeasurement }}</span></template>
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
import { useWidgetSize } from '../composables/useWidgetSize';
import { getEntityIcon } from '../utils/haIcons';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const { title, subtitle, icon, iconColor, backgroundStyle, entity, stateDisplay, unitOfMeasurement, stateBadge } = useWidget(
  () => props.widget,
);

const { size, bodyClass, iconSize } = useWidgetSize(() => props.widget);
const isMicro = computed(() => size.value === 'micro');

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
.state-badge__unit {
  opacity: 0.75;
}
</style>
