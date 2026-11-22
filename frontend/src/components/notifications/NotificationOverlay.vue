<template>
  <!-- Rendered by App.vue after the screensaver, and stacked above it, so both show over it -->
  <transition name="notification-banner">
    <div
      v-if="store.banner"
      :key="store.banner.id"
      class="notification-banner"
      :class="`notification--${store.banner.level}`"
      role="status"
      @click="store.hideBanner(true)"
    >
      <q-icon :name="iconFor(store.banner)" size="28px" class="notification-banner__icon" />
      <div class="notification-banner__text">
        <div v-if="store.banner.title" class="notification-banner__title">
          {{ store.banner.title }}
        </div>
        <div v-if="store.banner.message" class="notification-banner__message">
          {{ store.banner.message }}
        </div>
      </div>
      <div class="notification-banner__timer" :style="{ animationDuration: `${bannerMs}ms` }" />
    </div>
  </transition>

  <transition name="notification-critical">
    <div v-if="store.critical" class="notification-critical" role="alertdialog">
      <div :key="store.critical.id" class="notification-critical__card">
        <q-icon :name="iconFor(store.critical)" class="notification-critical__icon" />
        <div v-if="store.critical.title" class="notification-critical__title">
          {{ store.critical.title }}
        </div>
        <div v-if="store.critical.message" class="notification-critical__message">
          {{ store.critical.message }}
        </div>
        <div class="notification-critical__time">
          {{ formatTime(store.critical.time) }}
          <template v-if="store.criticalCount > 1"> · {{ store.criticalCount - 1 }} more</template>
        </div>
        <q-btn
          unelevated
          no-caps
          size="lg"
          color="white"
          text-color="black"
          label="Dismiss"
          class="notification-critical__dismiss"
          @click="store.dismissCritical()"
        />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue';
import { notificationIcon as iconFor, useNotificationsStore } from '../../stores/notifications';

const store = useNotificationsStore();

function formatTime(time: number) {
  return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const bannerMs = computed(() => (store.banner ? store.bannerDuration(store.banner) : 0));

// Each banner times out on its own; the next queued one starts its own timer when it appears
let timer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => store.banner?.id,
  (id) => {
    if (timer) clearTimeout(timer);
    timer = id ? setTimeout(() => store.hideBanner(false), bannerMs.value) : null;
  },
  { immediate: true },
);
onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style lang="scss" scoped>
.notification--info {
  --notification-color: var(--level-info);
}
.notification--warning {
  --notification-color: var(--level-warning);
}
.notification--critical {
  --notification-color: var(--level-error);
}

.notification-banner {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6500;
  width: min(560px, calc(100vw - 24px));
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px 16px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--notification-color);
  color: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  cursor: pointer;

  &__icon {
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.25;
  }

  &__message {
    font-size: 0.95rem;
    line-height: 1.3;
    white-space: pre-line;
  }

  // Shrinking bar along the bottom edge showing time left
  &__timer {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: 100%;
    background: rgba(255, 255, 255, 0.55);
    transform-origin: left;
    animation: notification-timer linear forwards;
  }
}

@keyframes notification-timer {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.notification-banner-enter-active,
.notification-banner-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.notification-banner-enter-from,
.notification-banner-leave-to {
  transform: translate(-50%, -24px);
  opacity: 0;
}

.notification-critical {
  position: fixed;
  inset: 0;
  z-index: 6600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.72);

  &__card {
    width: min(640px, 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 36px 32px 28px;
    border-radius: 18px;
    background: var(--level-error);
    color: #fff;
    text-align: center;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
    animation: notification-pulse 2s ease-in-out infinite;
  }

  &__icon {
    font-size: 5rem;
  }

  &__title {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
  }

  &__message {
    font-size: 1.35rem;
    line-height: 1.35;
    white-space: pre-line;
  }

  &__time {
    font-size: 0.85rem;
    opacity: 0.75;
  }

  &__dismiss {
    margin-top: 12px;
    min-width: 180px;
    font-weight: 600;
  }
}

@keyframes notification-pulse {
  0%,
  100% {
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.6),
      0 0 0 0 rgba(255, 82, 82, 0.6);
  }
  50% {
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.6),
      0 0 0 18px rgba(255, 82, 82, 0);
  }
}

.notification-critical-enter-active,
.notification-critical-leave-active {
  transition: opacity 0.3s ease;
}
.notification-critical-enter-from,
.notification-critical-leave-to {
  opacity: 0;
}
</style>
