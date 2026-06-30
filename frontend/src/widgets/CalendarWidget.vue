<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <q-card-section class="widget-body q-pa-none cal-widget">
      <!-- Event list -->
      <div class="cal-widget__scroll-wrap">
        <q-scroll-area class="cal-widget__scroll">
          <q-list dense class="cal-widget__list">
            <template v-if="sortedEvents.length">
              <q-item
                v-for="item in sortedEvents"
                :key="item.key"
                clickable
                class="cal-widget__item"
                @click="openDetail(item)"
              >
                <div class="cal-widget__color-bar" :style="{ background: item.color }" />
                <q-item-section>
                  <q-item-label class="cal-widget__event-title ellipsis">
                    {{ item.event.summary }}
                  </q-item-label>
                  <q-item-label caption class="cal-widget__event-time">
                    {{ formatEventTime(item.event) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section v-if="item.calendarName" side class="cal-widget__cal-name">
                  <q-item-label caption>{{ item.calendarName }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <q-item v-else>
              <q-item-section>
                <q-item-label caption class="text-center q-py-md">No upcoming events</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <div class="cal-widget__fade" />
      </div>

      <div class="label-group">
        <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>

  </BaseWidget>
  <MoreInfoCalendarEvent
    v-if="selectedItem"
    :event="selectedItem.event"
    :color="selectedItem.color"
    :calendar-name="selectedItem.calendarName"
    @hide="selectedItem = null"
  />
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('calendar', { width: 4, height: 4 });
</script>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import MoreInfoCalendarEvent from '../components/more-info/MoreInfoCalendarEvent.vue';
import { useWidget } from '../composables/useWidget';
import { useCalendar } from '../composables/useCalendar';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';
import type { CalendarEntry, CalendarEvent } from '../types/calendar';

const DEFAULT_COLORS = [
  '#e53935',
  '#1e88e5',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
  '#f4511e',
  '#0b8043',
];

interface EventItem {
  key: string;
  event: CalendarEvent;
  color: string;
  calendarName: string;
  startMs: number;
}

const props = defineProps<{ widget: Widget }>();

const { title, subtitle, backgroundStyle } = useWidget(() => props.widget);
const haStore = useHomeAssistantStore();

const entries = computed<CalendarEntry[]>(
  () => (props.widget.calendars as CalendarEntry[] | undefined) ?? [],
);

const calendarStore = useCalendar(entries.value);

const sortedEvents = computed<EventItem[]>(() => {
  const items: EventItem[] = [];
  const now = Date.now();

  entries.value.forEach((entry, idx) => {
    if (!entry?.entity) return;
    const entityColor = haStore.states[entry.entity]?.attributes.color as string | undefined;
    const color =
      entry.color ?? entityColor ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length] ?? '#888';
    const entityEvents = calendarStore.events[entry.entity] ?? [];
    const calendarName =
      entry.name ?? haStore.states[entry.entity]?.attributes.friendly_name ?? entry.entity;

    for (const event of entityEvents) {
      const startMs = parseEventMs(event.start);
      if (startMs === null) continue;
      const endMs = parseEventMs(event.end);
      if (endMs !== null && endMs < now) continue;

      items.push({
        key: `${entry.entity}-${event.summary}-${event.start}`,
        event,
        color,
        calendarName,
        startMs,
      });
    }
  });

  items.sort((a, b) => a.startMs - b.startMs);
  return items;
});

const selectedItem = ref<EventItem | null>(null);

function openDetail(item: EventItem) {
  selectedItem.value = item;
}

function parseEventMs(start: string): number | null {
  if (!start) return null;
  const ms = Date.parse(start);
  return isNaN(ms) ? null : ms;
}

function isAllDay(event: CalendarEvent): boolean {
  return !event.start.includes('T');
}

function formatEventTime(event: CalendarEvent): string {
  if (isAllDay(event)) {
    const d = new Date(event.start + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · All day';
  }
  const start = new Date(event.start);
  const today = new Date();
  const isToday = start.toDateString() === today.toDateString();
  const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const datePart = isToday
    ? 'Today'
    : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${datePart} · ${fmtTime(start)}–${fmtTime(new Date(event.end))}`;
}
</script>

<style lang="scss">
.widget-calendar {
  background: var(--calendar-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.cal-widget {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__scroll-wrap {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  &__scroll {
    height: 100%;

    :deep(.q-scrollarea__bar--h) {
      display: none;
    }
  }

  &__list {
    padding: 4px 0;
  }

  &__fade {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to bottom, transparent, var(--calendar-widget-background));
    pointer-events: none;
    z-index: 1;
  }

  :deep(.label-group) {
    position: relative;
    bottom: auto;
    left: auto;
    padding: 4px 6px 6px;
    flex-shrink: 0;
  }

  &__item {
    padding-left: 0;
    min-height: 48px;
  }

  &__color-bar {
    width: 4px;
    align-self: stretch;
    border-radius: 2px;
    margin: 6px 10px 6px 8px;
    flex-shrink: 0;
  }

  &__event-title {
    font-size: 0.875rem;
    color: #fff;
  }

  &__event-time {
    font-size: 0.72rem;
    opacity: 0.6;
    color: #fff !important;
  }

  &__cal-name {
    font-size: 0.7rem;
    opacity: 0.45;
    text-transform: capitalize;
    max-width: 80px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

</style>
