<template>
  <div class="more-info-weather">
    <div class="more-info-weather__current">
      <div class="more-info-weather__hero">
        <q-icon :name="weatherIcon" class="more-info-weather__hero-icon" />
        <div class="more-info-weather__hero-text">
          <div class="more-info-weather__temp">
            {{ tempDisplay }}<span class="more-info-weather__temp-unit">°{{ tempUnit }}</span>
          </div>
          <div class="more-info-weather__condition">{{ conditionLabel }}</div>
          <div v-if="todayHigh != null || todayLow != null" class="more-info-weather__hl">
            <span v-if="todayHigh != null">H: {{ Math.round(todayHigh) }}°</span>
            <span v-if="todayLow != null">L: {{ Math.round(todayLow) }}°</span>
          </div>
        </div>
      </div>

      <div class="more-info-weather__attrs">
        <div v-if="humidity != null" class="more-info-weather__attr">
          <q-icon name="mdi-water-percent" size="1rem" />
          <span class="more-info-weather__attr-label">Humidity</span>
          <span>{{ humidity }}%</span>
        </div>
        <div v-if="windSpeed != null" class="more-info-weather__attr">
          <q-icon name="mdi-weather-windy" size="1rem" />
          <span class="more-info-weather__attr-label">Wind</span>
          <span>{{ windSpeed }} {{ windSpeedUnit }}</span>
        </div>
        <div v-if="dewPoint != null" class="more-info-weather__attr">
          <q-icon name="mdi-thermometer-water" size="1rem" />
          <span class="more-info-weather__attr-label">Dew Point</span>
          <span>{{ Math.round(dewPoint) }}°</span>
        </div>
        <div v-if="visibility != null" class="more-info-weather__attr">
          <q-icon name="mdi-eye-outline" size="1rem" />
          <span class="more-info-weather__attr-label">Visibility</span>
          <span>{{ visibility }} {{ visibilityUnit }}</span>
        </div>
        <div v-if="pressure != null" class="more-info-weather__attr">
          <q-icon name="mdi-gauge" size="1rem" />
          <span class="more-info-weather__attr-label">Pressure</span>
          <span>{{ Math.round(pressure) }} {{ pressureUnit }}</span>
        </div>
      </div>
    </div>

    <template v-if="hasForecastTabs">
      <q-separator dark />
      <q-tabs v-model="activeTab" dense dark align="left" class="more-info-weather__tabs">
        <q-tab v-if="dailyForecastType" name="daily" label="Daily" />
        <q-tab v-if="supportsHourly" name="hourly" label="Hourly" />
      </q-tabs>
      <q-separator dark />
      <q-tab-panels v-model="activeTab" animated class="bg-transparent more-info-weather__panels">
        <q-tab-panel v-if="dailyForecastType" name="daily" class="more-info-weather__panel">
          <div class="more-info-weather__forecast-row">
            <div
              v-for="(day, i) in dailyDays"
              :key="i"
              class="more-info-weather__fc-card"
              :class="{ 'more-info-weather__fc-card--today': i === 0 }"
            >
              <div class="more-info-weather__fc-name">{{ day.name }}</div>
              <q-icon :name="day.icon" class="more-info-weather__fc-icon" />
              <div class="more-info-weather__fc-temps">
                <span class="more-info-weather__fc-high">{{
                  day.high != null ? `${day.high}°` : '—'
                }}</span>
                <span class="more-info-weather__fc-low">{{
                  day.low != null ? `${day.low}°` : '—'
                }}</span>
              </div>
              <div v-if="day.precipProb != null" class="more-info-weather__fc-precip">
                <q-icon name="mdi-water" size="0.8rem" />{{ day.precipProb }}%
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel v-if="supportsHourly" name="hourly" class="more-info-weather__panel">
          <div class="more-info-weather__forecast-row">
            <div v-for="(hour, i) in hourlySlots" :key="i" class="more-info-weather__fc-card">
              <div class="more-info-weather__fc-name">{{ hour.time }}</div>
              <q-icon :name="hour.icon" class="more-info-weather__fc-icon" />
              <div class="more-info-weather__fc-temps">
                <span class="more-info-weather__fc-high">{{
                  hour.temp != null ? `${hour.temp}°` : '—'
                }}</span>
              </div>
              <div v-if="hour.precipProb != null" class="more-info-weather__fc-precip">
                <q-icon name="mdi-water" size="0.8rem" />{{ hour.precipProb }}%
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { useWeatherForecast } from '../../composables/useWeatherForecast';
import { getWeatherIcon, formatWeatherState } from '../../utils/weatherIcons';
import { WeatherEntityFeature } from '../../types/weather';
import type { ForecastType } from '../../types/weather';

