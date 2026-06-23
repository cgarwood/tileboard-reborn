<template>
  <BaseWidget :widget="widget">
    <q-card-section class="widget-body q-pa-none camera-widget-body" @click="handleClick">
      <img v-if="feedSrc" ref="feedImgRef" :src="feedSrc" class="camera-feed" alt="" />
      <div v-else class="camera-placeholder">
        <q-icon name="mdi-camera-off" size="36px" color="white" style="opacity: 0.4" />
      </div>
      <div class="label-group">
        <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>

  <CameraDialog
    v-if="dialogOpen"
    :stream-url="streamUrl"
    :title="title"
    @hide="dialogOpen = false"
  />
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('camera', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import CameraDialog from '../components/camera/CameraDialog.vue';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useConfigStore } from '../stores/config';
import type { Widget } from '../types/widgets';
import type { Config } from '../types/config';

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();
const configStore = useConfigStore();

const { title, subtitle } = useWidget(() => props.widget);
const { withUnlock } = useRestriction(() => props.widget);

const haUrl = computed(() => {
  const url = (configStore.config as Config | null)?.haUrl ?? '';
  return url.replace(/\/$/, '');
});

const entityId = computed(() => props.widget.entity ?? '');

const accessToken = computed(
  () =>
    (haStore.states[entityId.value]?.attributes.access_token as string | undefined) ?? '',
);

const streamMode = computed(
  () => (props.widget.stream_mode as 'snapshot' | 'stream' | undefined) ?? 'snapshot',
);

const snapshotInterval = computed(
  () => ((props.widget.snapshot_interval as number | undefined) ?? 5) * 1000,
);

const snapshotUrl = computed(() => {
  if (!entityId.value || !accessToken.value) return '';
  return `${haUrl.value}/api/camera_proxy/${entityId.value}?token=${accessToken.value}`;
});

const streamUrl = computed(() => {
  if (!entityId.value || !accessToken.value) return '';
  return `${haUrl.value}/api/camera_proxy_stream/${entityId.value}?token=${accessToken.value}`;
});

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const feedImgRef = ref<HTMLImageElement | null>(null);
const tick = ref(0);
let snapshotTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (streamMode.value === 'snapshot') {
    snapshotTimer = setInterval(() => { tick.value++; }, snapshotInterval.value);
  }
});

onBeforeUnmount(() => {
  if (feedImgRef.value) feedImgRef.value.src = BLANK;
});

onUnmounted(() => {
  if (snapshotTimer !== null) {
    clearInterval(snapshotTimer);
    snapshotTimer = null;
  }
});

const feedSrc = computed(() => {
  if (!entityId.value || !accessToken.value) return null;
  if (streamMode.value === 'stream') return streamUrl.value;
  return `${snapshotUrl.value}&t=${tick.value}`;
});

const dialogOpen = ref(false);

function handleClick() {
  if (!entityId.value || !streamUrl.value) return;
  withUnlock(() => {
    dialogOpen.value = true;
  });
}
</script>

<style lang="scss">
.widget-camera {
  background: var(--camera-widget-background);
  color: var(--text-light);

  .label-group {
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
  }
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.camera-widget-body {
  cursor: pointer;
}

.camera-feed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
