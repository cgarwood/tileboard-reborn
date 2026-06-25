import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, watch } from 'vue';
import type { HABrowseMediaResult, ScreensaverConfig, Slide } from '../types/screensaver';
import { useHomeAssistantStore } from './home-assistant';

const SLIDE_SPEED_DEFAULT = 7;

export const useScreensaverStore = defineStore('screensaver', () => {
  const active = ref(false);
  const slides = ref<Slide[]>([]);
  const slideSpeedMs = ref(SLIDE_SPEED_DEFAULT * 1000);
  const weatherEntity = ref<string | null>(null);
  const calendars = ref<ScreensaverConfig['calendars']>([]);

  let timeoutSeconds = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  async function initialize(config: ScreensaverConfig) {
    timeoutSeconds = config.timeout;
    slideSpeedMs.value = (config.slide_duration ?? SLIDE_SPEED_DEFAULT) * 1000;
    weatherEntity.value = config.weather_entity ?? null;
    calendars.value = config.calendars ?? [];

    const haStore = useHomeAssistantStore();
    if (haStore.connected) {
      await loadSlides(config);
    } else {
      const stop = watch(
        () => haStore.connected,
        async (connected) => {
          if (connected) {
            stop();
            await loadSlides(config);
          }
        },
      );
    }

    scheduleActivation();
  }

  async function loadSlides(config: ScreensaverConfig) {
    const haStore = useHomeAssistantStore();
    try {
      const result = await haStore.sendMessage<HABrowseMediaResult>({
        type: 'media_source/browse_media',
        media_content_id: config.media_source,
      });

      const images = (result.children ?? []).filter((child) => !child.can_expand);

      slides.value = await Promise.all(
        images.map(async (child) => {
          const { url } = await haStore.sendMessage<{ url: string }>({
            type: 'media_source/resolve_media',
            media_content_id: child.media_content_id,
          });
          return { type: 'image' as const, url: await haStore.signPath(url) };
        }),
      );
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

  return { active, slides, slideSpeedMs, weatherEntity, calendars, initialize, onActivity, dismiss };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScreensaverStore, import.meta.hot));
}
