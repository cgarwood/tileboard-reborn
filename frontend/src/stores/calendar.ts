import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, watch } from 'vue';
import { useHomeAssistantStore } from './home-assistant';
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
    const now = new Date();
    const end = new Date(now.getTime() + DAYS_AHEAD * 86_400_000);
    return haStore.subscribeMessage<{ events: CalendarEvent[] }>(
      (msg) => { events.value[entityId] = msg.events ?? []; },
      {
        type: 'calendar/event/subscribe',
        entity_id: entityId,
        start: now.toISOString(),
        end: end.toISOString(),
      },
    );
  }

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
