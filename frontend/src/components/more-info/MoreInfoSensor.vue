<template>
  <div class="more-info-sensor">
    <div class="more-info-sensor__state-row">
      <span class="more-info-sensor__value">{{ displayState }}</span>
      <span v-if="unit" class="more-info-sensor__unit">{{ unit }}</span>
    </div>
    <div v-if="lastChanged" class="more-info-sensor__updated">Updated {{ lastChanged }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';

const props = defineProps<{ entityId: string }>();

const haStore = useHomeAssistantStore();
const entity = computed(() => (props.entityId ? (haStore.states[props.entityId] ?? null) : null));

const displayState = computed(() => {
  const s = entity.value?.state;
  if (s == null) return '—';
  if (s === 'on') return 'On';
  if (s === 'off') return 'Off';
  return s;
});

const unit = computed(() => entity.value?.attributes.unit_of_measurement ?? '');

const lastChanged = computed(() => {
  const ts = entity.value?.last_changed;
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});
</script>

<style lang="scss" scoped>
.more-info-sensor {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &__state-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__value {
    font-size: 3.5rem;
    font-weight: 300;
    line-height: 1;
    color: var(--text-light);
  }

  &__unit {
    font-size: 1.4rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.6);
  }

  &__updated {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }
}
</style>
