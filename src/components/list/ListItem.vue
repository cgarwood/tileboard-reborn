<template>
  <div class="li-wrapper">
    <div class="li-row">
      <div class="li-icon-wrap">
        <q-icon
          :name="resolvedIcon"
          size="20px"
          color="white"
          :style="{ opacity: iconOpacity }"
        />
        <q-icon
          v-if="isLocked"
          name="mdi-lock"
          size="10px"
          color="white"
          class="li-lock-badge"
        />
      </div>

      <div class="li-content">
        <div class="li-name">{{ resolvedName }}</div>
        <div v-if="resolvedCaption" class="li-caption">{{ resolvedCaption }}</div>
      </div>

      <div v-if="showStateText" class="li-state">{{ resolvedState }}</div>

      <div v-if="showToggle" class="li-controls" @click.stop>
        <q-toggle
          dense
          :model-value="isOn"
          color="white"
          @update:model-value="handleToggle"
        />
      </div>
    </div>

    <!-- Brightness slider -->
    <div v-if="hasBrightnessSlider && entityData" class="li-feature-row" @click.stop>
      <q-icon name="mdi-brightness-6" size="14px" class="li-feature-icon" />
      <q-slider
        :model-value="displayBrightness"
        :min="1"
        :max="100"
        :step="1"
        :disable="!isOn"
        dense
        thumb-size="14px"
        color="white"
        track-color="rgba(255,255,255,0.2)"
        class="li-slider"
        @update:model-value="pendingBrightness = $event"
        @change="onBrightnessChange"
      />
      <span class="li-brightness-val">{{ displayBrightness }}%</span>
    </div>

    <!-- Color presets -->
    <div v-if="colorPresets.length" class="li-feature-row li-presets" @click.stop>
      <button
        v-for="preset in colorPresets"
        :key="preset.name"
        class="li-preset-btn"
        :style="presetColors(preset)"
        @click="applyPreset(preset)"
      >
        {{ preset.name }}
      </button>
    </div>

    <q-separator style="opacity: 0.1" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { useRestriction } from '../../composables/useRestriction';
import { resolveWidgetProp } from '../../utils/resolveWidgetProp';
import type { ListItemConfig, ColorPreset } from '../../types/list-widget';
import type { Widget } from '../../types/widgets';
import type { PropResolveContext } from '../../utils/resolveWidgetProp';

const props = defineProps<{ item: ListItemConfig }>();

const haStore = useHomeAssistantStore();

const NULL_ENTITY = { state: null as unknown as string, attributes: {} };

const { withUnlock, isLocked } = useRestriction(
  (() => ({ restriction: props.item.restriction })) as unknown as () => Widget,
);

// Entity data
const entityData = computed(() =>
  props.item.entity ? (haStore.states[props.item.entity] ?? null) : null,
);
const entityState = computed(() => entityData.value?.state ?? null);
const entityAttrs = computed(
  () => (entityData.value?.attributes ?? {}) as Record<string, unknown>,
);
const domain = computed(() => props.item.entity?.split('.')[0] ?? '');

// Periodic refresh for custom JS state templates
const refreshTick = ref(0);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  const interval = props.item.refresh_interval;
  if (interval && props.item.state) {
    refreshTimer = setInterval(() => { refreshTick.value++; }, interval);
  }
});

onUnmounted(() => {
  if (refreshTimer !== null) clearInterval(refreshTimer);
});

const resolveCtx = computed<PropResolveContext>(() => {
  void refreshTick.value;
  return {
    state: entityState.value,
    attributes: entityAttrs.value,
    entity: (id) => haStore.states[id] ?? NULL_ENTITY,
    states: haStore.states,
  };
});

// Domain classification
const TOGGLEABLE = new Set(['light', 'switch', 'fan', 'input_boolean', 'automation', 'cover']);
const SENSOR_LIKE = new Set(['sensor', 'binary_sensor', 'number', 'input_number']);

const isToggleable = computed(() => TOGGLEABLE.has(domain.value));
const isSensor = computed(() => SENSOR_LIKE.has(domain.value));
const isOn = computed(() => entityState.value === 'on');

// Auto icon map
const AUTO_ICONS: Record<string, string> = {
  light: 'mdi-lightbulb',
  switch: 'mdi-toggle-switch',
  fan: 'mdi-fan',
  sensor: 'mdi-chart-line',
  binary_sensor: 'mdi-radiobox-marked',
  input_boolean: 'mdi-toggle-switch',
  automation: 'mdi-robot',
  script: 'mdi-script-text',
  media_player: 'mdi-speaker',
  climate: 'mdi-thermostat',
  cover: 'mdi-window-shutter',
  number: 'mdi-numeric',
  input_number: 'mdi-numeric',
};

const resolvedIcon = computed(
  () =>
    resolveWidgetProp(props.item.icon, resolveCtx.value) ??
    AUTO_ICONS[domain.value] ??
    'mdi-help-circle-outline',
);

const entityMissing = computed(() => !!props.item.entity && entityData.value === null);

