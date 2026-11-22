<template>
  <BaseWidget :widget="widget" :style="[backgroundStyle, { cursor: 'pointer' }]" @click="handleClick">
    <q-card-section class="widget-body q-pa-sm" :class="bodyClass">
      <div class="state-area">
        <q-icon
          :name="iconName"
          :style="iconColor ? { color: iconColor } : undefined"
          :color="iconColor ? undefined : (isOn ? 'white' : 'grey-5')"
          :size="iconSize"
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
import { useWidgetSize } from '../composables/useWidgetSize';
import { useRestriction } from '../composables/useRestriction';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();
const haStore = useHomeAssistantStore();

const { title, subtitle, isOn, icon, iconColor, backgroundStyle, stateBadge } = useWidget(() => props.widget);

const iconName = computed(() => icon.value ?? (isOn.value ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off'));
const { withUnlock, isLocked } = useRestriction(() => props.widget);

const { size, bodyClass, iconSize } = useWidgetSize(() => props.widget);
const isMicro = computed(() => size.value === 'micro');

function toggle() {
  if (!props.widget.entity) return;
  void haStore.callService('homeassistant', 'toggle', { entity_id: props.widget.entity });
}

// A configured tap_action is run by BaseWidget; this is only the default tap
function handleClick() {
  if (props.widget.tap_action !== undefined) return;
  withUnlock(() => {
    toggle();
  });
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