const props = defineProps<{ entityId: string }>();

const haStore = useHomeAssistantStore();
const entity = computed(() => haStore.states[props.entityId] ?? null);
const attrs = computed(() => entity.value?.attributes ?? {});

// Current conditions
const tempDisplay = computed(() => {
  const t = attrs.value.temperature as number | undefined;
  return t != null ? Math.round(t).toString() : '—';
});
const tempUnit = computed(() =>
  ((attrs.value.temperature_unit as string | undefined) ?? '°F').replace('°', ''),
);
const conditionLabel = computed(() => formatWeatherState(entity.value?.state ?? ''));
const weatherIcon = computed(() => getWeatherIcon(entity.value?.state ?? ''));
const humidity = computed(() => (attrs.value.humidity as number | null) ?? null);
const windSpeed = computed(() => (attrs.value.wind_speed as number | null) ?? null);
const windSpeedUnit = computed(() => (attrs.value.wind_speed_unit as string | undefined) ?? '');
const dewPoint = computed(() => (attrs.value.dew_point as number | null) ?? null);
const visibility = computed(() => (attrs.value.visibility as number | null) ?? null);
const visibilityUnit = computed(() => (attrs.value.visibility_unit as string | undefined) ?? '');
const pressure = computed(() => (attrs.value.pressure as number | null) ?? null);
const pressureUnit = computed(() => (attrs.value.pressure_unit as string | undefined) ?? '');

// Forecast type detection
const supportedFeatures = computed(() => attrs.value.supported_features ?? 0);
const supportsHourly = computed(
  () => !!(supportedFeatures.value & WeatherEntityFeature.FORECAST_HOURLY),
);
const dailyForecastType = computed<ForecastType | null>(() => {
  if (supportedFeatures.value & WeatherEntityFeature.FORECAST_DAILY) return 'daily';
  if (supportedFeatures.value & WeatherEntityFeature.FORECAST_TWICE_DAILY) return 'twice_daily';
  return null;
});

const hasForecastTabs = computed(() => dailyForecastType.value !== null || supportsHourly.value);

const { forecasts: dailyForecasts } = useWeatherForecast(
  () => props.entityId,
  () => dailyForecastType.value,
);
const { forecasts: hourlyForecasts } = useWeatherForecast(
  () => (supportsHourly.value ? props.entityId : undefined),
  () => 'hourly',
);

// Today high/low from first daily entry
const todayHigh = computed<number | null>(() => {
  if (!dailyForecasts.value?.length) return null;
  if (dailyForecastType.value === 'twice_daily')
    return dailyForecasts.value.find((f) => f.is_daytime !== false)?.temperature ?? null;
  return dailyForecasts.value[0]?.temperature ?? null;
});
const todayLow = computed<number | null>(() => {
  if (!dailyForecasts.value?.length) return null;
  if (dailyForecastType.value === 'twice_daily')
    return dailyForecasts.value.find((f) => f.is_daytime === false)?.temperature ?? null;
  return dailyForecasts.value[0]?.templow ?? null;
});

// Daily forecast cards
function formatDay(datetime: string, index: number) {
  if (index === 0) return 'Today';
  return new Intl.DateTimeFormat([], { weekday: 'short' }).format(new Date(datetime));
}

