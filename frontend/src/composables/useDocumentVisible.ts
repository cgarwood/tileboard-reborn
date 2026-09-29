import { readonly, ref } from 'vue';

// Shared across all callers: one listener for the whole app.
const visible = ref(document.visibilityState === 'visible');
document.addEventListener('visibilitychange', () => {
  visible.value = document.visibilityState === 'visible';
});

/** Reactive `document.visibilityState === 'visible'` (false e.g. when the kiosk screen is off). */
export function useDocumentVisible() {
  return readonly(visible);
}
