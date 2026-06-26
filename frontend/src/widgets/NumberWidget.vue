<template>
  <BaseWidget
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-sm">
      <div class="state-area">
        <div class="number-display">
          <span class="state">{{ displayValue }}</span>
          <span v-if="unitOfMeasurement" class="unit">{{ unitOfMeasurement }}</span>
        </div>
      </div>

      <div v-if="stateBadge && !isMicro" class="state-badge" :class="{ 'state-badge--restricted': isLocked }">{{ stateBadge }}</div>
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
import { useRestriction } from '../composables/useRestriction';
import { useActionExecutor } from '../composables/useActionExecutor';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const $q = useQuasar();
const haStore = useHomeAssistantStore();
const { title, subtitle, state, unitOfMeasurement, entity, backgroundStyle, stateBadge } = useWidget(
  () => props.widget,
);
const { withUnlock, isLocked } = useRestriction(() => props.widget);
const { executeActions } = useActionExecutor();

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const numValue = computed(() => {
  const n = parseFloat(state.value ?? '');
  return isNaN(n) ? 0 : n;
});

const displayValue = computed(() => state.value ?? '—');

const step = computed(() => (entity.value?.attributes.step as number | undefined) ?? 1);
const minValue = computed(() => (entity.value?.attributes.min as number | undefined) ?? -Infinity);
const maxValue = computed(() => (entity.value?.attributes.max as number | undefined) ?? Infinity);

function setValue(value: number) {
  if (!props.widget.entity) return;
  const clamped = Math.max(minValue.value, Math.min(maxValue.value, value));
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

function handleClick() {
  withUnlock(() => {
    if (props.widget.tap_action !== undefined) {
      executeActions(props.widget.tap_action);
    } else {
      openPrompt();
    }
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
@use '../css/widget';

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
</style>
