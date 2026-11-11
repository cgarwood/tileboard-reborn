import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import type { SlideBackground } from '../types/screensaver';

const NULL_ENTITY = { state: null as unknown as string, attributes: {} };

// Weather conditions with their own image in public/backgrounds/weather/. Add a condition here
// when its {condition}.jpg is added, so missing ones don't cost a 404 each.
const BUILT_IN_WEATHER_CONDITIONS = new Set<string>([]);

export const BUILT_IN_BACKGROUNDS = {
  calendar: ['/backgrounds/calendar.jpg'],
  menu: ['/backgrounds/menu.jpg'],
  weather: (condition: string | undefined) => [
    ...(condition && BUILT_IN_WEATHER_CONDITIONS.has(condition)
      ? [`/backgrounds/weather/${condition}.jpg`]
      : []),
    '/backgrounds/weather/default.jpg',
  ],
};

// One load per URL for the session, so failed candidates aren't retried on every slide change
const loads = new Map<string, Promise<boolean>>();

function preload(url: string): Promise<boolean> {
  let load = loads.get(url);
  if (!load) {
    load = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => {
        console.warn('[screensaver] Background failed to load, falling back:', url);
        resolve(false);
      };
      img.src = url;
    });
    loads.set(url, load);
  }
  return load;
}

/**
 * Background image URL for a screensaver slide: the configured `background` (resolved against
 * `entityId`) if it loads, else the first built-in that loads, else null (gradient only).
 * `background: false` skips the built-ins too. The previous image stays until the next one has
 * loaded, so a condition change never flashes the bare gradient.
 */
export function useSlideBackground(
  background: () => SlideBackground | undefined,
  entityId: () => string | null | undefined,
  builtIns: (state: string | undefined) => string[],
): Ref<string | null> {
  const haStore = useHomeAssistantStore();

  const candidates = computed(() => {
    const value = background();
    if (value === false) return [];
    const id = entityId();
    const entity = id ? haStore.states[id] : undefined;
    const resolved = resolveWidgetProp(value, {
      state: entity?.state ?? null,
      attributes: entity?.attributes ?? {},
      entity: (other) => haStore.states[other] ?? NULL_ENTITY,
      states: haStore.states,
    })?.trim();
    return [...(resolved ? [resolved] : []), ...builtIns(entity?.state)];
  });

  const url = ref<string | null>(null);

  // Keyed on the joined list so unrelated state updates don't restart the search
  watch(
    () => candidates.value.join('\n'),
    async (_key, _old, onCleanup) => {
      let stale = false;
      onCleanup(() => (stale = true));
      for (const candidate of candidates.value) {
        if (await preload(candidate)) {
          if (!stale) url.value = candidate;
          return;
        }
      }
      if (!stale) url.value = null;
    },
    { immediate: true },
  );

  return url;
}

/** Style binding that hands a background URL to the slide's CSS as `--slide-bg`. */
export function slideBackgroundStyle(url: string | null): Record<string, string> {
  return url ? { '--slide-bg': `url(${JSON.stringify(url)})` } : {};
}
