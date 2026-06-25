<template>
  <BaseWidget
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-sm" :class="{ 'widget-body--micro': isMicro }">
      <div class="state-area">
        <q-icon
          :name="iconName"
          :size="isMicro ? '28px' : '40px'"
          :style="{ opacity: isOn ? iconOpacity : 0.45 }"
          color="white"
        />
      </div>

      <div v-if="badgeText && !isMicro" class="state-badge" :class="{ 'state-badge--restricted': isLocked }">{{ badgeText }}</div>
      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>

      <div v-if="supportsDimming && !isMicro" class="dim-controls" @click.stop>
        <q-btn
          flat dense round
          icon="mdi-plus"
          size="xs"
          color="white"
          :disable="!isOn || brightnessPercent >= 100"
          @click.stop="adjustBrightness(step)"
        />
        <q-btn
          flat dense round
          icon="mdi-minus"
          size="xs"
          color="white"
          :disable="!isOn || brightnessPercent <= 0"
          @click.stop="adjustBrightness(-step)"
        />
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('light', { width: 2, height: 2 });
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
const { title, subtitle, icon, isOn, entity, backgroundStyle, stateBadge } = useWidget(() => props.widget);
const { withUnlock, isLocked } = useRestriction(() => props.widget);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const supportsDimming = computed(() => {
  const modes = entity.value?.attributes.supported_color_modes as string[] | undefined;
  if (!modes) return false;
  return modes.some((m) => m !== 'onoff' && m !== 'unknown');
});

// HA brightness is 0–255; convert to 0–100%
const brightnessPercent = computed(() => {
  const b = entity.value?.attributes.brightness as number | undefined;
  if (b == null) return 0;
  return Math.round((b / 255) * 100);
});

// Dim the icon when light is at lower brightness
const iconOpacity = computed(() => {
  if (!supportsDimming.value || !isOn.value) return 1;
  return 0.4 + (brightnessPercent.value / 100) * 0.6;
});

const step = computed(() => (props.widget.step as number | undefined) ?? 10);

const iconName = computed(() => icon.value ?? (isOn.value ? 'mdi-lightbulb' : 'mdi-lightbulb-off-outline'));

const badgeText = computed(() => {
  if (stateBadge.value != null) return stateBadge.value;
  if (isOn.value && supportsDimming.value) return `${brightnessPercent.value}%`;
  return null;
});

function toggle() {
  if (!props.widget.entity) return;
  void haStore.callService('homeassistant', 'toggle', { entity_id: props.widget.entity });
}

function adjustBrightness(delta: number) {
  if (!props.widget.entity) return;
  const next = Math.max(1, Math.min(100, brightnessPercent.value + delta));
  void haStore.callService('light', 'turn_on', {
    entity_id: props.widget.entity,
    brightness_pct: next,
  });
}

function handleClick() {
  withUnlock(toggle);
}
</script>

<style lang="scss">
.widget-light {
  background: var(--light-widget-background);
  color: var(--text-light);

  &.state--on {
    background: var(--light-widget-background-on);
  }
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.dim-controls {
  position: absolute;
  bottom: 4px;
  right: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
</style>
