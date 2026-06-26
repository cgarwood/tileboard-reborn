<template>
  <BaseWidget :widget="widget" :style="[backgroundStyle, { cursor: 'pointer' }]" @click="handleClick">
    <q-card-section class="widget-body q-pa-sm" :class="{ 'widget-body--micro': isMicro }">
      <div class="state-area">
        <q-icon
          :name="iconName"
          :style="iconColor ? { color: iconColor } : undefined"
          :color="iconColor ? undefined : (isOn ? 'white' : 'grey-5')"
          :size="isMicro ? '28px' : '40px'"
        />
      </div>
      <div v-if="stateBadge && !isMicro" class="state-badge" :class="{ 'state-badge--restricted': isLocked }">{{ stateBadge }}</div>
      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();
const haStore = useHomeAssistantStore();

const { title, subtitle, isOn, icon, iconColor, backgroundStyle, stateBadge } = useWidget(() => props.widget);

const iconName = computed(() => icon.value ?? (isOn.value ? 'toggle_on' : 'toggle_off'));
const { withUnlock, isLocked } = useRestriction(() => props.widget);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

function toggle() {
  if (!props.widget.entity) return;
  void haStore.callService('homeassistant', 'toggle', { entity_id: props.widget.entity });
}

function handleClick() {
  withUnlock(toggle);
}
</script>

<style lang="scss">
.widget-switch {
  background: var(--switch-widget-background);
  color: var(--text-light);

  &.state--on {
    background: var(--switch-widget-background-on);
  }
}
</style>

<style lang="scss" scoped>
@use '../css/widget';
</style>
