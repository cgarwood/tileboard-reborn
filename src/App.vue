<template>
  <router-view />
  <transition name="screensaver">
    <ScreensaverOverlay v-if="screensaverStore.active" />
  </transition>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';
import { useConfigStore } from './stores/config';
import { useHomeAssistantStore } from './stores/home-assistant';
import { useScreensaverStore } from './stores/screensaver';
import { useWeatherAlertsStore } from './stores/weather-alerts';
import ScreensaverOverlay from './components/screensaver/ScreensaverOverlay.vue';
import type { ScreensaverConfig } from './types/screensaver';
import type { WeatherAlertConfig } from './types/config';

const configStore = useConfigStore();
const haStore = useHomeAssistantStore();
const screensaverStore = useScreensaverStore();
const weatherAlertsStore = useWeatherAlertsStore();

watch(
  () => configStore.config,
  (config) => {
    if (config) {
      void haStore.connect(config.haUrl as string);
      if (config.screensaver) {
        void screensaverStore.initialize(config.screensaver as ScreensaverConfig);
      }
      if (config.weatherAlerts) {
        weatherAlertsStore.startPolling(config.weatherAlerts as WeatherAlertConfig);
      } else {
        weatherAlertsStore.stopPolling();
      }
    } else {
      haStore.disconnect();
      weatherAlertsStore.stopPolling();
    }
  },
  { immediate: true },
);

function onActivity() {
  screensaverStore.onActivity();
}

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'wheel'] as const;

onMounted(() => {
  ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
});

onUnmounted(() => {
  ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
});
</script>

<style>
.screensaver-enter-active,
.screensaver-leave-active {
  transition: opacity 1s ease;
}

.screensaver-enter-from,
.screensaver-leave-to {
  opacity: 0;
}
</style>
