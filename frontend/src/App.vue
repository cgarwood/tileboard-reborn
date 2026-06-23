<template>
  <router-view />
  <SendspinBar v-if="sendspinStore.connected || sendspinStore.connecting" />
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
import { useSendspinStore } from './stores/sendspin';
import { useActionExecutor } from './composables/useActionExecutor';
import ScreensaverOverlay from './components/screensaver/ScreensaverOverlay.vue';
import SendspinBar from './components/sendspin/SendspinBar.vue';
import type { ScreensaverConfig } from './types/screensaver';
import type { WeatherAlertConfig, SendSpinConfig, EventsConfig } from './types/config';

const configStore = useConfigStore();
const haStore = useHomeAssistantStore();
const screensaverStore = useScreensaverStore();
const weatherAlertsStore = useWeatherAlertsStore();
const sendspinStore = useSendspinStore();
const { executeActions } = useActionExecutor();

interface TileboardEvent {
  event_type: 'tileboard';
  data: { command: string; [key: string]: unknown };
  time_fired: string;
  origin: string;
}

let unsubTileboardEvents: (() => Promise<void>) | null = null;

function handleTileboardEvent(event: TileboardEvent, eventsConfig: EventsConfig[]) {
  const { command, ...rest } = event.data;
  const match = eventsConfig.find((e) => e.command === command);
  if (!match) return;
  executeActions(match.action, rest);
}

watch(
  () => configStore.config,
  (config) => {
    if (config) {
      void haStore.connect(config.ha_url as string);
      if (config.screensaver) {
        void screensaverStore.initialize(config.screensaver as ScreensaverConfig);
      }
      if (config.weather_alerts) {
        weatherAlertsStore.startPolling(config.weather_alerts as WeatherAlertConfig);
      } else {
        weatherAlertsStore.stopPolling();
      }
      if (config.sendspin) {
        sendspinStore.initialize(config.sendspin as SendSpinConfig);
      }
    } else {
      haStore.disconnect();
      weatherAlertsStore.stopPolling();
    }
  },
  { immediate: true },
);

watch(
  () => haStore.connected,
  async (connected) => {
    if (unsubTileboardEvents) {
      await unsubTileboardEvents();
      unsubTileboardEvents = null;
    }
    const eventsConfig = configStore.config?.events as EventsConfig[] | undefined;
    if (!connected || !eventsConfig?.length) return;
    try {
      unsubTileboardEvents = await haStore.subscribeHassEvents<TileboardEvent>(
        (event) => handleTileboardEvent(event, eventsConfig),
        'tileboard',
      );
    } catch (e) {
      console.error('[Events] Failed to subscribe to tileboard events', e);
    }
  },
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