const dailyDays = computed(() => {
  const forecasts = dailyForecasts.value;
  if (!forecasts?.length) return [];

  if (dailyForecastType.value === 'twice_daily') {
    const groups = new Map<
      string,
      {
        datetime: string;
        high: number | null;
        low: number | null;
        condition: string;
        precipProb: number | null;
      }
    >();
    for (const f of forecasts) {
      const date = f.datetime.slice(0, 10);
      if (!groups.has(date))
        groups.set(date, {
          datetime: f.datetime,
          high: null,
          low: null,
          condition: '',
          precipProb: null,
        });
      const g = groups.get(date)!;
      if (f.is_daytime !== false) {
        g.condition = f.condition;
        g.high = f.temperature != null ? Math.round(f.temperature) : null;
        g.precipProb = f.precipitation_probability ?? null;
      } else {
        g.low = f.temperature != null ? Math.round(f.temperature) : null;
      }
    }
    return Array.from(groups.values())
      .slice(0, 7)
      .map((g, i) => ({
        name: formatDay(g.datetime, i),
        icon: getWeatherIcon(g.condition),
        high: g.high,
        low: g.low,
        precipProb: g.precipProb,
      }));
  }

  return forecasts.slice(0, 7).map((f, i) => ({
    name: formatDay(f.datetime, i),
    icon: getWeatherIcon(f.condition),
    high: f.temperature != null ? Math.round(f.temperature) : null,
    low: f.templow != null ? Math.round(f.templow) : null,
    precipProb: f.precipitation_probability ?? null,
  }));
});

// Hourly forecast cards
const hourlySlots = computed(() =>
  (hourlyForecasts.value ?? []).slice(0, 12).map((f) => ({
    time: new Intl.DateTimeFormat([], { hour: 'numeric' }).format(new Date(f.datetime)),
    icon: getWeatherIcon(f.condition),
    temp: f.temperature != null ? Math.round(f.temperature) : null,
    precipProb: f.precipitation_probability ?? null,
  })),
);

const activeTab = ref<string>(dailyForecastType.value !== null ? 'daily' : 'hourly');
</script>

<style lang="scss" scoped>
.more-info-weather {
  &__current {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  &__hero {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
  }

  &__hero-icon {
    font-size: 4rem;
    opacity: 0.95;
    flex-shrink: 0;
  }

  &__temp {
    font-size: 2.6rem;
    font-weight: 300;
    line-height: 1;
    color: var(--text-light);
  }

  &__temp-unit {
    font-size: 1.2rem;
    font-weight: 400;
    margin-left: 2px;
  }

  &__condition {
    font-size: 0.9rem;
    opacity: 0.75;
    margin-top: 4px;
  }

  &__hl {
    display: flex;
    gap: 10px;
    font-size: 0.85rem;
    opacity: 0.65;
    margin-top: 4px;
  }

  &__attrs {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 7px;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    padding-left: 16px;
  }

  &__attr {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.82rem;
    color: rgba(255, 255, 255, 0.85);
  }

  &__attr-label {
    flex: 1;
    opacity: 0.5;
    font-size: 0.78rem;
  }

  &__tabs {
    padding: 0 8px;
  }

  &__panels {
    color: var(--text-light);
  }

  &__panel {
    padding: 16px;
  }

  &__forecast-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 10px;
  }

  &__fc-card {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 12px;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 10px;
    min-width: 70px;

    &--today {
      background: rgba(255, 255, 255, 0.13);
    }
  }

  &__fc-name {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.6;
    white-space: nowrap;
  }

  &__fc-icon {
    font-size: 2rem;
  }

  &__fc-temps {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  &__fc-high {
    font-size: 1.1rem;
    font-weight: 500;
  }

  &__fc-low {
    font-size: 0.9rem;
    opacity: 0.5;
  }

  &__fc-precip {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.75rem;
    opacity: 0.6;
  }
}
</style>
