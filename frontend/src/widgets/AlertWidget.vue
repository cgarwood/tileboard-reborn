<template>
  <BaseWidget
    :widget="widget"
    :class="[`level--${level}`, { 'widget-alert--pulse': pulse, 'widget-alert--tall': tall }]"
    :style="[{ background: `var(--level-${level})` }, backgroundStyle]"
  >
    <div class="widget-alert__body">
      <q-icon :name="iconName" class="widget-alert__icon" />
      <div class="widget-alert__message">{{ message }}</div>
      <div v-if="title" class="widget-alert__label subtitle">{{ title }}</div>
    </div>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('alert', { width: 4, height: 1 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import { LEVEL_ICONS, parseLevel } from '../utils/levels';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();
const { state, icon, backgroundStyle, resolveCtx } = useWidget(() => props.widget);

const level = computed(
  () => parseLevel(resolveWidgetProp(props.widget.level, resolveCtx.value)) ?? 'info',
);

const message = computed(
  () => resolveWidgetProp(props.widget.message, resolveCtx.value) ?? state.value ?? '',
);

// Only a configured title: the entity's name would just repeat what the message says
const title = computed(() =>
  props.widget.title != null ? resolveWidgetProp(props.widget.title, resolveCtx.value) : undefined,
);

const iconName = computed(() => icon.value ?? LEVEL_ICONS[level.value]);
const pulse = computed(() => props.widget.pulse === true && level.value === 'error');
const tall = computed(() => (props.widget.grid?.height ?? 1) >= 2);
</script>

<style lang="scss">
.widget-alert {
  color: var(--text-light);
}

// Draws the eye to an error without moving anything: the card brightens and dims
.widget-alert--pulse {
  animation: widget-alert-pulse 1.6s ease-in-out infinite;
}

@keyframes widget-alert-pulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.35);
  }
}
</style>

<style lang="scss" scoped>
.widget-alert__body {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 100%;
  padding: 0 14px;
}

.widget-alert__icon {
  flex-shrink: 0;
  font-size: 1.8rem;
}

.widget-alert__message {
  flex: 1;
  min-width: 0;
  font-size: 1.05rem;
  line-height: 1.25;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.widget-alert__label {
  flex-shrink: 0;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Two or more rows: larger, and the message may wrap further
.widget-alert--tall {
  .widget-alert__body {
    gap: 16px;
    padding: 0 20px;
  }

  .widget-alert__icon {
    font-size: 3rem;
  }

  .widget-alert__message {
    font-size: 1.5rem;
    -webkit-line-clamp: 4;
  }
}
</style>
