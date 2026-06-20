<template>
  <BaseWidget
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-sm" :class="{ 'widget-body--micro': isMicro }">
      <div class="state-area">
        <q-icon :name="iconName" :size="isMicro ? '28px' : '40px'" color="white" />
      </div>
      <div class="label-group">
        <div v-if="subtitle && !isMicro" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('button', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useRouter } from 'vue-router';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useScreensaverStore } from '../stores/screensaver';
import type { Widget } from '../types/widgets';

interface ServiceAction {
  action: 'service';
  service: string;
  data?: Record<string, unknown>;
}
interface JavascriptAction {
  action: 'javascript';
  data: string;
}
interface EventAction {
  action: 'event';
  event: string;
  data?: Record<string, unknown>;
}
interface NavigateAction {
  action: 'navigate';
  url?: string;
  page?: string;
}
interface ScreensaverAction {
  action: 'screensaver';
}
type TapAction = ServiceAction | JavascriptAction | EventAction | NavigateAction | ScreensaverAction;

const props = defineProps<{ widget: Widget }>();
const haStore = useHomeAssistantStore();
const screensaverStore = useScreensaverStore();
const router = useRouter();
const { title, subtitle, icon, backgroundStyle } = useWidget(() => props.widget);
const { withUnlock } = useRestriction(() => props.widget);

const isMicro = computed(() => {
  const w = props.widget.grid?.width ?? 2;
  const h = props.widget.grid?.height ?? 2;
  return w <= 1 && h <= 1;
});

const iconName = computed(() => icon.value ?? 'mdi-gesture-tap');

function execute() {
  if (props.widget.entity) {
    void haStore.callService('button', 'press', { entity_id: props.widget.entity });
    return;
  }

  const actions = props.widget.tap_action as TapAction[] | undefined;
  if (!actions?.length) return;

  for (const action of actions) {
    if (action.action === 'service') {
      const dot = action.service.indexOf('.');
      if (dot === -1) return;
      void haStore.callService(
        action.service.slice(0, dot),
        action.service.slice(dot + 1),
        action.data,
      );
    } else if (action.action === 'javascript') {
      console.log('[ButtonWidget] Executing JavaScript action:', action.data);
      try {
        new Function(action.data)(); //eslint-disable-line @typescript-eslint/no-implied-eval
      } catch (e) {
        console.error('[ButtonWidget] JavaScript action error:', e);
      }
    } else if (action.action === 'event') {
      void haStore.fireEvent(action.event, action.data);
    } else if (action.action === 'navigate') {
      if (action.page) {
        void router.push({ name: 'dashboard-page', params: { pageId: action.page } });
      } else if (action.url) {
        window.location.href = action.url;
      }
    } else if (action.action === 'screensaver') {
      screensaverStore.active = true;
    } else {
      console.warn('[ButtonWidget] Unknown action type:', action);
    }
  }
}

function handleClick() {
  withUnlock(execute);
}
</script>

<style lang="scss">
.widget-button {
  background: var(--button-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';
</style>
