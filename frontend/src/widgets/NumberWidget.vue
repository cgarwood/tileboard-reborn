<template>
  <BaseWidget
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-sm" :class="bodyClass">
      <div class="state-area">
        <div class="number-display">
          <span class="state">{{ displayValue }}</span>
          <span v-if="unitOfMeasurement" class="unit">{{ unitOfMeasurement }}</span>
        </div>
      </div>

      <div
        v-if="stateBadge && size === 'normal'"
        class="state-badge"
        :class="{ 'state-badge--restricted': isLocked }"
      >
        {{ stateBadge }}
      </div>
      <div class="label-group" :class="{ 'label-group--beside-controls': size === 'normal' }">
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
          :disable="numValue >= maxValue"
          @click.stop="withUnlock(() => adjust(step))"
        />
        <q-btn
          flat
          dense
          round
          icon="mdi-minus"
          size="xs"
          color="white"
          :disable="numValue <= minValue"
          @click.stop="withUnlock(() => adjust(-step))"
        />
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('number', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useWidgetSize } from '../composables/useWidgetSize';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';
import { roundToDecimals, stepDecimals } from '../utils/stateDisplay';

const props = defineProps<{ widget: Widget }>();

const $q = useQuasar();
const haStore = useHomeAssistantStore();
const { title, subtitle, state, unitOfMeasurement, entity, backgroundStyle, stateBadge } =
  useWidget(() => props.widget);
const { withUnlock, isLocked } = useRestriction(() => props.widget);

const { size, bodyClass } = useWidgetSize(() => props.widget);
const isMicro = computed(() => size.value === 'micro');

const numValue = computed(() => {
  const n = parseFloat(state.value ?? '');
  return isNaN(n) ? 0 : n;
});

const step = computed(() => (entity.value?.attributes.step as number | undefined) ?? 1);
// Shown with the step's precision (step 1 → "71", step 0.25 → "71.25")
const decimals = computed(() => stepDecimals(step.value));

const displayValue = computed(() =>
  state.value != null ? roundToDecimals(state.value, decimals.value) : '—',
);
const minValue = computed(() => (entity.value?.attributes.min as number | undefined) ?? -Infinity);
const maxValue = computed(() => (entity.value?.attributes.max as number | undefined) ?? Infinity);

function setValue(value: number) {
  if (!props.widget.entity) return;
  // Rounded to the step's precision, so float error from +/− (71.1 + 0.1) isn't sent
  const clamped = Number(
    Math.max(minValue.value, Math.min(maxValue.value, value)).toFixed(decimals.value),
  );
  const domain = props.widget.entity.split('.')[0] ?? 'number';
  void haStore.callService(domain, 'set_value', {
    entity_id: props.widget.entity,
    value: clamped,
  });
}

function adjust(delta: number) {
  setValue(numValue.value + delta);
}

function openPrompt() {
  $q.dialog({
    title: title.value || 'Set value',
    prompt: {
      model: String(numValue.value),
      type: 'number',
      isValid: (val: string) => val !== '' && !isNaN(Number(val)),
    },
    cancel: true,
    persistent: false,
  }).onOk((val: string) => {
    setValue(Number(val));
  });
}

// A configured tap_action is run by BaseWidget; this is only the default tap
function handleClick() {
  if (props.widget.tap_action !== undefined) return;
  withUnlock(() => {
    openPrompt();
  });
}
</script>

<style lang="scss">
.widget-number {
  background: var(--number-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
.number-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.unit {
  color: var(--text-light);
  font-size: 0.9rem;
  opacity: 0.75;
}

.speed-controls {
  position: absolute;
  bottom: 4px;
  right: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

// Keep the labels clear of the +/− column in the bottom-right corner
.label-group--beside-controls {
  right: 34px;
}

// One-row tile: value over the title on the left, the +/− buttons side by side on the right
.widget-body--short {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-content: center;
  column-gap: 8px;

  .state-area {
    position: static;
    grid-area: 1 / 1;
    justify-content: flex-start;
  }

  .number-display {
    line-height: 1.1;
  }

  .state {
    font-size: 1.25rem;
  }

  .label-group {
    position: static;
    grid-area: 2 / 1;
    min-width: 0;
  }

  .speed-controls {
    position: static;
    grid-area: 1 / 2 / 3 / 3;
    flex-direction: row;
    gap: 0;
  }
}
</style>
