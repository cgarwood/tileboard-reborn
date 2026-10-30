import { readonly, shallowRef } from 'vue';

// Shared across all callers: one timer for the whole app, started on first use.
const now = shallowRef(new Date());
const readonlyNow = readonly(now);
let timerId: ReturnType<typeof setTimeout> | null = null;

// Tick just after each minute boundary. Re-aligning every tick keeps it accurate even if the
// browser throttles or delays timers.
function tick() {
  if (timerId !== null) clearTimeout(timerId);
  const d = new Date();
  now.value = d;
  timerId = setTimeout(tick, 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50);
}

/**
 * Reactive current time, updated on each minute boundary and when the page becomes visible again
 * (timers are throttled while the kiosk screen is off). Anything that reads it re-runs once a minute.
 */
export function useMinuteClock() {
  if (timerId === null) {
    tick();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') tick();
    });
  }
  return readonlyNow;
}
