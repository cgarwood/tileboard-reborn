<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <q-card-section class="widget-body weather-widget" :class="`weather-widget--${layout}`">
      <div class="weather-widget__main">
        <q-icon :name="weatherIcon" class="weather-widget__icon" />
        <div class="weather-widget__primary">
          <div class="weather-widget__temp">
            {{ tempValue }}<span class="weather-widget__unit">{{ tempUnit }}</span>
          </div>
          <div class="weather-widget__condition">{{ condition }}</div>
          <div v-if="todayHigh != null || todayLow != null" class="weather-widget__hl">
            <span v-if="todayHigh != null">H:{{ Math.round(todayHigh) }}°</span>
            <span v-if="todayLow != null">L:{{ Math.round(todayLow) }}°</span>
          </div>
        </div>
      </div>

      <div v-if="layout !== 'compact' && attributes.length" class="weather-widget__attrs">
        <div v-for="attr in attributes" :key="attr.key" class="weather-widget__attr">
          <q-icon :name="attr.icon" class="weather-widget__attr-icon" />
          <span>{{ attr.value }}</span>
        </div>
      </div>

      <div class="label-group">
        <div v-if="widget.subtitle" class="subtitle">{{ widget.subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('weather', { width: 2, height: 4 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useWeatherForecast } from '../composables/useWeatherForecast';
import { getWidgetDefaults } from '../utils/widgetRegistry';
import { getWeatherIcon } from '../utils/weatherIcons';
import { WeatherEntityFeature } from '../types/weather';
import type { ForecastType } from '../types/weather';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const { title, backgroundStyle } = useWidget(() => props.widget);

const haStore = useHomeAssistantStore();
const entity = computed(() => {
  const id = props.widget.entity;
  return id ? (haStore.states[id] ?? null) : null;
});

const layout = computed(() => {
  const defaults = getWidgetDefaults('weather');
  const w = props.widget.grid?.width ?? defaults.width ?? 2;
  const h = props.widget.grid?.height ?? defaults.height ?? 2;
  if (w <= 3 && h <= 3) return 'compact';
  if (h >= 4) return 'vertical'; // 2x4 or taller
  return 'wide'; // 4x2 or wider
});

const tempValue = computed(() => {
  const t = entity.value?.attributes.temperature as number | undefined;
  return t != null ? Math.round(t).toString() : '—';
});

const tempUnit = computed(() => {
  return (entity.value?.attributes.temperature_unit as string | undefined) ?? '°F';
});

const condition = computed(() => {
  const s = entity.value?.state ?? '';
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
});

const weatherIcon = computed(() => getWeatherIcon(entity.value?.state ?? ''));

const preferredForecastType = computed<ForecastType | null>(() => {
  const sf = entity.value?.attributes.supported_features;
  if (sf == null) return null;
  if (sf & WeatherEntityFeature.FORECAST_DAILY) return 'daily';
  if (sf & WeatherEntityFeature.FORECAST_TWICE_DAILY) return 'twice_daily';
  return null;
});

const { forecasts } = useWeatherForecast(
  () => props.widget.entity,
  () => preferredForecastType.value,
);

const todayHigh = computed<number | null>(() => {
  if (!forecasts.value?.length) return null;
  if (preferredForecastType.value === 'twice_daily') {
    const daytime = forecasts.value.find((f) => f.is_daytime !== false);
    return daytime?.temperature ?? null;
  }
  return forecasts.value[0]?.temperature ?? null;
});

const todayLow = computed<number | null>(() => {
  if (!forecasts.value?.length) return null;
  if (preferredForecastType.value === 'twice_daily') {
    const nighttime = forecasts.value.find((f) => f.is_daytime === false);
    return nighttime?.temperature ?? null;
  }
  return forecasts.value[0]?.templow ?? null;
});

const attributes = computed(() => {
  const a = entity.value?.attributes;
  if (!a) return [];
  const result: { key: string; icon: string; value: string }[] = [];
  if (a.humidity != null)
    result.push({ key: 'humidity', icon: 'mdi-water-percent', value: `${a.humidity}%` });
  if (a.wind_speed != null)
    result.push({
      key: 'wind',
      icon: 'mdi-weather-windy',
      value: `${a.wind_speed} ${a.wind_speed_unit ?? ''}`,
    });
  if (a.precipitation != null)
    result.push({
      key: 'precip',
      icon: 'mdi-umbrella',
      value: `${a.precipitation} ${a.precipitation_unit ?? ''}`,
    });
  return result;
});
</script>

<style lang="scss">
.widget-weather {
  background: var(--weather-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.weather-widget {
  &__main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    font-size: 3rem;
    color: var(--text-light);
  }

  &__primary {
    display: flex;
    flex-direction: column;
  }

  &__temp {
    display: flex;
    align-items: flex-start;
    font-size: 2rem;
    font-weight: 400;
    color: var(--text-light);
    line-height: 1;
  }

  &__unit {
    font-size: 0.9rem;
    margin-top: 0.15em;
    margin-left: 0.1em;
  }

  &__condition {
    font-size: 0.8rem;
    color: var(--text-light);
    opacity: 0.8;
    margin-top: 2px;
  }

  &__hl {
    display: flex;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--text-light);
    opacity: 0.75;
    margin-top: 2px;
  }

  &__attrs {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__attr {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: var(--text-light);
    opacity: 0.85;
  }

  &__attr-icon {
    font-size: 1rem;
    opacity: 0.7;
  }

  // compact: large ghost icon in background, temp + condition centered
  &--compact {
    .weather-widget__main {
      position: absolute;
      inset: 0;
    }

    .weather-widget__icon {
      position: absolute;
      bottom: -20px;
      left: -20px;
      font-size: 8rem;
      opacity: 0.1;
      pointer-events: none;
    }

    .weather-widget__primary {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-bottom: 1.4rem;
      gap: 2px;
    }

    .weather-widget__condition {
      order: -1;
      opacity: 0.9;
      font-size: 0.78rem;
      margin-top: 0;
    }

    .weather-widget__temp {
      font-size: 2.2rem;
    }
  }

  // 2x4 or default: everything stacked top-to-bottom
  &--vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-bottom: 1.8rem;

    .weather-widget__main {
      flex-direction: column;
      align-items: center;

      .weather-widget__icon {
        font-size: 3.5rem;
      }
      .weather-widget__temp {
        font-size: 2.5rem;
      }
    }

    .weather-widget__primary {
      align-items: center;
      flex-direction: column;
    }
  }

  // 4x2: icon | temp+condition | attributes in a horizontal row
  &--wide {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding-bottom: 1.8rem;

    .weather-widget__attrs {
      flex: 1;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px 12px;
    }
  }
}
</style>
