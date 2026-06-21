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

    <!-- Detail dialog -->
    <q-dialog v-model="dialogOpen">
      <q-card class="cal-detail">
        <q-card-section class="row items-center no-wrap">
          <div class="cal-detail__color-dot" :style="{ background: selectedItem?.color }" />
          <div class="text-h6 ellipsis" v-html="selectedItem?.event.summary" />
          <q-space />
          <q-btn flat round dense icon="mdi-close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="cal-detail__body q-gutter-sm">
          <div class="cal-detail__row">
            <q-icon name="mdi-clock-outline" size="18px" color="grey-5" />
            <span>{{ selectedItem ? formatDetailTime(selectedItem.event) : '' }}</span>
          </div>
          <div v-if="selectedItem?.calendarName" class="cal-detail__row">
            <q-icon name="mdi-calendar" size="18px" color="grey-5" />
            <span>{{ selectedItem.calendarName }}</span>
          </div>
          <div v-if="selectedItem?.event.location" class="cal-detail__row">
            <q-icon name="mdi-map-marker-outline" size="18px" color="grey-5" />
            <span>{{ selectedItem.event.location }}</span>
          </div>
          <div
            v-if="selectedItem?.event.description"
            class="cal-detail__description"
            v-html="selectedItem.event.description"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('calendar', { width: 4, height: 4 });
</script>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
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

const dialogOpen = ref(false);
const selectedItem = ref<EventItem | null>(null);

function openDetail(item: EventItem) {
  selectedItem.value = item;
  dialogOpen.value = true;
}

function parseEventMs(start: string): number | null {
  if (!start) return null;
  const ms = Date.parse(start);
  return isNaN(ms) ? null : ms;
}

// All-day events use a date-only string (no 'T')
function isAllDay(event: CalendarEvent): boolean {
  return !event.start.includes('T');
}

function formatEventTime(event: CalendarEvent): string {
  if (isAllDay(event)) {
    return formatDate(event.start) + ' · All day';
  }
  const start = new Date(event.start);
  const today = new Date();
  const isToday = start.toDateString() === today.toDateString();
  const datePart = isToday
    ? 'Today'
    : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${datePart} · ${fmtTime(start)}–${fmtTime(new Date(event.end))}`;
}

function formatDetailTime(event: CalendarEvent): string {
  if (isAllDay(event)) {
    const s = formatDate(event.start);
    // HA end date for all-day is exclusive, subtract one day for display
    const eDate = new Date(event.end + 'T00:00:00');
    eDate.setDate(eDate.getDate() - 1);
    const eDateStr = eDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return s === eDateStr ? `${s} · All day` : `${s} – ${eDateStr} · All day`;
  }
  const start = new Date(event.start);
  const end = new Date(event.end);
  const startStr = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  if (startStr === endStr) {
    return `${startStr} · ${fmtTime(start)} – ${fmtTime(end)}`;
  }
  return `${startStr} ${fmtTime(start)} – ${endStr} ${fmtTime(end)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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

.cal-detail {
  width: min(560px, 95vw);

  &__color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-right: 10px;
  }

  &__body {
    display: flex;
    flex-direction: column;
  }

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.9rem;
  }

  &__description {
    font-size: 0.875rem;
    opacity: 0.75;
    white-space: pre-wrap;
    padding-top: 4px;
  }
}
</style>
