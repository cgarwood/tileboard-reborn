<template>
  <BaseWidget :widget="widget" :style="activeBackgroundStyle">
    <q-card-section class="widget-body q-pa-sm climate-widget" :class="`climate-widget--${layout}`">

      <div class="climate-widget__status">
        <q-icon class="climate-widget__mode-icon" :name="hvacModeIcon" />
        <div class="climate-widget__current">
          <span class="climate-widget__temp">{{ currentTempDisplay }}</span>
          <span class="climate-widget__unit">{{ tempUnit }}</span>
        </div>
      </div>

      <!-- Compact: setpoint display only, no interactive controls -->
      <div v-if="layout === 'compact'" class="climate-widget__setpoint-compact">
        {{ isRangeMode ? `${targetTempLowDisplay}–${targetTempHighDisplay}` : targetTempDisplay }}
      </div>

      <!-- Non-compact: interactive controls -->
      <div v-else class="climate-widget__controls">

        <div v-if="features.setpoint" class="climate-widget__setpoint">
          <template v-if="isRangeMode">
            <div class="climate-widget__setpoint-group">
              <q-btn flat dense round icon="mdi-minus" size="xs" color="white" @click.stop="adjustTempHigh(-tempStep)" />
              <span class="climate-widget__setpoint-val">
                {{ targetTempHighDisplay }}<q-icon name="mdi-fire" size="11px" class="q-ml-xs" />
              </span>
              <q-btn flat dense round icon="mdi-plus" size="xs" color="white" @click.stop="adjustTempHigh(tempStep)" />
            </div>
            <div class="climate-widget__setpoint-group">
              <q-btn flat dense round icon="mdi-minus" size="xs" color="white" @click.stop="adjustTempLow(-tempStep)" />
              <span class="climate-widget__setpoint-val">
                {{ targetTempLowDisplay }}<q-icon name="mdi-snowflake" size="11px" class="q-ml-xs" />
              </span>
              <q-btn flat dense round icon="mdi-plus" size="xs" color="white" @click.stop="adjustTempLow(tempStep)" />
            </div>
          </template>
          <template v-else>
            <div class="climate-widget__setpoint-group">
              <q-btn flat dense round icon="mdi-minus" size="xs" color="white" @click.stop="adjustSetpoint(-tempStep)" />
              <span class="climate-widget__setpoint-val">{{ targetTempDisplay }}</span>
              <q-btn flat dense round icon="mdi-plus" size="xs" color="white" @click.stop="adjustSetpoint(tempStep)" />
            </div>
          </template>
        </div>

        <div v-if="features.mode && hvacModes.length" class="climate-widget__modes">
          <q-btn
            v-for="mode in hvacModes"
            :key="mode"
            flat
            dense
            round
            :icon="HVAC_MODE_ICONS[mode] ?? 'mdi-thermostat'"
            :color="hvacMode === mode ? 'white' : 'grey-6'"
            size="sm"
            @click.stop="setMode(mode)"
          >
            <q-tooltip>{{ mode }}</q-tooltip>
          </q-btn>
        </div>

        <div v-if="features.fan_mode && fanModes.length" class="climate-widget__fan">
          <q-btn
            v-for="mode in fanModes"
            :key="mode"
            flat
            dense
            round
            :icon="FAN_MODE_ICONS[mode] ?? 'mdi-fan'"
            :color="fanMode === mode ? 'white' : 'grey-6'"
            size="sm"
            @click.stop="setFanMode(mode)"
          >
            <q-tooltip>{{ mode }}</q-tooltip>
          </q-btn>
        </div>

      </div>

      <div class="label-group">
        <div v-if="subtitle && layout !== 'compact'" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>

    </q-card-section>
  </BaseWidget>

