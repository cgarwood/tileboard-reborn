<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <q-card-section
      class="widget-body q-pa-sm"
      :class="{ 'widget-body--micro': isMicro }"
      @click="handleClick"
    >
      <div class="state-area">
        <q-icon :name="resolvedIcon" :color="resolvedIconColor" :size="isMicro ? '28px' : '40px'" />
      </div>
      <div v-if="state && !isMicro" class="state-badge" :class="{ 'state-badge--restricted': isLocked }">{{ state }}</div>
      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('lock', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';

const STATE_ICONS: Record<string, string> = {
  locked: 'mdi-lock',
  unlocked: 'mdi-lock-open',
  jammed: 'mdi-lock-alert',
  locking: 'mdi-lock-clock',
  unlocking: 'mdi-lock-clock',
};

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();
const { title, subtitle, icon, iconColor, backgroundStyle, state } = useWidget(
  () => props.widget,
);
const { withUnlock, isLocked } = useRestriction(() => props.widget);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const resolvedIcon = computed(() => icon.value ?? STATE_ICONS[state.value ?? ''] ?? 'mdi-lock');

const resolvedIconColor = computed(() => iconColor.value ?? 'white');

function execute() {
  if (!props.widget.entity) return;
  const service = state.value === 'unlocked' ? 'lock' : 'unlock';
  void haStore.callService('lock', service, { entity_id: props.widget.entity });
}

function handleClick() {
  withUnlock(execute);
}
</script>

<style lang="scss">
.widget-lock {
  background: var(--lock-widget-background);
  color: var(--text-light);
  cursor: pointer;

  &.state--locked {
    background: var(--lock-widget-background-locked);
  }
  &.state--jammed {
    background: var(--lock-widget-background-jammed);
  }
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.state-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.35);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
  color: inherit;

  &--restricted {
    right: 24px;
  }
}
</style>
