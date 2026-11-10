import { defineStore, acceptHMRUpdate } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useHomeAssistantStore } from './home-assistant';
import { useMinuteClock } from '../composables/useMinuteClock';
import { localDateStr } from '../utils/formatters';
import type { CalendarEvent } from '../types/calendar';

const DAYS_AHEAD = 30;

export const useCalendarStore = defineStore('calendar', () => {
  const haStore = useHomeAssistantStore();
  const events = ref<Record<string, CalendarEvent[]>>({});

  // Non-reactive: keyed by entityId
  const subs = new Map<string, {
    unsubPromise: Promise<() => Promise<void>> | null;
    refCount: number;
  }>();

  function doSubscribe(entityId: string): Promise<() => Promise<void>> {
    // Window starts at local midnight so today's earlier events are included.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + DAYS_AHEAD);
    return haStore.subscribeMessage<{ events: CalendarEvent[] }>(
      (msg) => { events.value[entityId] = msg.events ?? []; },
      {
        type: 'calendar/event/subscribe',
        entity_id: entityId,
        start: start.toISOString(),
        end: end.toISOString(),
      },
    );
  }

  // The subscription window is fixed when it's created, so move it forward when the local date
  // changes. Otherwise past days' events linger until the page reloads.
  const clock = useMinuteClock();
  const today = computed(() => localDateStr(clock.value));
  watch(today, () => {
    if (!haStore.connected) return;
    for (const [entityId, sub] of subs.entries()) {
      if (sub.unsubPromise) void sub.unsubPromise.then((unsub) => void unsub()).catch(() => {});
      sub.unsubPromise = doSubscribe(entityId);
    }
  });

  watch(
    () => haStore.connected,
    (connected) => {
      if (!connected) {
        for (const sub of subs.values()) sub.unsubPromise = null;
        events.value = {};
      } else {
        for (const [entityId, sub] of subs.entries()) {
          if (!sub.unsubPromise) sub.unsubPromise = doSubscribe(entityId);
        }
      }
    },
  );

  function subscribe(entityId: string): void {
    if (!entityId) return;
    const existing = subs.get(entityId);
    if (existing) { existing.refCount++; return; }

    const unsubPromise = haStore.connected ? doSubscribe(entityId) : null;
    subs.set(entityId, { unsubPromise, refCount: 1 });
  }

  function unsubscribe(entityId: string): void {
    const sub = subs.get(entityId);
    if (!sub) return;
    sub.refCount--;
    if (sub.refCount > 0) return;

    if (sub.unsubPromise) {
      void sub.unsubPromise.then((unsub) => void unsub()).catch(() => {});
    }
    subs.delete(entityId);
    delete events.value[entityId];
  }

  return { events, subscribe, unsubscribe };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalendarStore, import.meta.hot));
}
