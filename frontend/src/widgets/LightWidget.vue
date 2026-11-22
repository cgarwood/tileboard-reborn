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
          :style="{ opacity: isOn ? iconOpacity : 0.45 }"
          color="white"
        />
      </div>

      <div v-if="badgeText && !isMicro" class="state-badge" :class="{ 'state-badge--restricted': isLocked }">{{ badgeText }}</div>
      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>

      <div v-if="supportsDimming && showControls" class="dim-controls" @click.stop>
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
import { useWidgetSize } from '../composables/useWidgetSize';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();
const { title, subtitle, icon, isOn, entity, backgroundStyle, stateBadge } = useWidget(() => props.widget);
const { withUnlock, isLocked } = useRestriction(() => props.widget);

const { size, width, bodyClass, iconSize } = useWidgetSize(() => props.widget);
const isMicro = computed(() => size.value === 'micro');
// A one-row tile only has room for the +/− buttons (in a row) when it's at least 3 wide
const showControls = computed(
  () => size.value === 'normal' || (size.value === 'short' && width.value >= 3),
);

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

// A configured tap_action is run by BaseWidget; this is only the default tap
function handleClick() {
  if (props.widget.tap_action !== undefined) return;
  withUnlock(() => {
    toggle();
  });
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
.dim-controls {
  position: absolute;
  bottom: 4px;
  right: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

// One-row tile: the buttons sit side by side after the badge
.widget-body--short .dim-controls {
  position: static;
  order: 3;
  flex: none;
  flex-direction: row;
  gap: 0;
}
</style>
