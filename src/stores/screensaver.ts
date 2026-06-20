import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import type { ScreensaverConfig, Slide } from '../types/screensaver';

const SLIDE_SPEED_DEFAULT = 7;

export const useScreensaverStore = defineStore('screensaver', () => {
  const active = ref(false);
  const slides = ref<Slide[]>([]);
  const slideSpeedMs = ref(SLIDE_SPEED_DEFAULT * 1000);
  const weatherEntity = ref<string | null>(null);

  let timeoutSeconds = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  async function initialize(config: ScreensaverConfig) {
    timeoutSeconds = config.timeout;
    slideSpeedMs.value = (config.speed ?? SLIDE_SPEED_DEFAULT) * 1000;
    weatherEntity.value = config.weather_entity ?? null;
    await loadSlides(config);
    scheduleActivation();
  }

  async function loadSlides(config: ScreensaverConfig) {
    try {
      const response = await fetch(config.source);
      const paths = (await response.json()) as string[];
      slides.value = paths.map((path) => ({
        type: 'image' as const,
        url: config.sourcePrefix ? `${config.sourcePrefix}${path}` : path,
      }));
    } catch (e) {
      console.error('Screensaver: failed to load slides', e);
    }
  }

  function scheduleActivation() {
    if (timerId) clearTimeout(timerId);
    if (timeoutSeconds <= 0) return;
    timerId = setTimeout(() => {
      active.value = true;
    }, timeoutSeconds * 1000);
  }

  function onActivity() {
    if (active.value) return;
    scheduleActivation();
  }

  function dismiss() {
    active.value = false;
    scheduleActivation();
  }

  return { active, slides, slideSpeedMs, weatherEntity, initialize, onActivity, dismiss };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScreensaverStore, import.meta.hot));
}
