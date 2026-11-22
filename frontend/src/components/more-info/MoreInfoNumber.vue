<template>
  <div class="more-info-number">
    <div class="more-info-number__display">
      <span class="more-info-number__value">{{ displayValue }}</span>
      <span v-if="unit" class="more-info-number__unit">{{ unit }}</span>
    </div>

    <div class="more-info-number__slider-wrap">
      <q-slider
        v-model="sliderValue"
        :min="min"
        :max="max"
        :step="step"
        color="primary"
        @change="setValue"
      />
    </div>

    <div class="more-info-number__controls">
      <q-btn flat round icon="mdi-minus" :disable="sliderValue <= min" @click="adjust(-step)" />
      <q-input
        v-model.number="inputValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        dense
        outlined
        dark
        class="more-info-number__input"
        @blur="commitInput"
        @keyup.enter="commitInput"
      />
      <q-btn flat round icon="mdi-plus" :disable="sliderValue >= max" @click="adjust(step)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { stepDecimals } from '../../utils/stateDisplay';

const props = defineProps<{ entityId: string }>();

const haStore = useHomeAssistantStore();
const entity = computed(() => haStore.states[props.entityId] ?? null);

const min = computed(() => entity.value?.attributes.min ?? 0);
const max = computed(() => entity.value?.attributes.max ?? 100);
const step = computed(() => entity.value?.attributes.step ?? 1);
const unit = computed(() => entity.value?.attributes.unit_of_measurement ?? '');

const currentValue = computed(() => {
  const v = parseFloat(entity.value?.state ?? '');
  return isNaN(v) ? min.value : v;
});

const sliderValue = ref(currentValue.value);
const inputValue = ref(currentValue.value);

watch(currentValue, (v) => {
  sliderValue.value = v;
  inputValue.value = v;
});

// Shown with the step's precision (step 1 → "71", step 0.25 → "71.25")
const decimals = computed(() => stepDecimals(step.value));
const displayValue = computed(() => currentValue.value.toFixed(decimals.value));

const serviceDomain = computed(() => props.entityId.split('.')[0] ?? 'number');

function setValue(v: number | null) {
  if (v == null) return;
  void haStore.callService(serviceDomain.value, 'set_value', {
    entity_id: props.entityId,
    value: v,
  });
}

function adjust(delta: number) {
  // Rounded to the step's precision, so float error from repeated steps isn't sent
  const next = Number(
    Math.min(max.value, Math.max(min.value, sliderValue.value + delta)).toFixed(decimals.value),
  );
  sliderValue.value = next;
  inputValue.value = next;
  setValue(next);
}

function commitInput() {
  const v = Math.min(max.value, Math.max(min.value, inputValue.value));
  sliderValue.value = v;
  inputValue.value = v;
  setValue(v);
}
</script>

<style lang="scss" scoped>
.more-info-number {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
  }

  &__value {
    font-size: 3rem;
    font-weight: 300;
    color: var(--text-light);
    line-height: 1;
  }

  &__unit {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.6);
  }

  &__slider-wrap {
    padding: 0 8px;
  }

  &__controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  &__input {
    width: 100px;
    text-align: center;

    :deep(input) {
      text-align: center;
    }
  }
}
</style>
