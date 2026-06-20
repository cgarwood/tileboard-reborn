<template>
  <div v-if="entity" class="screensaver-weather">
    <q-icon :name="weatherIcon" class="screensaver-weather__icon" />
    <div class="screensaver-weather__info">
      <div class="screensaver-weather__temp">
        {{ temperatureValue }}<span class="screensaver-weather__unit">{{ temperatureUnit }}</span>
      </div>
      <div class="screensaver-weather__condition">{{ condition }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { getWeatherIcon } from '../../utils/weatherIcons';

const props = defineProps<{ entityId: string }>();

const haStore = useHomeAssistantStore();

const entity = computed(() => haStore.states[props.entityId] ?? null);

const temperatureValue = computed(() => {
  const temp = entity.value?.attributes.temperature as number | undefined;
  return temp != null ? `${Math.round(temp)}` : '';
});

const temperatureUnit = computed(() => {
  return (entity.value?.attributes.temperature_unit as string | undefined) ?? '°F';
});

const condition = computed(() => {
  const state = entity.value?.state ?? '';
  return state.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
});

const weatherIcon = computed(() => getWeatherIcon(entity.value?.state ?? ''));
</script>

<style lang="scss" scoped>
.screensaver-weather {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
  user-select: none;

  &__icon {
    font-size: 4.5rem;
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__temp {
    font-size: 2.5rem;
    font-weight: 400;
    line-height: 1.1;
    display: flex;
    align-items: flex-start;
  }

  &__unit {
    font-size: 1.2rem;
    font-weight: 400;
    margin-top: 0.2rem;
    margin-left: 0.1rem;
  }

  &__condition {
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.85;
  }
}
</style>
