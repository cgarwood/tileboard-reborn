<template>
  <BaseWidget
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-sm">
      <div class="state-area">
        <q-icon
          :name="iconName"
          :size="isMicro ? '28px' : '40px'"
          color="white"
          :class="{
            'fan-spin': isOn,
            'fan-spin--fast': isOn && percentage >= 66,
            'fan-spin--slow': isOn && percentage < 34,
          }"
        />
      </div>

      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>

      <div v-if="!isMicro" class="speed-controls" @click.stop>
        <q-btn
          flat
          dense
          round
          icon="mdi-plus"
          size="xs"
          color="white"
          :disable="!isOn || percentage >= 100"
          @click.stop="adjustSpeed(step)"
        />
        <q-btn
          flat
          dense
          round
          icon="mdi-minus"
          size="xs"
          color="white"
          :disable="!isOn || percentage <= 0"
          @click.stop="adjustSpeed(-step)"
        />
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('fan', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();
const { title, subtitle, icon, isOn, entity, backgroundStyle } = useWidget(() => props.widget);
const { withUnlock } = useRestriction(() => props.widget);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const percentage = computed(() => (entity.value?.attributes.percentage as number | undefined) ?? 0);

const step = computed(() => {
  const attr = entity.value?.attributes.percentage_step as number | undefined;
  return attr ?? 33;
});

const iconName = computed(() => icon.value ?? (isOn.value ? 'mdi-fan' : 'mdi-fan-off'));

function toggle() {
  if (!props.widget.entity) return;
  void haStore.callService('homeassistant', 'toggle', { entity_id: props.widget.entity });
}

function adjustSpeed(delta: number) {
  if (!props.widget.entity) return;
  const next = Math.max(0, Math.min(100, percentage.value + delta));
  void haStore.callService('fan', 'set_percentage', {
    entity_id: props.widget.entity,
    percentage: next,
  });
}

function handleClick() {
  withUnlock(toggle);
}
</script>

<style lang="scss">
.widget-fan {
  background: var(--fan-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.speed-controls {
  position: absolute;
  bottom: 4px;
  right: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

@keyframes fan-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fan-spin {
  animation: fan-rotate 2.5s linear infinite;

  &--slow {
    animation-duration: 3s;
  }

  &--fast {
    animation-duration: 1s;
  }
}
</style>
