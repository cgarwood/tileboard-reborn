<template>
  <div class="calendar-slide">
    <q-icon
      v-if="day === 'tomorrow'"
      name="mdi-arrow-right-bold-circle-outline"
      class="cal-slide__arrow-watermark"
    />
    <div class="cal-slide__header">
      {{ day === 'today' ? "Today's Events" : "Tomorrow's Events" }}
    </div>
    <div class="cal-slide__date">{{ dateLabel }}</div>
    <div class="cal-slide__list">
      <div v-for="(item, i) in events.slice(0, 7)" :key="i" class="cal-slide__item">
        <div class="cal-slide__color-bar" :style="{ background: item.color }" />
        <div class="cal-slide__content">
          <div class="cal-slide__time">{{ formatTime(item.event) }}</div>
          <div class="cal-slide__title">{{ item.event.summary }}</div>
          <div v-if="item.calendarName" class="cal-slide__calendar">{{ item.calendarName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarEvent } from '../../types/calendar';

interface CalendarSlideEvent {
  event: CalendarEvent;
  color: string;
  calendarName: string;
}

const props = defineProps<{
  day: 'today' | 'tomorrow';
  events: CalendarSlideEvent[];
}>();

const dateLabel = computed(() => {
  const d = new Date();
  if (props.day === 'tomorrow') d.setDate(d.getDate() + 1);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
});

function isAllDay(event: CalendarEvent): boolean {
  return !event.start.includes('T');
}

function formatTime(event: CalendarEvent): string {
  if (isAllDay(event)) return 'All day';
  const start = new Date(event.start);
  const end = new Date(event.end);
  return `${fmtTime(start)} – ${fmtTime(end)}`;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
</script>

<style lang="scss" scoped>
.calendar-slide {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, rgba(10, 22, 40, 0.8) 0%, rgba(22, 32, 50, 0.8) 100%),
    url('/calendar_background.jpg') center / cover no-repeat;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding-bottom: 30vh;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  user-select: none;
}

.cal-slide {
  &__arrow-watermark {
    position: absolute;
    bottom: -180px;
    left: -180px;
    font-size: 980px;
    opacity: 0.08;
    pointer-events: none;
  }

  &__header {
    font-size: 1.4rem;
    font-weight: 300;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.55;
  }

  &__date {
    font-size: 1.1rem;
    opacity: 0.6;
    margin-top: -24px;
    letter-spacing: 0.05em;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 480px;
    max-width: 700px;
  }

  &__item {
    display: flex;
    align-items: stretch;
    gap: 16px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px 20px 12px 0;
    overflow: hidden;
  }

  &__color-bar {
    width: 5px;
    border-radius: 0 3px 3px 0;
    flex-shrink: 0;
    align-self: stretch;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__time {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    opacity: 0.55;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__calendar {
    font-size: 0.78rem;
    opacity: 0.45;
    margin-top: 1px;
  }
}
</style>
