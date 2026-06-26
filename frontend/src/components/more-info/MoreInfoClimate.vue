<template>
  <div class="more-info-climate">
    <div class="more-info-climate__temps">
      <div class="more-info-climate__current">
        <div class="more-info-climate__current-label">Current</div>
        <div class="more-info-climate__current-value">
          {{ currentTempDisplay }}<span class="more-info-climate__unit">°{{ tempUnit }}</span>
        </div>
      </div>
      <div
        v-if="hvacActionLabel"
        class="more-info-climate__action-chip"
        :style="{ color: hvacActionColor }"
      >
        <q-icon :name="hvacActionIcon" size="14px" />
        {{ hvacActionLabel }}
      </div>
    </div>

    <q-separator dark />

    <div class="more-info-climate__section">
      <div class="more-info-climate__section-label">Mode</div>
      <div class="more-info-climate__hvac-modes">
        <q-btn
          v-for="mode in hvacModes"
          :key="mode"
          flat
          dense
          :icon="hvacModeIcon(mode)"
          :label="hvacModeLabel(mode)"
          class="more-info-climate__mode-btn"
          :class="{ 'more-info-climate__mode-btn--active': currentMode === mode }"
          @click="setHvacMode(mode)"
        />
      </div>
    </div>

    <template v-if="supportsTargetTemp && currentMode !== 'off'">
      <q-separator dark />

      <div class="more-info-climate__section">
        <div class="more-info-climate__section-label">Set Temperature</div>
        <div class="more-info-climate__setpoint-control">
          <q-btn flat round icon="mdi-minus" @click="adjustTemp(-tempStep)" />
          <div class="more-info-climate__setpoint">
            {{ targetTempDisplay }}<span class="more-info-climate__unit">°{{ tempUnit }}</span>
          </div>
          <q-btn flat round icon="mdi-plus" @click="adjustTemp(tempStep)" />
        </div>
      </div>
    </template>

    <template v-if="fanModes.length > 1 && currentMode !== 'off'">
      <q-separator dark />

      <div class="more-info-climate__section">
        <div class="more-info-climate__section-label">Fan</div>
        <div class="more-info-climate__fan-modes">
          <q-btn
            v-for="mode in fanModes"
            :key="mode"
            flat
            dense
            :label="mode"
            class="more-info-climate__mode-btn"
            :class="{ 'more-info-climate__mode-btn--active': currentFanMode === mode }"
            @click="setFanMode(mode)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';

const props = defineProps<{ entityId: string }>();

const haStore = useHomeAssistantStore();
const entity = computed(() => haStore.states[props.entityId] ?? null);
const attrs = computed(() => entity.value?.attributes ?? {});

const currentMode = computed(() => entity.value?.state ?? 'off');
const hvacModes = computed(() => (attrs.value.hvac_modes as string[] | undefined) ?? []);
const hvacAction = computed(() => (attrs.value.hvac_action as string | undefined) ?? '');
const currentFanMode = computed(() => (attrs.value.fan_mode as string | undefined) ?? '');
const fanModes = computed(() => (attrs.value.fan_modes as string[] | undefined) ?? []);

const currentTemp = computed(() => (attrs.value.current_temperature as number | null) ?? null);
const targetTemp = computed(() => (attrs.value.temperature as number | null) ?? null);
const tempUnit = computed(() => {
  const u = attrs.value.temperature_unit as string | undefined;
  return u?.replace('°', '') ?? 'F';
});
const tempStep = computed(() => attrs.value.target_temp_step ?? 0.5);

const supportedFeatures = computed(() => attrs.value.supported_features ?? 0);
const supportsTargetTemp = computed(() => !!(supportedFeatures.value & 1));

const currentTempDisplay = computed(() =>
  currentTemp.value != null ? currentTemp.value.toFixed(1) : '—',
);

const targetTempDisplay = computed(() =>
  targetTemp.value != null ? targetTemp.value.toFixed(1) : '—',
);

const HVAC_ICONS: Record<string, string> = {
  heat: 'mdi-fire',
  cool: 'mdi-snowflake',
  heat_cool: 'mdi-fire-alert',
  auto: 'mdi-autorenew',
  dry: 'mdi-water-percent',
  fan_only: 'mdi-fan',
  off: 'mdi-power',
};

const HVAC_ACTION_COLORS: Record<string, string> = {
  heating: '#ff7043',
  cooling: '#42a5f5',
  drying: '#ffa726',
  fan: '#bdbdbd',
  idle: '#66bb6a',
  off: '#757575',
};

const HVAC_ACTION_ICONS: Record<string, string> = {
  heating: 'mdi-fire',
  cooling: 'mdi-snowflake',
  drying: 'mdi-water-percent',
  fan: 'mdi-fan',
  idle: 'mdi-check-circle',
  off: 'mdi-power',
};

function hvacModeIcon(mode: string) {
  return HVAC_ICONS[mode] ?? 'mdi-thermostat';
}

function hvacModeLabel(mode: string) {
  return mode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const hvacActionLabel = computed(() => {
  const a = hvacAction.value;
  return a ? a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
});

const hvacActionColor = computed(() => HVAC_ACTION_COLORS[hvacAction.value] ?? '#9e9e9e');
const hvacActionIcon = computed(() => HVAC_ACTION_ICONS[hvacAction.value] ?? 'mdi-thermostat');

function setHvacMode(mode: string) {
  void haStore.callService('climate', 'set_hvac_mode', {
    entity_id: props.entityId,
    hvac_mode: mode,
  });
}

function adjustTemp(delta: number) {
  if (targetTemp.value == null) return;
  void haStore.callService('climate', 'set_temperature', {
    entity_id: props.entityId,
    temperature: Math.round((targetTemp.value + delta) * 10) / 10,
  });
}

function setFanMode(mode: string) {
  void haStore.callService('climate', 'set_fan_mode', {
    entity_id: props.entityId,
    fan_mode: mode,
  });
}
</script>

<style lang="scss" scoped>
.more-info-climate {
  padding: 8px 0;

  &__temps {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  &__current-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }

  &__current-value {
    font-size: 2.8rem;
    font-weight: 300;
    color: var(--text-light);
    line-height: 1;
  }

  &__unit {
    font-size: 1.2rem;
    font-weight: 400;
  }

  &__action-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  &__section {
    padding: 16px 20px;
  }

  &__section-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 12px;
  }

  &__hvac-modes,
  &__fan-modes {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__mode-btn {
    color: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.8rem;
    text-transform: capitalize;

    &--active {
      color: white;
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.12);
    }
  }

  &__setpoint-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  &__setpoint {
    font-size: 2.4rem;
    font-weight: 300;
    color: var(--text-light);
    min-width: 120px;
    text-align: center;
  }
}
</style>