const resolvedName = computed(() => {
  if (props.item.name != null) {
    return resolveWidgetProp(props.item.name, resolveCtx.value) ?? '';
  }
  if (entityMissing.value) return 'Invalid entity';
  return (entityAttrs.value.friendly_name as string | undefined) ?? 'Unknown';
});

const resolvedCaption = computed(() => {
  if (props.item.caption != null) {
    return resolveWidgetProp(props.item.caption, resolveCtx.value) ?? '';
  }
  if (entityMissing.value) return props.item.entity ?? '';
  return '';
});

const hasStateOverride = computed(() => props.item.state != null);

const resolvedState = computed(() => {
  if (hasStateOverride.value) {
    return resolveWidgetProp(props.item.state!, resolveCtx.value) ?? '';
  }
  if (!entityData.value) return '';
  if (isSensor.value) {
    const unit = entityAttrs.value.unit_of_measurement as string | undefined;
    return unit ? `${entityData.value.state} ${unit}` : entityData.value.state;
  }
  return '';
});

const showToggle = computed(() => isToggleable.value && !hasStateOverride.value);
const showStateText = computed(
  () => !!resolvedState.value && (hasStateOverride.value || isSensor.value || !props.item.entity),
);

const iconOpacity = computed(() => {
  if (!isToggleable.value) return 0.9;
  return isOn.value ? 1 : 0.35;
});

// Light dimming
const supportsDimming = computed(() => {
  if (domain.value !== 'light') return false;
  const modes = entityAttrs.value.supported_color_modes as string[] | undefined;
  return modes?.some((m) => m !== 'onoff' && m !== 'unknown') ?? false;
});

const brightnessPercent = computed(() => {
  const b = entityAttrs.value.brightness as number | undefined;
  return b != null ? Math.round((b / 255) * 100) : 0;
});

const pendingBrightness = ref<number | null>(null);
const displayBrightness = computed(() => pendingBrightness.value ?? brightnessPercent.value);

// Features
const hasBrightnessSlider = computed(
  () => supportsDimming.value && (props.item.features?.includes('brightness_slider') ?? false),
);

const colorPresets = computed((): ColorPreset[] => {
  for (const f of props.item.features ?? []) {
    if (typeof f === 'object' && 'color_presets' in f) return f.color_presets;
  }
  return [];
});

// Actions
function toggle() {
  if (!props.item.entity) return;
  void haStore.callService('homeassistant', 'toggle', { entity_id: props.item.entity });
}

function handleToggle() {
  withUnlock(toggle);
}

function onBrightnessChange(value: number | null) {
  pendingBrightness.value = null;
  if (value == null || !props.item.entity) return;
  void haStore.callService('light', 'turn_on', {
    entity_id: props.item.entity,
    brightness_pct: value,
  });
}

function applyPreset(preset: ColorPreset) {
  if (!props.item.entity) return;
  const serviceData: Record<string, unknown> = { entity_id: props.item.entity };
  if (preset.color_temp != null) serviceData.color_temp_kelvin = preset.color_temp;
  if (preset.rgb != null) serviceData.rgb_color = preset.rgb;
  withUnlock(() => {
    void haStore.callService('light', 'turn_on', serviceData);
  });
}

function contrastColor(r: number, g: number, b: number): 'black' | 'white' {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.179 ? 'black' : 'white';
}

function presetColors(preset: ColorPreset): { background: string; color: string } {
  if (preset.rgb) {
    const [r, g, b] = preset.rgb;
    return { background: `rgb(${r},${g},${b})`, color: contrastColor(r, g, b) };
  }
  if (preset.color_temp) {
    const [r, g, b] =
      preset.color_temp < 3500 ? [255, 200, 120] :
      preset.color_temp > 5500 ? [200, 222, 255] :
                                  [255, 244, 220];
    return { background: `rgb(${r},${g},${b})`, color: contrastColor(r, g, b) };
  }
  return { background: 'rgba(255,255,255,0.2)', color: 'white' };
}
</script>

<style lang="scss" scoped>
.li-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 4px 8px 4px 12px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.li-icon-wrap {
  flex: 0 0 22px;
  position: relative;
  display: flex;
  align-items: center;
}

.li-lock-badge {
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0.85;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
  pointer-events: none;
}

.li-content {
  flex: 1;
  min-width: 0;
}

.li-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.li-caption {
  font-size: 0.72rem;
  opacity: 0.55;
  color: white;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.li-state {
  flex: 0 0 auto;
  max-width: 90px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.li-controls {
  flex: 0 0 auto;
}

.li-feature-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 12px 6px 48px;
  color: white;
}

.li-feature-icon {
  opacity: 0.55;
  flex-shrink: 0;
}

.li-slider {
  flex: 1;
}

.li-brightness-val {
  font-size: 0.72rem;
  opacity: 0.55;
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.li-presets {
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 0;
}

.li-preset-btn {
  border: none;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.72rem;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.8;
  }
}
</style>