</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('climate', { width: 4, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { getWidgetDefaults } from '../utils/widgetRegistry';
import type { Widget } from '../types/widgets';

interface ClimateFeatures {
  mode?: boolean;
  setpoint?: boolean;
  fan_mode?: boolean;
}

const HVAC_MODE_ICONS: Record<string, string> = {
  heat: 'mdi-fire',
  cool: 'mdi-snowflake',
  heat_cool: 'mdi-autorenew',
  auto: 'mdi-thermostat-auto',
  off: 'mdi-power',
  fan_only: 'mdi-fan',
  dry: 'mdi-water-off-outline',
};

const FAN_MODE_ICONS: Record<string, string> = {
  auto: 'mdi-fan-auto',
  on: 'mdi-fan',
  low: 'mdi-fan-speed-1',
  medium: 'mdi-fan-speed-2',
  high: 'mdi-fan-speed-3',
  off: 'mdi-fan-off',
};

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();
const { title, subtitle, entity, background } = useWidget(() => props.widget);
const { withUnlock } = useRestriction(() => props.widget);

const layout = computed(() => {
  const defaults = getWidgetDefaults('climate');
  const w = props.widget.grid?.width ?? defaults.width ?? 4;
  const h = props.widget.grid?.height ?? defaults.height ?? 2;
  if (w <= 3 && h <= 3) return 'compact';
  if (h >= 4) return 'vertical';
  return 'wide';
});

const features = computed<Required<ClimateFeatures>>(() => {
  const f = props.widget.features as ClimateFeatures | undefined;
  return {
    mode: f?.mode !== false,
    setpoint: f?.setpoint !== false,
    fan_mode: f?.fan_mode === true,
  };
});

const hvacMode = computed(() => entity.value?.state ?? null);
const hvacAction = computed(() => entity.value?.attributes.hvac_action as string | undefined);
const hvacModes = computed(() => (entity.value?.attributes.hvac_modes as string[] | undefined) ?? []);
const fanMode = computed(() => entity.value?.attributes.fan_mode as string | undefined);
const fanModes = computed(() => (entity.value?.attributes.fan_modes as string[] | undefined) ?? []);
const tempUnit = computed(() => (entity.value?.attributes.temperature_unit as string | undefined) ?? '°F');
const tempStep = computed(() => (entity.value?.attributes.target_temp_step as number | undefined) ?? 1);
const isRangeMode = computed(() => hvacMode.value === 'heat_cool');

const currentTemp = computed(() => entity.value?.attributes.current_temperature as number | undefined);
const targetTemp = computed(() => entity.value?.attributes.temperature as number | undefined);
const targetTempHigh = computed(() => entity.value?.attributes.target_temp_high as number | undefined);
const targetTempLow = computed(() => entity.value?.attributes.target_temp_low as number | undefined);

const currentTempDisplay = computed(() =>
  currentTemp.value != null ? `${Math.round(currentTemp.value)}` : '—',
);
const targetTempDisplay = computed(() =>
  targetTemp.value != null ? `${Math.round(targetTemp.value)}°` : '—°',
);
const targetTempHighDisplay = computed(() =>
  targetTempHigh.value != null ? `${Math.round(targetTempHigh.value)}°` : '—°',
);
const targetTempLowDisplay = computed(() =>
  targetTempLow.value != null ? `${Math.round(targetTempLow.value)}°` : '—°',
);

const hvacModeIcon = computed(() => HVAC_MODE_ICONS[hvacMode.value ?? ''] ?? 'mdi-thermostat');

const activeBackgroundStyle = computed(() => {
  if (background.value) return { background: background.value };
  const action = hvacAction.value;
  if (action === 'heating') return { background: 'var(--climate-heating-background)' };
  if (action === 'cooling') return { background: 'var(--climate-cooling-background)' };
  return { background: 'var(--climate-widget-background)' };
});

function setMode(mode: string) {
  withUnlock(() => {
    if (!props.widget.entity) return;
    void haStore.callService('climate', 'set_hvac_mode', {
      entity_id: props.widget.entity,
      hvac_mode: mode,
    });
  });
}

function adjustSetpoint(delta: number) {
  withUnlock(() => {
    if (!props.widget.entity || targetTemp.value == null) return;
    void haStore.callService('climate', 'set_temperature', {
      entity_id: props.widget.entity,
      temperature: targetTemp.value + delta,
    });
  });
}

function adjustTempHigh(delta: number) {
  withUnlock(() => {
    if (!props.widget.entity || targetTempHigh.value == null) return;
    void haStore.callService('climate', 'set_temperature', {
      entity_id: props.widget.entity,
      target_temp_high: targetTempHigh.value + delta,
      target_temp_low: targetTempLow.value,
    });
  });
}

function adjustTempLow(delta: number) {
  withUnlock(() => {
    if (!props.widget.entity || targetTempLow.value == null) return;
    void haStore.callService('climate', 'set_temperature', {
      entity_id: props.widget.entity,
      target_temp_high: targetTempHigh.value,
      target_temp_low: targetTempLow.value + delta,
    });
  });
}

function setFanMode(mode: string) {
  withUnlock(() => {
    if (!props.widget.entity) return;
    void haStore.callService('climate', 'set_fan_mode', {
      entity_id: props.widget.entity,
      fan_mode: mode,
    });
  });
}
</script>

<style lang="scss">
.widget-climate {
  background: var(--climate-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.climate-widget {
  color: var(--text-light);

  &__mode-icon {
    font-size: 2rem;
    opacity: 0.9;
    flex-shrink: 0;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__current {
    display: flex;
    align-items: flex-start;
    line-height: 1;
  }

  &__temp {
    font-size: 2.5rem;
    font-weight: 400;
    line-height: 1;
    color: var(--text-light);
  }

  &__unit {
    font-size: 1rem;
    margin-top: 0.2em;
    margin-left: 0.1em;
    color: var(--text-light);
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
  }

  &__setpoint {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__setpoint-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__setpoint-val {
    font-size: 1rem;
    font-weight: 500;
    min-width: 3em;
    text-align: center;
    color: var(--text-light);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__setpoint-compact {
    font-size: 0.85rem;
    opacity: 0.85;
    text-align: center;
    color: var(--text-light);
  }

  &__modes,
  &__fan {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
  }

  // Wide: status left, controls right
  &--wide {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding-bottom: 1.8rem;

    .climate-widget__controls {
      margin-left: auto;
      align-items: flex-end;
    }
  }

  // Vertical: everything stacked, centered
  &--vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-bottom: 1.8rem;

    .climate-widget__status {
      flex-direction: column;
    }

    .climate-widget__mode-icon {
      font-size: 3rem;
    }

    .climate-widget__temp {
      font-size: 3rem;
    }

    .climate-widget__controls {
      align-items: center;
    }

    .climate-widget__modes,
    .climate-widget__fan {
      justify-content: center;
    }
  }

  // Compact: mode icon as watermark, temp centered
  &--compact {
    .climate-widget__mode-icon {
      position: absolute;
      bottom: -16px;
      right: -16px;
      font-size: 7rem;
      opacity: 0.12;
      pointer-events: none;
    }

    .climate-widget__status {
      position: absolute;
      inset: 0;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding-bottom: 1.2rem;
    }

    .climate-widget__temp {
      font-size: 2rem;
    }

    .climate-widget__setpoint-compact {
      margin-top: 2px;
    }
  }
}
</style>
