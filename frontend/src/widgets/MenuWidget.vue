<template>
  <BaseWidget
    v-bind="$attrs"
    :widget="widget"
    :style="[backgroundStyle, { cursor: 'pointer' }]"
    @click="handleClick"
  >
    <q-card-section class="widget-body q-pa-none menu-widget">
      <div class="menu-widget__day">{{ dayLabel }}</div>
      <div class="menu-widget__body">
        <MenuDayView v-if="menu" :menu="menu" />
        <div v-else class="menu-widget__empty">No menu {{ day }}</div>
        <div class="menu-widget__fade" />
      </div>
      <div class="label-group">
        <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
  <MenuDayDialog
    v-if="dialogOpen"
    :title="title"
    :day="day"
    :date="date"
    :menu="menu"
    @hide="dialogOpen = false"
  />
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('menu', { width: 4, height: 4 });
export default { inheritAttrs: false };
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import MenuDayView from '../components/menu/MenuDayView.vue';
import MenuDayDialog from '../components/menu/MenuDayDialog.vue';
import { useWidget } from '../composables/useWidget';
import { useMenu } from '../composables/useMenu';
import { useRestriction } from '../composables/useRestriction';
import { useActionExecutor } from '../composables/useActionExecutor';
import type { Widget } from '../types/widgets';
import type { MenuConfig } from '../types/menu';
import { shortDateFormat } from '../utils/formatters';

const props = defineProps<{ widget: Widget }>();

const { title, subtitle, backgroundStyle } = useWidget(() => props.widget);
const { day, date, menu } = useMenu(() => props.widget as Widget & MenuConfig);
const { withUnlock } = useRestriction(() => props.widget);
const { executeActions } = useActionExecutor();

const dayLabel = computed(
  () => `${day.value === 'today' ? 'Today' : 'Tomorrow'} · ${shortDateFormat.format(date.value)}`,
);

const dialogOpen = ref(false);

function handleClick() {
  withUnlock(() => {
    if (props.widget.tap_action !== undefined) {
      executeActions(props.widget.tap_action);
    } else {
      dialogOpen.value = true;
    }
  });
}
</script>

<style lang="scss">
.widget-menu {
  background: var(--menu-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
.menu-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 0.85rem;

  &__day {
    padding: 8px 10px 4px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.7;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
    padding: 2px 10px;
  }

  &__empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
  }

  &__fade {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: linear-gradient(to bottom, transparent, var(--menu-widget-background));
    pointer-events: none;
  }

  :deep(.label-group) {
    position: relative;
    bottom: auto;
    left: auto;
    padding: 4px 6px 6px;
    flex-shrink: 0;
  }
}
</style>
