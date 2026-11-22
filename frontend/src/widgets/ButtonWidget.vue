<template>
  <BaseWidget
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-sm" :class="bodyClass">
      <div class="state-area">
        <q-icon
          :name="iconName"
          :size="iconSize"
          :style="iconColor ? { color: iconColor } : { color: 'white' }"
        />
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
registerWidgetDefaults('button', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useWidgetSize } from '../composables/useWidgetSize';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();
const haStore = useHomeAssistantStore();
const { title, subtitle, icon, iconColor, backgroundStyle } = useWidget(() => props.widget);
const { withUnlock } = useRestriction(() => props.widget);

const { size, bodyClass, iconSize } = useWidgetSize(() => props.widget);
const isMicro = computed(() => size.value === 'micro');

const iconName = computed(() => icon.value ?? 'mdi-gesture-tap');

// A configured tap_action is run by BaseWidget; this is only the default tap
function handleClick() {
  const entity = props.widget.entity;
  if (props.widget.tap_action !== undefined || !entity) return;
  withUnlock(() => void haStore.callService('button', 'press', { entity_id: entity }));
}
</script>

<style lang="scss">
.widget-button {
  background: var(--button-widget-background);
  color: var(--text-light);
}
</style>
