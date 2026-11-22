<template>
  <q-dialog v-model="dialogOpen" @hide="onHide">
    <q-card class="notifications-dialog">
      <div class="notifications-dialog__header">
        <div class="notifications-dialog__header-text">
          <div class="notifications-dialog__title">Notifications</div>
          <div class="notifications-dialog__subtitle">{{ summary }}</div>
        </div>
        <q-btn
          flat
          round
          dense
          icon="mdi-close"
          color="white"
          aria-label="Close"
          @click="dialogOpen = false"
        />
      </div>

      <div class="notifications-dialog__content">
        <div v-if="!store.history.length" class="notifications-dialog__empty">
          <q-icon name="mdi-bell-outline" size="40px" />
          No notifications
        </div>
        <div
          v-for="n in store.history"
          :key="n.id"
          class="notification-item"
          :class="[
            `notification-item--${n.level}`,
            { 'notification-item--unread': unreadIds.has(n.id) },
          ]"
        >
          <q-icon :name="notificationIcon(n)" size="22px" class="notification-item__icon" />
          <div class="notification-item__body">
            <div v-if="n.title" class="notification-item__title">{{ n.title }}</div>
            <div v-if="n.message" class="notification-item__message">{{ n.message }}</div>
            <div class="notification-item__meta">{{ timeAgo(n.time) }}</div>
          </div>
        </div>
      </div>

      <q-separator dark />
      <div class="notifications-dialog__actions">
        <q-btn
          flat
          no-caps
          color="white"
          icon="mdi-delete-sweep-outline"
          label="Clear"
          :disable="!store.history.length"
          @click="store.clearHistory()"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMinuteClock } from '../../composables/useMinuteClock';
import { notificationIcon, useNotificationsStore } from '../../stores/notifications';

const emit = defineEmits<{ hide: [] }>();

const store = useNotificationsStore();
const dialogOpen = ref(true);
const minuteClock = useMinuteClock();

// Highlight what was unread when the dialog opened, then count it all as read once it closes
const unreadIds = new Set(store.history.filter((n) => !n.read).map((n) => n.id));

const summary = computed(() => {
  const total = store.history.length;
  if (!total) return 'None yet';
  return unreadIds.size ? `${unreadIds.size} new` : `${total} recent`;
});

function timeAgo(time: number) {
  void minuteClock.value; // refresh every minute
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const d = new Date(time);
  const sameDay = d.toDateString() === new Date().toDateString();
  const clock = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return sameDay
    ? clock
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${clock}`;
}

function onHide() {
  store.markAllRead();
  emit('hide');
}
</script>

<style lang="scss" scoped>
// Matches IssuesDialog / DeviceInfoDialog.
.notifications-dialog {
  width: min(520px, 95vw);
  background: #1e1e2e;
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 12px 16px 20px;
    background: rgba(255, 255, 255, 0.06);
    min-height: 64px;
    flex-shrink: 0;
  }

  &__header-text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 500;
  }

  &__subtitle {
    font-size: 0.75rem;
    opacity: 0.65;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }

  &__content {
    max-height: 70vh;
    overflow-y: auto;
    padding: 12px 20px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    opacity: 0.6;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px;
  }
}

.notification-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 10px 0 10px 4px;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  &--info .notification-item__icon {
    color: #64b5f6;
  }

  &--warning .notification-item__icon {
    color: #ffb74d;
  }

  &--critical .notification-item__icon {
    color: #ff8a80;
  }

  // Unread dot in the left margin
  &--unread::before {
    content: '';
    position: absolute;
    left: -12px;
    top: 18px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #64b5f6;
  }

  &__icon {
    margin-top: 1px;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.3;
  }

  &__message {
    font-size: 0.9rem;
    line-height: 1.3;
    opacity: 0.9;
    white-space: pre-line;
  }

  &__meta {
    margin-top: 4px;
    font-size: 0.7rem;
    opacity: 0.55;
  }
}
</style>
