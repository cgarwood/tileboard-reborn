<template>
  <!-- Minimized pill -->
  <Transition name="ss-fade">
    <button v-if="minimized && hasMedia" class="ss-pill" @click="minimized = false">
      <q-icon :name="store.isPlaying ? 'mdi-music-note' : 'mdi-music-note-off'" size="18px" />
    </button>
  </Transition>

  <!-- Full bar -->
  <Transition name="ss-slide">
    <div v-if="!minimized && hasMedia" class="ss-bar">
      <!-- Thin progress line at top -->
      <div class="ss-bar__track">
        <div class="ss-bar__track-fill" :style="{ width: progressPercent + '%' }" />
      </div>

      <div class="ss-bar__content">
        <!-- Album art -->
        <img
          v-if="store.metadata?.artwork_url"
          :src="store.metadata.artwork_url"
          class="ss-bar__art"
        />
        <div v-else class="ss-bar__art-placeholder">
          <q-icon name="mdi-music" size="20px" color="grey-5" />
        </div>

        <!-- Track info (click to open dialog) -->
        <div class="ss-bar__info" @click="dialogOpen = true">
          <div class="ss-bar__title ellipsis">
            {{ store.metadata?.title ?? 'No media playing' }}
          </div>
          <div class="ss-bar__artist ellipsis">{{ store.metadata?.artist ?? '' }}</div>
        </div>

        <!-- Time -->
        <div class="ss-bar__time">
          {{ formatMs(store.trackPositionMs) }}
          <span class="ss-bar__time-sep">/</span>
          {{ formatMs(store.trackDurationMs) }}
        </div>

        <!-- Controls -->
        <div class="ss-bar__controls">
          <q-btn flat round dense icon="mdi-skip-previous" size="sm" @click="store.previous()" />
          <q-btn
            flat
            round
            dense
            :icon="store.isPlaying ? 'mdi-pause' : 'mdi-play'"
            size="md"
            @click="store.togglePlayPause()"
          />
          <q-btn flat round dense icon="mdi-skip-next" size="sm" @click="store.next()" />
        </div>

        <!-- Minimize -->
        <q-btn flat round dense icon="mdi-chevron-down" size="sm" @click="minimized = true" />
      </div>
    </div>
  </Transition>

  <SendspinDialog v-model="dialogOpen" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSendspinStore } from '../../stores/sendspin';
import SendspinDialog from './SendspinDialog.vue';

const store = useSendspinStore();
const minimized = ref(!store.isPlaying);
const dialogOpen = ref(false);

const hasMedia = computed(() => store.isPlaying || store.metadata != null);

// Auto-show bar when playback starts
watch(
  () => store.isPlaying,
  (playing) => {
    if (playing) minimized.value = false;
  },
);

const progressPercent = computed(() => {
  if (!store.trackDurationMs) return 0;
  return Math.min(100, (store.trackPositionMs / store.trackDurationMs) * 100);
});

function formatMs(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
</script>

<style lang="scss" scoped>
.ss-bar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: min(800px, calc(100vw - 32px));
  z-index: 2000;
  background: rgba(18, 18, 28, 0.97);
  color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);

  &__track {
    height: 3px;
    background: rgba(255, 255, 255, 0.12);
  }

  &__track-fill {
    height: 100%;
    background: var(--q-primary);
    transition: width 0.5s linear;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    height: 60px;
  }

  &__art {
    width: 42px;
    height: 42px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__art-placeholder {
    width: 42px;
    height: 42px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }

  &__title {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.3;
  }

  &__artist {
    font-size: 0.75rem;
    opacity: 0.6;
    line-height: 1.3;
  }

  &__time {
    font-size: 0.75rem;
    opacity: 0.5;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__time-sep {
    opacity: 0.4;
    margin: 0 2px;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    color: #fff;
  }
}

.ss-pill {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2000;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(18, 18, 28, 0.92);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }
}

// Transitions
.ss-slide-enter-active,
.ss-slide-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.ss-slide-enter-from,
.ss-slide-leave-to {
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
}

.ss-fade-enter-active,
.ss-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.ss-fade-enter-from,
.ss-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
