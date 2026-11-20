<template>
  <template v-if="sliders.length">
    <q-separator dark />
    <q-item-label header class="fkv__header">Volume</q-item-label>
    <q-item v-for="s in sliders" :key="s.stream" dense class="fkv__item">
      <q-item-section avatar>
        <q-btn
          flat
          round
          dense
          :icon="s.level === 0 ? s.mutedIcon : s.icon"
          :aria-label="`Mute ${s.label}`"
          @click="toggleMute(s)"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label caption>{{ s.label }}</q-item-label>
        <q-slider
          :model-value="s.level"
          :min="0"
          :max="100"
          :step="1"
          dense
          dark
          label
          :label-value="`${s.level}%`"
          @update:model-value="(v) => setLevel(s, v ?? 0)"
          @change="() => refresh(s)"
        />
      </q-item-section>
    </q-item>
  </template>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { VolumeStream } from '../types/config';

const props = defineProps<{ streams: VolumeStream[] }>();

// Android AudioManager stream numbers.
const STREAMS: Record<
  VolumeStream,
  { id: number; label: string; icon: string; mutedIcon: string }
> = {
  media: { id: 3, label: 'Media', icon: 'mdi-music', mutedIcon: 'mdi-music-off' },
  notification: { id: 5, label: 'Notifications', icon: 'mdi-bell', mutedIcon: 'mdi-bell-off' },
  alarm: { id: 4, label: 'Alarm', icon: 'mdi-alarm', mutedIcon: 'mdi-alarm-off' },
  system: {
    id: 1,
    label: 'System',
    icon: 'mdi-volume-high',
    mutedIcon: 'mdi-volume-off',
  },
  ring: { id: 2, label: 'Ringer', icon: 'mdi-phone-ring', mutedIcon: 'mdi-phone-off' },
};

type Slider = {
  stream: VolumeStream;
  id: number;
  label: string;
  icon: string;
  mutedIcon: string;
  level: number;
  /** Level to go back to when unmuting */
  restore: number;
};

const fully = window.fully;

// The menu's content is created each time it opens, so levels are read fresh then. Changes made
// elsewhere (hardware buttons, Home Assistant) show up the next time the menu opens.
const sliders = reactive<Slider[]>(
  fully
    ? props.streams
        .filter((s) => s in STREAMS)
        .map((s) => {
          const level = fully.getAudioVolume(STREAMS[s].id);
          return { stream: s, ...STREAMS[s], level, restore: level || 50 };
        })
    : [],
);

function setLevel(s: Slider, level: number) {
  s.level = level;
  fully?.setAudioVolume(level, s.id);
}

/**
 * Fully rounds a percentage *down* to the stream's volume steps (66% of 15 steps → step 9 = 60%),
 * and the step count isn't exposed. Settle on whichever step is nearest `target`: probe upward
 * for the next step, then keep the closer one. Shows the level it actually landed on.
 */
function snapToNearestStep(s: Slider, target: number) {
  if (!fully) return;
  fully.setAudioVolume(target, s.id);
  const below = fully.getAudioVolume(s.id);
  let above = below;
  for (let p = target + 1; p <= 100 && above <= below && below < target; p++) {
    fully.setAudioVolume(p, s.id);
    above = fully.getAudioVolume(s.id);
  }
  const level = above - target < target - below ? above : below;
  if (level !== above) fully.setAudioVolume(level, s.id);
  s.level = fully.getAudioVolume(s.id);
  if (s.level > 0) s.restore = s.level;
}

function refresh(s: Slider) {
  snapToNearestStep(s, s.level);
}

function toggleMute(s: Slider) {
  if (s.level > 0) {
    s.restore = s.level;
    setLevel(s, 0);
  } else {
    snapToNearestStep(s, s.restore);
  }
}
</script>

<style lang="scss" scoped>
.fkv__header {
  padding-bottom: 4px;
}

.fkv__item {
  min-width: 260px;

  &:last-child {
    padding-bottom: 8px;
  }
}
</style>
