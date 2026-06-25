<template>
  <div class="screensaver-overlay" @click="store.dismiss()">
    <q-carousel
      ref="carouselRef"
      v-model="currentSlide"
      swipeable
      animated
      infinite
      transition-prev="fade"
      transition-next="fade"
      class="screensaver-carousel"
    >
      <q-carousel-slide
        v-for="(slide, index) in allSlides"
        :key="index"
        :name="index"
        class="screensaver-carousel__slide"
      >
        <ScreensaverImageSlide v-if="slide.type === 'image'" :slide="slide" />
        <ScreensaverCurrentConditionsSlide
          v-else-if="slide.type === 'weather-current' && store.weatherEntity"
          :entity-id="store.weatherEntity"
          :today-high="todayHigh"
          :today-low="todayLow"
        />
        <ScreensaverHourlyForecastSlide
          v-else-if="slide.type === 'weather-hourly'"
          :forecasts="hourlyForecasts ?? []"
        />
        <ScreensaverDailyForecastSlide
          v-else-if="slide.type === 'weather-daily' && dailyForecastType"
          :forecasts="dailyForecasts ?? []"
          :forecast-type="dailyForecastType"
        />
        <ScreensaverCalendarSlide
          v-else-if="slide.type === 'calendar-today'"
          day="today"
          :events="todayEvents"
        />
        <ScreensaverCalendarSlide
          v-else-if="slide.type === 'calendar-tomorrow'"
          day="tomorrow"
          :events="tomorrowEvents"
        />
      </q-carousel-slide>
    </q-carousel>

    <div v-if="weatherStore.alerts.length" class="screensaver-alerts">
      <q-badge
        v-for="alert in weatherStore.alerts"
        :key="alert.id"
        class="weather-alert-badge"
        :class="alertClass(alert.event)"
        style="pointer-events: all; cursor: pointer"
        @click.stop="openAlert(alert)"
        >{{ alert.event }}</q-badge
      >
    </div>

    <div
      v-if="store.weatherEntity"
      class="screensaver-weather-btn"
      :class="{ 'screensaver-weather-btn--clickable': weatherSlides.length > 0 }"
      @click.stop="goToNearestWeatherSlide"
    >
      <ScreensaverWeather :entity-id="store.weatherEntity" />
    </div>
    <ScreensaverClock />

    <WeatherAlertDialog v-if="selectedAlert" :alert="selectedAlert" @hide="selectedAlert = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useScreensaverStore } from '../../stores/screensaver';
import { useWeatherAlertsStore } from '../../stores/weather-alerts';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { useWeatherForecast } from '../../composables/useWeatherForecast';
import { useCalendar } from '../../composables/useCalendar';
import { useCalendarStore } from '../../stores/calendar';
import { WeatherEntityFeature } from '../../types/weather';
import type { ForecastType } from '../../types/weather';
import type { CalendarEvent } from '../../types/calendar';
import type { Slide } from '../../types/screensaver';
import ScreensaverImageSlide from './ScreensaverImageSlide.vue';
import ScreensaverCurrentConditionsSlide from './ScreensaverCurrentConditionsSlide.vue';
import ScreensaverHourlyForecastSlide from './ScreensaverHourlyForecastSlide.vue';
import ScreensaverDailyForecastSlide from './ScreensaverDailyForecastSlide.vue';
import ScreensaverCalendarSlide from './ScreensaverCalendarSlide.vue';
import ScreensaverClock from './ScreensaverClock.vue';
import ScreensaverWeather from './ScreensaverWeather.vue';
import WeatherAlertDialog from '../dialogs/WeatherAlertDialog.vue';
import type { WeatherAlert } from '../../types/weather-alerts';

const store = useScreensaverStore();
const weatherStore = useWeatherAlertsStore();
const haStore = useHomeAssistantStore();

const carouselRef = ref();
const currentSlide = ref(0);
const selectedAlert = ref<WeatherAlert | null>(null);

// --- Weather entity capability detection ---

const weatherEntity = computed(() =>
  store.weatherEntity ? (haStore.states[store.weatherEntity] ?? null) : null,
);

const supportedFeatures = computed(() => weatherEntity.value?.attributes.supported_features ?? 0);

const supportsHourly = computed(
  () => !!(supportedFeatures.value & WeatherEntityFeature.FORECAST_HOURLY),
);

const dailyForecastType = computed<ForecastType | null>(() => {
  if (supportedFeatures.value & WeatherEntityFeature.FORECAST_DAILY) return 'daily';
  if (supportedFeatures.value & WeatherEntityFeature.FORECAST_TWICE_DAILY) return 'twice_daily';
  return null;
});

// --- Forecast subscriptions (managed at overlay level to avoid per-slide churn) ---

const { forecasts: hourlyForecasts } = useWeatherForecast(
  () => (supportsHourly.value ? (store.weatherEntity ?? undefined) : undefined),
  () => 'hourly',
);

const { forecasts: dailyForecasts } = useWeatherForecast(
  () => store.weatherEntity ?? undefined,
  () => dailyForecastType.value,
);

// --- Today high/low (for current conditions slide) ---

const todayHigh = computed<number | null>(() => {
  if (!dailyForecasts.value?.length) return null;
  if (dailyForecastType.value === 'twice_daily') {
    const daytime = dailyForecasts.value.find((f) => f.is_daytime !== false);
    return daytime?.temperature ?? null;
  }
  return dailyForecasts.value[0]?.temperature ?? null;
});

