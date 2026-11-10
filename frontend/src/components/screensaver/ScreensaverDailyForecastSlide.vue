<template>
  <div class="weather-slide">
    <div class="slide-header">Daily Forecast</div>
    <div class="daily-row">
      <div
        v-for="(day, i) in days"
        :key="i"
        class="day-card"
        :class="{ 'day-card--today': day.name === 'Today' }"
      >
        <div class="day-name">{{ day.name }}</div>
        <q-icon :name="day.icon" class="day-icon" />
        <div class="day-temps">
          <span class="day-high">{{ day.high != null ? `${day.high}°` : '—' }}</span>
          <span class="day-low">{{ day.low != null ? `${day.low}°` : '—' }}</span>
        </div>
        <div v-if="day.precipProb != null" class="day-precip">
          <q-icon name="mdi-water" size="0.85rem" />{{ day.precipProb }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getWeatherIcon } from '../../utils/weatherIcons';
import type { ForecastType, WeatherForecast } from '../../types/weather';
import { localDateStr, weekdayFormat } from '../../utils/formatters';
import { useMinuteClock } from '../../composables/useMinuteClock';

const props = defineProps<{
  forecasts: WeatherForecast[];
  forecastType: ForecastType;
}>();

const clock = useMinuteClock();
const today = computed(() => localDateStr(clock.value));

function formatDay(datetime: string) {
  if (localDateStr(new Date(datetime)) === today.value) return 'Today';
  return weekdayFormat.format(new Date(datetime));
}

// Drop days that have passed since the last forecast push (e.g. yesterday, just after midnight).
const upcoming = computed(() =>
  props.forecasts.filter((f) => localDateStr(new Date(f.datetime)) >= today.value),
);

const days = computed(() => {
  if (props.forecastType === 'twice_daily') {
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

    for (const f of upcoming.value) {
      const date = localDateStr(new Date(f.datetime));
      if (!groups.has(date)) {
        groups.set(date, {
          datetime: f.datetime,
          high: null,
          low: null,
          condition: '',
          precipProb: null,
        });
      }
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
      .map((g) => ({
        name: formatDay(g.datetime),
        icon: getWeatherIcon(g.condition),
        high: g.high,
        low: g.low,
        precipProb: g.precipProb,
      }));
  }

  return upcoming.value.slice(0, 7).map((f) => ({
    name: formatDay(f.datetime),
    icon: getWeatherIcon(f.condition),
    high: f.temperature != null ? Math.round(f.temperature) : null,
    low: f.templow != null ? Math.round(f.templow) : null,
    precipProb: f.precipitation_probability ?? null,
  }));
});
</script>

<style lang="scss" scoped>
@use '../../css/weather-slide';

.daily-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.day-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 20px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  min-width: 110px;

  &--today {
    background: rgba(255, 255, 255, 0.13);
  }
}

.day-name {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.65;
}

.day-icon {
  font-size: 2.4rem;
}

.day-temps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.day-high {
  font-size: 1.35rem;
  font-weight: 500;
}

.day-low {
  font-size: 1.1rem;
  font-weight: 400;
  opacity: 0.55;
}

.day-precip {
  font-size: 0.8rem;
  opacity: 0.65;
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
