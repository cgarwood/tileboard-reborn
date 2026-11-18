import { computed, shallowRef } from 'vue';
import { useConfigStore } from '../stores/config';
import type { LayoutConfig } from '../types/config';

export type Orientation = 'landscape' | 'portrait';
export type NavPosition = 'left' | 'bottom';

// One media query listener for the whole app, created on first use.
const devicePortrait = shallowRef(false);
let query: MediaQueryList | null = null;

function watchDeviceOrientation() {
  if (query) return;
  query = window.matchMedia('(orientation: portrait)');
  devicePortrait.value = query.matches;
  query.addEventListener('change', (e) => {
    devicePortrait.value = e.matches;
  });
}

/**
 * Resolved page layout from the top-level `layout` config. `auto` (the default) follows the
 * device's current orientation and updates when it rotates.
 */
export function useLayout() {
  watchDeviceOrientation();
  const configStore = useConfigStore();
  const layoutConfig = computed(() => (configStore.config?.layout ?? {}) as LayoutConfig);

  const orientation = computed<Orientation>(() => {
    const setting = layoutConfig.value.orientation ?? 'auto';
    if (setting === 'landscape' || setting === 'portrait') return setting;
    return devicePortrait.value ? 'portrait' : 'landscape';
  });

  const navPosition = computed<NavPosition>(() => {
    const setting = layoutConfig.value.nav_position ?? 'auto';
    if (setting === 'left' || setting === 'bottom') return setting;
    return orientation.value === 'portrait' ? 'bottom' : 'left';
  });

  return { orientation, navPosition };
}