const todayLow = computed<number | null>(() => {
  if (!dailyForecasts.value?.length) return null;
  if (dailyForecastType.value === 'twice_daily') {
    const nighttime = dailyForecasts.value.find((f) => f.is_daytime === false);
    return nighttime?.temperature ?? null;
  }
  return dailyForecasts.value[0]?.templow ?? null;
});

// --- Calendar subscriptions and event filtering ---

const DEFAULT_CAL_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1'];

const calendarEntries = store.calendars ?? [];
useCalendar(calendarEntries);
const calendarStore = useCalendarStore();

interface CalendarSlideEvent {
  event: CalendarEvent;
  color: string;
  calendarName: string;
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const todayStr = localDateStr(new Date());
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrowStr = localDateStr(tomorrowDate);

function eventsForDate(dateStr: string): CalendarSlideEvent[] {
  const items: CalendarSlideEvent[] = [];
  calendarEntries.forEach((entry, idx) => {
    if (!entry.entity) return;
    const entityColor = haStore.states[entry.entity]?.attributes.color as string | undefined;
    const color =
      entry.color ?? entityColor ?? DEFAULT_CAL_COLORS[idx % DEFAULT_CAL_COLORS.length] ?? '#888';
    const calendarName =
      entry.name ?? haStore.states[entry.entity]?.attributes.friendly_name ?? entry.entity;
    for (const event of calendarStore.events[entry.entity] ?? []) {
      if (event.start.slice(0, 10) === dateStr) items.push({ event, color, calendarName });
    }
  });
  items.sort((a, b) => a.event.start.localeCompare(b.event.start));
  return items;
}

const todayEvents = computed<CalendarSlideEvent[]>(() => eventsForDate(todayStr));
const tomorrowEvents = computed<CalendarSlideEvent[]>(() => eventsForDate(tomorrowStr));

// --- Slide list ---

const weatherSlides = computed<Slide[]>(() => {
  if (!store.weatherEntity) return [];
  const slides: Slide[] = [{ type: 'weather-current' }];
  if (supportsHourly.value) slides.push({ type: 'weather-hourly' });
  if (dailyForecastType.value) slides.push({ type: 'weather-daily' });
  return slides;
});

const calendarSlides = computed<Slide[]>(() => {
  const slides: Slide[] = [];
  if (todayEvents.value.length) slides.push({ type: 'calendar-today' });
  if (tomorrowEvents.value.length) slides.push({ type: 'calendar-tomorrow' });
  return slides;
});

const allSlides = computed<Slide[]>(() => {
  const photos = store.slides;
  const special = [...weatherSlides.value, ...calendarSlides.value];
  if (!special.length) return photos;
  if (!photos.length) return special;

  // Insert special slides as a group after the first third of photos
  const insertAt = Math.ceil(photos.length / 3);
  return [...photos.slice(0, insertAt), ...special, ...photos.slice(insertAt)];
});

// Keep currentSlide in bounds if the slide list changes
watch(allSlides, (slides) => {
  if (currentSlide.value >= slides.length) currentSlide.value = 0;
});

// --- Per-slide duration ---
// We want weather and calendar slides to stay up longer than picture slides
const currentSlideDuration = computed(() => {
  const slide = allSlides.value[currentSlide.value];
  return slide?.type !== 'image' ? store.slideSpeedMs * 2 : store.slideSpeedMs;
});

let slideTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleNextSlide() {
  if (slideTimer) clearTimeout(slideTimer);
  if (allSlides.value.length <= 1) return;
  slideTimer = setTimeout(() => carouselRef.value?.next(), currentSlideDuration.value);
}

watch(currentSlide, scheduleNextSlide, { immediate: true });
watch(() => store.slideSpeedMs, scheduleNextSlide);
onUnmounted(() => {
  if (slideTimer) clearTimeout(slideTimer);
});

// --- Weather slide navigation ---

function goToNearestWeatherSlide() {
  const weatherIndices = allSlides.value
    .map((slide, i) => ({ slide, i }))
    .filter(({ slide }) => slide.type.startsWith('weather-'))
    .map(({ i }) => i);

  if (!weatherIndices.length) return;

  const currentIsWeather = allSlides.value[currentSlide.value]?.type.startsWith('weather-');

  if (currentIsWeather) {
    // Already on a weather slide — cycle to the next one
    const pos = weatherIndices.indexOf(currentSlide.value);
    const next = weatherIndices[(pos + 1) % weatherIndices.length];
    if (next !== undefined) currentSlide.value = next;
  } else {
    // Jump to nearest weather slide by index distance
    const nearest = weatherIndices.reduce((best, idx) =>
      Math.abs(idx - currentSlide.value) < Math.abs(best - currentSlide.value) ? idx : best,
    );
    currentSlide.value = nearest;
  }
}

// --- Alerts ---

function alertClass(event: string) {
  return event.toLowerCase().replace(/\s+/g, '-');
}

function openAlert(alert: WeatherAlert) {
  selectedAlert.value = alert;
}
</script>

<style lang="scss" scoped>
.screensaver-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: #000;
  cursor: pointer;
}

.screensaver-carousel {
  height: 100%;
  background: transparent;

  :deep(.q-carousel__slide) {
    padding: 0;
  }
}

.screensaver-alerts {
  position: absolute;
  top: 24px;
  left: 24px;
  display: flex;
  flex-direction: row;
  gap: 16px;
  user-select: none;
}

.screensaver-weather-btn {
  &--clickable {
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
}

.weather-alert-badge {
  font-size: 1.1em;
  font-weight: 600;
  padding: 4px 12px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 1);
}
</style>
