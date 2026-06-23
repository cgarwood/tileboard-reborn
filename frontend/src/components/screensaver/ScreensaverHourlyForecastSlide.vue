<template>
  <div class="weather-slide">
    <div class="slide-header">Hourly Forecast</div>
    <div class="hourly-row">
      <div v-for="(hour, i) in hours" :key="i" class="hour-card">
        <div class="hour-time">{{ hour.time }}</div>
        <q-icon :name="hour.icon" class="hour-icon" />
        <div class="hour-temp">{{ hour.temp != null ? `${hour.temp}°` : '—' }}</div>
        <div v-if="hour.precipProb != null" class="hour-precip">
          <q-icon name="mdi-water" size="0.85rem" />{{ hour.precipProb }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getWeatherIcon } from '../../utils/weatherIcons';
import type { WeatherForecast } from '../../types/weather';

const props = defineProps<{
  forecasts: WeatherForecast[];
}>();

const hours = computed(() =>
  props.forecasts.slice(0, 8).map((f) => ({
    time: new Intl.DateTimeFormat([], { hour: 'numeric' }).format(new Date(f.datetime)),
    icon: getWeatherIcon(f.condition),
    temp: f.temperature != null ? Math.round(f.temperature) : null,
    precipProb: f.precipitation_probability ?? null,
  })),
);
</script>

<style lang="scss" scoped>
@use '../../css/weather-slide';


.hourly-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.hour-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  min-width: 90px;
}

.hour-time {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.65;
  white-space: nowrap;
}

.hour-icon {
  font-size: 2.2rem;
}

.hour-temp {
  font-size: 1.4rem;
  font-weight: 400;
}

.hour-precip {
  font-size: 0.8rem;
  opacity: 0.65;
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
