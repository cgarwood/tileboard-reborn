import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, shallowRef } from 'vue';
import { SendspinPlayer } from '@sendspin/sendspin-js';
import type { ControllerCommand, ServerStateMetadata } from '@sendspin/sendspin-js';
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

  function initialize(config: SendSpinConfig) {
    if (player.value) return;

    connecting.value = true;

    const p = new SendspinPlayer({
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
