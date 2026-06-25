<template>
  <div v-if="available" class="fkb-indicator">
    <q-icon :name="icon" :color="iconColor" size="18px" />
    <span class="fkb-indicator__pct">{{ level }}%</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const available = ref(false);
const level = ref(0);
const plugged = ref(false);

const icon = computed(() => {
  const step = Math.round(level.value / 10) * 10;
  if (plugged.value) {
    if (step >= 100) return 'mdi-battery-charging-100';
    if (step <= 0) return 'mdi-battery-charging-outline';
    return `mdi-battery-charging-${step}`;
  }
  if (step >= 100) return 'mdi-battery';
  if (step <= 0) return 'mdi-battery-outline';
  return `mdi-battery-${step}`;
});

const iconColor = computed(() => {
  if (plugged.value) return 'positive';
  if (level.value <= 20) return 'negative';
  return 'white';
});

const LEVEL_CB = '_fkbBatteryLevelChanged';
const PLUGGED_CB = '_fkbPlugged';
const UNPLUGGED_CB = '_fkbUnplugged';

onMounted(() => {
  if (!window.fully) return;
  available.value = true;
  level.value = window.fully.getBatteryLevel();
  plugged.value = window.fully.isPlugged();

  window[LEVEL_CB] = () => {
    if (window.fully) level.value = window.fully.getBatteryLevel();
  };
  window[PLUGGED_CB] = () => {
    plugged.value = true;
  };
  window[UNPLUGGED_CB] = () => {
    plugged.value = false;
  };

  window.fully.bind('onBatteryLevelChanged', `${LEVEL_CB}()`);
  window.fully.bind('pluggedAC', `${PLUGGED_CB}()`);
  window.fully.bind('pluggedUSB', `${PLUGGED_CB}()`);
  window.fully.bind('pluggedWireless', `${PLUGGED_CB}()`);
  window.fully.bind('unplugged', `${UNPLUGGED_CB}()`);
});

onUnmounted(() => {
  delete window[LEVEL_CB];
  delete window[PLUGGED_CB];
  delete window[UNPLUGGED_CB];
});
</script>

<script lang="ts">
declare global {
  interface Window {
    fully?: {
      getBatteryLevel(): number;
      isPlugged(): boolean;
      bind(event: string, jsCode: string): void;
    };
    _fkbBatteryLevelChanged?: () => void;
    _fkbPlugged?: () => void;
    _fkbUnplugged?: () => void;
  }
}
</script>

<style lang="scss" scoped>
.fkb-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  color: white;
  margin-right: 4px;
}

.fkb-indicator__pct {
  font-size: 0.75rem;
  line-height: 1;
  opacity: 0.85;
}
</style>
