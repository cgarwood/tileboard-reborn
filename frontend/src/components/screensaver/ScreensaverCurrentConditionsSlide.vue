<template>
  <div class="weather-slide">
    <div class="slide-header">Current Conditions</div>
    <div class="current-body">
      <div class="current-main">
        <q-icon :name="weatherIcon" class="current-icon" />
        <div class="current-info">
          <div class="current-temp">
            {{ tempValue }}<span class="current-unit">{{ tempUnit }}</span>
          </div>
          <div class="current-condition">{{ condition }}</div>
          <div v-if="todayHigh != null || todayLow != null" class="current-hl">
            <span v-if="todayHigh != null">H: {{ Math.round(todayHigh) }}°</span>
            <span v-if="todayLow != null">L: {{ Math.round(todayLow) }}°</span>
          </div>
        </div>
      </div>

      <div class="current-attrs">
        <div v-if="humidity != null" class="current-attr">
          <span class="current-attr__label">Humidity</span>
          <q-icon name="mdi-water-percent" size="1.4rem" />
          <span>{{ humidity }}%</span>
        </div>
        <div v-if="windSpeed != null" class="current-attr">
          <span class="current-attr__label">Wind</span>
          <q-icon name="mdi-weather-windy" size="1.4rem" />
          <span>{{ windSpeed }} {{ windSpeedUnit }}</span>
        </div>
        <div v-if="dewPoint != null" class="current-attr">
          <span class="current-attr__label">Dew Point</span>
          <q-icon name="mdi-thermometer-water" size="1.4rem" />
          <span>{{ Math.round(dewPoint) }}°</span>
        </div>
        <div v-if="visibility != null" class="current-attr">
          <span class="current-attr__label">Visibility</span>
          <q-icon name="mdi-eye-outline" size="1.4rem" />
          <span>{{ visibility }} {{ visibilityUnit }}</span>
        </div>
        <div v-if="pressure != null" class="current-attr">
          <span class="current-attr__label">Pressure</span>
          <q-icon name="mdi-gauge" size="1.4rem" />
          <span>{{ Math.round(pressure) }} {{ pressureUnit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { useWeatherForecast } from '../../composables/useWeatherForecast';
import { WeatherEntityFeature } from '../../types/weather';
import type { ForecastType } from '../../types/weather';
import { getWeatherIcon, formatWeatherState } from '../../utils/weatherIcons';

const props = defineProps<{
  entityId: string;
}>();

const haStore = useHomeAssistantStore();
const entity = computed(() => haStore.states[props.entityId] ?? null);
const attrs = computed(() => entity.value?.attributes ?? {});

const supportedFeatures = computed(() => entity.value?.attributes.supported_features ?? 0);

const dailyForecastType = computed<ForecastType | null>(() => {
  if (supportedFeatures.value & WeatherEntityFeature.FORECAST_DAILY) return 'daily';
  if (supportedFeatures.value & WeatherEntityFeature.FORECAST_TWICE_DAILY) return 'twice_daily';
  return null;
});

const { forecasts: dailyForecasts } = useWeatherForecast(
  () => props.entityId,
  () => dailyForecastType.value,
);

const todayHigh = computed<number | null>(() => {
  if (!dailyForecasts.value?.length) return null;
  if (dailyForecastType.value === 'twice_daily') {
    return dailyForecasts.value.find((f) => f.is_daytime !== false)?.temperature ?? null;
  }
  return dailyForecasts.value[0]?.temperature ?? null;
});

const todayLow = computed<number | null>(() => {
  if (!dailyForecasts.value?.length) return null;
  if (dailyForecastType.value === 'twice_daily') {
    return dailyForecasts.value.find((f) => f.is_daytime === false)?.temperature ?? null;
  }
  return dailyForecasts.value[0]?.templow ?? null;
});

const tempValue = computed(() => {
  const t = attrs.value.temperature as number | undefined;
  return t != null ? Math.round(t).toString() : '—';
});

const tempUnit = computed(() => (attrs.value.temperature_unit as string | undefined) ?? '°F');

const condition = computed(() => formatWeatherState(entity.value?.state ?? ''));

const weatherIcon = computed(() => getWeatherIcon(entity.value?.state ?? ''));
const humidity = computed(() => (attrs.value.humidity as number | null) ?? null);
const windSpeed = computed(() => (attrs.value.wind_speed as number | null) ?? null);
const windSpeedUnit = computed(() => (attrs.value.wind_speed_unit as string | undefined) ?? '');
const dewPoint = computed(() => (attrs.value.dew_point as number | null) ?? null);
const visibility = computed(() => (attrs.value.visibility as number | null) ?? null);
const visibilityUnit = computed(() => (attrs.value.visibility_unit as string | undefined) ?? '');
const pressure = computed(() => (attrs.value.pressure as number | null) ?? null);
const pressureUnit = computed(() => (attrs.value.pressure_unit as string | undefined) ?? '');
</script>

<style lang="scss" scoped>
@use '../../css/weather-slide';

.current-body {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 100px;
}

.current-main {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-shrink: 0;
}

.current-icon {
  font-size: 9rem;
  opacity: 0.95;
}

.current-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-temp {
  display: flex;
  align-items: flex-start;
  font-size: 6rem;
  font-weight: 300;
  line-height: 1;
}

.current-unit {
  font-size: 2.5rem;
  font-weight: 300;
  margin-top: 0.5rem;
  margin-left: 0.25rem;
}

.current-condition {
  font-size: 1.8rem;
  font-weight: 400;
  opacity: 0.85;
}

.current-hl {
  display: flex;
  gap: 16px;
  font-size: 1.4rem;
  font-weight: 400;
  opacity: 0.7;
  margin-top: 4px;
}

.current-attrs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 40px;
  opacity: 0.7;
}

@media (orientation: portrait) {
  .current-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .current-attrs {
    flex-wrap: wrap;
    justify-content: center;
    display: flex;
    gap: 32px;
  }
}

.current-attr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  font-weight: 400;

  &__label {
    font-size: 1rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.5;
    white-space: nowrap;
  }
}
</style>
