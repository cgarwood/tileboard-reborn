<template>
  <q-dialog v-model="dialogOpen" @hide="emit('hide')">
    <q-card class="cal-event-dialog">
      <div class="cal-event-dialog__header" :style="{ borderLeft: `4px solid ${color}` }">
        <div class="cal-event-dialog__title" v-html="event.summary" />
        <q-btn flat round dense icon="close" color="white" @click="dialogOpen = false" />
      </div>

      <div class="cal-event-dialog__content">
        <div class="cal-event-dialog__row">
          <q-icon name="mdi-clock-outline" size="18px" />
          <span>{{ detailTime }}</span>
        </div>
        <div v-if="calendarName" class="cal-event-dialog__row">
          <q-icon name="mdi-calendar" size="18px" />
          <span>{{ calendarName }}</span>
        </div>
        <div v-if="event.location" class="cal-event-dialog__row">
          <q-icon name="mdi-map-marker-outline" size="18px" />
          <span>{{ event.location }}</span>
        </div>
        <div
          v-if="event.description"
          class="cal-event-dialog__description"
          v-html="event.description"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CalendarEvent } from '../../types/calendar';

const props = defineProps<{
  event: CalendarEvent;
  color: string;
  calendarName?: string;
}>();

const emit = defineEmits<{ hide: [] }>();

const dialogOpen = ref(true);

function isAllDay(event: CalendarEvent): boolean {
  return !event.start.includes('T');
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const detailTime = computed(() => {
  const { event } = props;
  if (isAllDay(event)) {
    const startStr = fmtDate(event.start);
    const eDate = new Date(event.end + 'T00:00:00');
    eDate.setDate(eDate.getDate() - 1);
    const endStr = eDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return startStr === endStr ? `${startStr} · All day` : `${startStr} – ${endStr} · All day`;
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
  return startStr === endStr
    ? `${startStr} · ${fmtTime(start)} – ${fmtTime(end)}`
    : `${startStr} ${fmtTime(start)} – ${endStr} ${fmtTime(end)}`;
});
</script>

<style lang="scss" scoped>
.cal-event-dialog {
  width: min(480px, 95vw);
  background: #1e1e2e;
  color: #fff;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 12px 16px 20px;
    background: rgba(255, 255, 255, 0.06);
    min-height: 64px;
  }

  &__title {
    flex: 1;
    font-size: 1.1rem;
    font-weight: 500;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__content {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.85);

    .q-icon {
      opacity: 0.5;
      flex-shrink: 0;
      margin-top: 1px;
    }
  }

  &__description {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    white-space: pre-wrap;
    padding-top: 4px;
    line-height: 1.5;
  }
}
</style>
