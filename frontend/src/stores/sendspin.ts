import { defineStore, acceptHMRUpdate } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import type { SendspinPlayer, ControllerCommand, ServerStateMetadata } from '@sendspin/sendspin-js';
import type { SendSpinConfig } from '../types/config';
import { getTileboardId } from '../utils/tileboardId';

export const useSendspinStore = defineStore('sendspin', () => {
  const player = shallowRef<SendspinPlayer | null>(null);
  const connected = ref(false);
  const connecting = ref(false);
  const isPlaying = ref(false);
  const volume = ref(100);
  const muted = ref(false);
  const metadata = ref<ServerStateMetadata | null>(null);
  const repeat = ref<'off' | 'one' | 'all'>('off');
  const shuffle = ref(false);
  const supportedCommands = ref<string[]>([]);
  const trackPositionMs = ref(0);
  const trackDurationMs = ref(0);

  // Music Assistant streams announcements (TTS, chimes) without track metadata, so playback with
  // no title is treated as an announcement.
  const isAnnouncement = computed(() => isPlaying.value && !metadata.value?.title);

  // Text of the announcement playing now, if Home Assistant sent it beforehand with a
  // `sendspin_announcement` tileboard event. Messages are queued in arrival order and dropped if
  // no announcement starts in time (i.e. this tablet wasn't one of the targets).
  const announcementText = ref<string | null>(null);
  const ANNOUNCEMENT_MAX_WAIT_MS = 60_000;
  let pendingAnnouncements: { message: string; at: number }[] = [];

  function nextPendingAnnouncement(): string | null {
    const cutoff = Date.now() - ANNOUNCEMENT_MAX_WAIT_MS;
    pendingAnnouncements = pendingAnnouncements.filter((a) => a.at >= cutoff);
    return pendingAnnouncements.shift()?.message ?? null;
  }

  function queueAnnouncement(message: string) {
    pendingAnnouncements.push({ message, at: Date.now() });
    // The event normally arrives before playback starts, but handle it arriving just after too.
    if (isAnnouncement.value && announcementText.value == null) {
      announcementText.value = nextPendingAnnouncement();
    }
  }

  watch(isAnnouncement, (active) => {
    announcementText.value = active ? nextPendingAnnouncement() : null;
  });

  let progressTimer: ReturnType<typeof setInterval> | null = null;

  function updateProgress() {
    const tp = player.value?.trackProgress;
    if (tp) {
      trackPositionMs.value = Math.max(0, tp.positionMs);
      trackDurationMs.value = tp.durationMs;
    }
  }

  function startProgressTimer() {
    if (progressTimer) return;
    progressTimer = setInterval(updateProgress, 500);
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  let initializing = false;

  async function initialize(config: SendSpinConfig) {
    if (player.value || initializing) return;
    initializing = true;
    connecting.value = true;

    // Loaded on demand: most dashboards don't configure Sendspin, and the library (plus its Opus
    // decoder) would otherwise be in the startup bundle.
    let SendspinPlayerClass: typeof SendspinPlayer;
    try {
      ({ SendspinPlayer: SendspinPlayerClass } = await import('@sendspin/sendspin-js'));
    } catch (e) {
      connecting.value = false;
      console.error('[Sendspin] Failed to load player', e);
      return;
    } finally {
      initializing = false;
    }

    const p = new SendspinPlayerClass({
      baseUrl: config.server,
      playerId: getTileboardId(),
      clientName: config.name,
      onStateChange: (state) => {
        connected.value = true;
        connecting.value = false;
        isPlaying.value = state.isPlaying;
        volume.value = state.volume;
        muted.value = state.muted;

        const meta = state.serverState.metadata;
        if (meta !== undefined) metadata.value = meta ?? null;

        const ctrl = state.serverState.controller;
        if (ctrl?.supported_commands) supportedCommands.value = ctrl.supported_commands;

        if (meta?.repeat != null) repeat.value = meta.repeat ?? 'off';
        if (meta?.shuffle != null) shuffle.value = meta.shuffle ?? false;

        if (state.isPlaying) {
          startProgressTimer();
          updateProgress();
        } else {
          stopProgressTimer();
        }
      },
      reconnect: {
        onReconnecting: () => {
          connected.value = false;
          connecting.value = true;
        },
        onReconnected: () => {
          connected.value = true;
          connecting.value = false;
        },
      },
    });

    player.value = p;

    void p
      .connect()
      .then(() => {
        connected.value = true;
        connecting.value = false;
      })
      .catch((e: unknown) => {
        connecting.value = false;
        console.error('[Sendspin] Connection failed', e);
      });
  }

  // ControllerCommands uses `void` for parameterless commands; runtime ignores extra args
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function cmd(command: ControllerCommand, params?: any): void {
    player.value?.sendCommand(command, params);
  }

  function play() {
    cmd('play');
  }
  function pause() {
    cmd('pause');
  }
  function next() {
    cmd('next');
  }
  function previous() {
    cmd('previous');
  }
  function togglePlayPause() {
    if (isPlaying.value) pause();
    else play();
  }
  function setVolume(v: number) {
    cmd('volume', { volume: v });
  }
  function toggleMute() {
    cmd('mute', { mute: !muted.value });
  }
  function toggleShuffle() {
    cmd(shuffle.value ? 'unshuffle' : 'shuffle');
  }

  function cycleRepeat() {
    if (repeat.value === 'off') cmd('repeat_all');
    else if (repeat.value === 'all') cmd('repeat_one');
    else cmd('repeat_off');
  }

  return {
    connected,
    connecting,
    isPlaying,
    volume,
    muted,
    metadata,
    repeat,
    shuffle,
    supportedCommands,
    trackPositionMs,
    trackDurationMs,
    isAnnouncement,
    announcementText,
    queueAnnouncement,
    initialize,
    play,
    pause,
    next,
    previous,
    togglePlayPause,
    setVolume,
    toggleMute,
    cycleRepeat,
    toggleShuffle,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSendspinStore, import.meta.hot));
}
