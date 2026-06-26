<template>
  <BaseWidget
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-sm" :class="{ 'widget-body--micro': isMicro }">
      <div class="state-area">
        <q-icon :name="iconName" :size="isMicro ? '28px' : '40px'" :style="iconColor ? { color: iconColor } : { color: 'white' }" />
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
import { useRestriction } from '../composables/useRestriction';
import { useActionExecutor } from '../composables/useActionExecutor';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';
import type { TapAction } from '../types/actions';

const props = defineProps<{ widget: Widget }>();
const haStore = useHomeAssistantStore();
const { title, subtitle, icon, iconColor, backgroundStyle } = useWidget(() => props.widget);
const { withUnlock } = useRestriction(() => props.widget);
const { executeActions } = useActionExecutor();

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const iconName = computed(() => icon.value ?? 'mdi-gesture-tap');

function execute() {
  if (props.widget.entity) {
    void haStore.callService('button', 'press', { entity_id: props.widget.entity });
    return;
  }
  executeActions(props.widget.tap_action as TapAction | TapAction[] | undefined);
}

function handleClick() {
  withUnlock(execute);
}
</script>

<style lang="scss">
.widget-button {
  background: var(--button-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';
</style>
