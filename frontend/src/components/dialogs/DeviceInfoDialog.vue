<template>
  <q-dialog v-model="dialogOpen" @hide="emit('hide')">
    <q-card class="device-info-dialog">
      <div class="device-info-dialog__header">
        <div class="device-info-dialog__header-text">
          <div class="device-info-dialog__title">Device Info</div>
          <div class="device-info-dialog__subtitle">{{ deviceSection.title }}</div>
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

      <div class="device-info-dialog__content">
        <section v-for="section in sections" :key="section.title" class="device-info-section">
          <div class="device-info-section__title">
            <q-icon :name="section.icon" size="18px" />
            {{ section.title }}
          </div>
          <dl class="device-info-section__rows">
            <template v-for="row in section.rows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd :class="{ 'device-info-section__value--error': row.error }">
                <span
                  v-if="row.status"
                  class="status-dot"
                  :class="`status-dot--${row.status}`"
                />
                {{ row.value }}
              </dd>
            </template>
          </dl>
        </section>
      </div>

      <q-separator dark />
      <div class="device-info-dialog__actions">
        <q-btn
          flat
          no-caps
          color="white"
          icon="mdi-reload"
          label="Reload Page"
          :loading="reloading"
          @click="reload"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useConfigStore } from '../../stores/config';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { useSendspinStore } from '../../stores/sendspin';
import { getTileboardId } from '../../utils/tileboardId';
import { forceReload } from '../../utils/forceReload';
import type { SendSpinConfig } from '../../types/config';

const emit = defineEmits<{ hide: [] }>();

const configStore = useConfigStore();
const haStore = useHomeAssistantStore();
const sendspinStore = useSendspinStore();

const dialogOpen = ref(true);
const reloading = ref(false);

type Status = 'on' | 'off' | 'pending';
interface Row {
  label: string;
  value: string;
  status?: Status;
  error?: boolean;
}
interface Section {
  title: string;
  icon: string;
  rows: Row[];
}

type FullyGetter =
  | 'getDeviceId'
  | 'getIp4Address'
  | 'getMacAddress'
  | 'getFullyVersion'
  | 'getWebviewVersion'
  | 'getDeviceModel'
  | 'getDeviceName';

/** Older Fully versions lack some getters, and some need permissions; treat failures as unknown. */
function readFully(getter: FullyGetter): string | null {
  const fully = window.fully;
  const fn = fully?.[getter];
  if (!fully || typeof fn !== 'function') return null;
  try {
    const value = fn.call(fully);
    return value ? String(value) : null;
  } catch {
    return null;
  }
}

function rows(entries: [string, string | null | undefined][]): Row[] {
  return entries.flatMap(([label, value]) => (value ? [{ label, value }] : []));
}

// Device details don't change while the dialog is open, so they're read once.
const isFully = !!window.fully;
const screenSize = `${window.innerWidth} × ${window.innerHeight} @ ${window.devicePixelRatio}x`;
const deviceSection: Section = isFully
  ? {
      title: 'Fully Kiosk',
      icon: 'mdi-tablet',
      rows: rows([
        ['Device name', readFully('getDeviceName')],
        ['Model', readFully('getDeviceModel')],
        ['IP address', readFully('getIp4Address')],
        ['MAC address', readFully('getMacAddress')],
        ['Device ID', readFully('getDeviceId')],
        ['Fully version', readFully('getFullyVersion')],
        ['WebView version', readFully('getWebviewVersion')],
      ]),
    }
  : {
      title: 'Browser',
      icon: 'mdi-web',
      rows: rows([
        ['TileBoard ID', getTileboardId()],
        ['Screen', screenSize],
      ]),
    };

const haSection = computed<Section>(() => ({
  title: 'Home Assistant',
  icon: 'mdi-home-assistant',
  rows: [
    {
      label: 'Status',
      value: haStore.connected ? 'Connected' : 'Disconnected',
      status: haStore.connected ? 'on' : 'off',
    },
    ...(haStore.error ? [{ label: 'Error', value: haStore.error, error: true }] : []),
    ...rows([
      ['URL', haStore.hassUrl],
      ['Version', haStore.haVersion],
      [
        'Entities',
        haStore.entitiesLoaded ? String(Object.keys(haStore.states).length) : 'Loading…',
      ],
    ]),
  ],
}));

const sendspinSection = computed<Section | null>(() => {
  const config = configStore.config?.sendspin as SendSpinConfig | undefined;
  if (!config) return null;
  const status: Status = sendspinStore.connected
    ? 'on'
    : sendspinStore.connecting
      ? 'pending'
      : 'off';
  return {
    title: 'Sendspin',
    icon: 'mdi-speaker-wireless',
    rows: [
      {
        label: 'Status',
        value: { on: 'Connected', pending: 'Connecting…', off: 'Disconnected' }[status],
        status,
      },
      ...rows([
        ['Server', config.server],
        ['Player name', config.name],
        ['Player ID', getTileboardId()],
      ]),
    ],
  };
});

const dashboardSection = computed<Section>(() => ({
  title: 'Dashboard',
  icon: 'mdi-view-dashboard-outline',
  rows: rows([
    ['Name', configStore.config?.name as string | undefined],
    ['Config', configStore.configUrl],
  ]),
}));

const sections = computed(() =>
  [deviceSection, haSection.value, sendspinSection.value, dashboardSection.value].filter(
    (s): s is Section => !!s && s.rows.length > 0,
  ),
);

function reload() {
  reloading.value = true;
  void forceReload();
}
</script>

<style lang="scss" scoped>
// Matches MoreInfoDialog.
.device-info-dialog {
  width: min(480px, 95vw);
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
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px;
  }
}

.device-info-section {
  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
  }

  &__rows {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 16px;
    row-gap: 6px;
    margin: 0;
    font-size: 0.9rem;

    dt {
      color: rgba(255, 255, 255, 0.55);
    }

    dd {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow-wrap: anywhere;
      user-select: text;
    }
  }

  &__value--error {
    color: #ef9a9a;
  }
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &--on {
    background: #4caf50;
    box-shadow: 0 0 4px #4caf50;
  }

  &--off {
    background: #f44336;
  }

  &--pending {
    background: #ff9800;
  }
}
</style>
