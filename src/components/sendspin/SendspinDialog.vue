<template>
  <q-dialog v-model="open" :maximized="false">
    <q-card class="ss-dialog">
      <q-btn
        flat round dense
        icon="mdi-close"
        class="ss-dialog__close"
        v-close-popup
      />

      <!-- Album art -->
      <div class="ss-dialog__art-wrap">
        <img
          v-if="store.metadata?.artwork_url"
          :src="store.metadata.artwork_url"
          class="ss-dialog__art"
        />
        <div v-else class="ss-dialog__art-placeholder">
          <q-icon name="mdi-music" size="64px" color="grey-5" />
        </div>
      </div>

      <!-- Track info -->
      <div class="ss-dialog__info">
        <div class="ss-dialog__title ellipsis">{{ store.metadata?.title ?? 'No media playing' }}</div>
        <div class="ss-dialog__artist ellipsis">{{ store.metadata?.artist ?? '' }}</div>
        <div v-if="store.metadata?.album" class="ss-dialog__album ellipsis">{{ store.metadata.album }}</div>
      </div>

      <!-- Progress -->
      <div class="ss-dialog__progress-wrap">
        <span class="ss-dialog__time">{{ formatMs(store.trackPositionMs) }}</span>
        <div class="ss-dialog__progress">
          <div class="ss-dialog__progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
        <span class="ss-dialog__time">{{ formatMs(store.trackDurationMs) }}</span>
      </div>

      <!-- Playback controls -->
      <div class="ss-dialog__controls">
        <q-btn
          flat round
          :icon="store.shuffle ? 'mdi-shuffle' : 'mdi-shuffle'"
          :color="store.shuffle ? 'primary' : 'grey-6'"
          @click="store.toggleShuffle()"
        />
        <q-btn flat round icon="mdi-skip-previous" size="lg" @click="store.previous()" />
        <q-btn
          flat round
          :icon="store.isPlaying ? 'mdi-pause-circle' : 'mdi-play-circle'"
          size="xl"
          color="primary"
          @click="store.togglePlayPause()"
        />
        <q-btn flat round icon="mdi-skip-next" size="lg" @click="store.next()" />
        <q-btn
          flat round
          :icon="repeatIcon"
          :color="store.repeat !== 'off' ? 'primary' : 'grey-6'"
          @click="store.cycleRepeat()"
        />
      </div>

      <!-- Volume -->
      <div class="ss-dialog__volume">
        <q-btn
          flat round dense
          :icon="store.muted ? 'mdi-volume-off' : 'mdi-volume-high'"
          @click="store.toggleMute()"
        />
        <q-slider
          :model-value="store.muted ? 0 : store.volume"
          :min="0"
          :max="100"
          color="primary"
          class="ss-dialog__volume-slider"
          @change="(v: number) => store.setVolume(v)"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSendspinStore } from '../../stores/sendspin';

const open = defineModel<boolean>({ required: true });
const store = useSendspinStore();

const progressPercent = computed(() => {
  if (!store.trackDurationMs) return 0;
  return Math.min(100, (store.trackPositionMs / store.trackDurationMs) * 100);
});

const repeatIcon = computed(() => {
  if (store.repeat === 'one') return 'mdi-repeat-once';
  return 'mdi-repeat';
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
.ss-dialog {
  width: 360px;
  max-width: 95vw;
  padding: 24px 24px 28px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  &__close {
    position: absolute;
    top: 12px;
    right: 12px;
  }

  &__art-wrap {
    width: 200px;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    background: #1a1a2e;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  &__art {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__art-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  &__info {
    text-align: center;
    width: 100%;
  }

  &__title {
    font-size: 1.2rem;
    font-weight: 600;
    line-height: 1.3;
  }

  &__artist {
    font-size: 1rem;
    opacity: 0.7;
    margin-top: 2px;
  }

  &__album {
    font-size: 0.85rem;
    opacity: 0.5;
    margin-top: 2px;
  }

  &__progress-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  &__progress {
    flex: 1;
    height: 4px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--q-primary);
    border-radius: 2px;
    transition: width 0.5s linear;
  }

  &__time {
    font-size: 0.75rem;
    opacity: 0.55;
    min-width: 2.8em;
    text-align: center;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__volume {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  &__volume-slider {
    flex: 1;
  }
}
</style>
