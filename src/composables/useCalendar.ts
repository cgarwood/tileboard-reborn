import { onUnmounted } from 'vue';
import { useCalendarStore } from '../stores/calendar';
import type { CalendarEntry } from '../types/calendar';

export function useCalendar(entries: CalendarEntry[]) {
  const calendarStore = useCalendarStore();

  for (const entry of entries) {
    calendarStore.subscribe(entry.entity);
  }

  onUnmounted(() => {
    for (const entry of entries) {
      calendarStore.unsubscribe(entry.entity);
    }
  });

  return calendarStore;
}
