<template>
  <div class="more-info-light">
    <div class="more-info-light__toggle-row">
      <span class="more-info-light__toggle-label">{{ isOn ? 'On' : 'Off' }}</span>
      <q-toggle :model-value="isOn" color="primary" @update:model-value="handleToggle" />
    </div>

    <template v-if="isOn">
      <q-separator dark />

      <div v-if="supportsBrightness" class="more-info-light__section">
        <div class="more-info-light__section-header">
          <q-icon name="mdi-brightness-6" size="18px" />
          <span>Brightness</span>
          <span class="more-info-light__section-value">{{ brightnessPercent }}%</span>
        </div>
        <div class="more-info-light__brightness-track">
          <q-slider
            v-model="brightnessPercent"
            :min="1"
            :max="100"
            color="white"
            track-color="grey-8"
            @change="setBrightness"
          />
        </div>
      </div>

      <q-separator v-if="supportsBrightness && supportsColorTemp" dark />

      <div v-if="supportsColorTemp" class="more-info-light__section">
        <div class="more-info-light__section-header">
          <q-icon name="mdi-thermometer" size="18px" />
          <span>Color Temperature</span>
          <span class="more-info-light__section-value">{{ colorTempK }}K</span>
        </div>
        <div class="more-info-light__ct-track">
          <q-slider
            v-model="colorTempK"
            :min="minColorTempK"
            :max="maxColorTempK"
            :step="100"
            color="white"
            track-color="grey-8"
            @change="setColorTemp"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';

const props = defineProps<{ entityId: string }>();

const haStore = useHomeAssistantStore();
const entity = computed(() => haStore.states[props.entityId] ?? null);
const attrs = computed(() => entity.value?.attributes ?? {});

const isOn = computed(() => entity.value?.state === 'on');

const supportedColorModes = computed(
  () => (attrs.value.supported_color_modes as string[] | undefined) ?? [],
);

const BRIGHTNESS_MODES = ['brightness', 'color_temp', 'hs', 'rgb', 'rgbw', 'rgbww', 'xy', 'white'];

const supportsBrightness = computed(() =>
  supportedColorModes.value.some((m) => BRIGHTNESS_MODES.includes(m)),
);

const supportsColorTemp = computed(() => supportedColorModes.value.includes('color_temp'));

const brightnessPercent = ref(
  Math.round(((attrs.value.brightness as number | undefined) ?? 255) / 2.55),
);

watch(
  () => attrs.value.brightness as number | undefined,
  (b) => {
    if (b != null) brightnessPercent.value = Math.round(b / 2.55);
  },
);

const minColorTempK = computed(
  () => (attrs.value.min_color_temp_kelvin as number | undefined) ?? 2700,
);
const maxColorTempK = computed(
  () => (attrs.value.max_color_temp_kelvin as number | undefined) ?? 6500,
);

const colorTempK = ref((attrs.value.color_temp_kelvin as number | undefined) ?? 4000);

watch(
  () => attrs.value.color_temp_kelvin as number | undefined,
  (k) => {
    if (k != null) colorTempK.value = k;
  },
);

function handleToggle(on: boolean) {
  void haStore.callService('light', on ? 'turn_on' : 'turn_off', {
    entity_id: props.entityId,
  });
}

function setBrightness(v: number | null) {
  if (v == null) return;
  void haStore.callService('light', 'turn_on', {
    entity_id: props.entityId,
    brightness_pct: v,
  });
}

function setColorTemp(v: number | null) {
  if (v == null) return;
  void haStore.callService('light', 'turn_on', {
    entity_id: props.entityId,
    color_temp_kelvin: v,
  });
}
</script>

<style lang="scss" scoped>
.more-info-light {
  padding: 8px 0;

  &__toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
  }

  &__toggle-label {
    font-size: 1rem;
    color: var(--text-light);
  }

  &__section {
    padding: 16px 20px;
  }

  &__section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  &__section-value {
    margin-left: auto;
    color: var(--text-light);
    font-weight: 500;
  }

  &__brightness-track,
  &__ct-track {
    padding: 0 4px;
  }

  &__ct-track :deep(.q-slider__track-container) {
    background: linear-gradient(to right, #ff8c00, #ffffff, #a8d4ff);
    border-radius: 4px;
  }
}
</style>
