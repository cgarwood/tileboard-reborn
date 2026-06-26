<template>
  <BaseWidget :widget="widget" :style="backgroundStyle">
    <q-card-section class="widget-body q-pa-none list-widget">
      <div class="list-widget__scroll-wrap">
        <q-scroll-area class="list-widget__scroll">
          <q-list dense class="list-widget__list">
            <ListItem v-for="(item, idx) in items" :key="idx" :item="item" />
          </q-list>
        </q-scroll-area>

      </div>

      <div class="label-group">
        <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
        <div class="title ellipsis">{{ title }}</div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('list', { width: 4, height: 4 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import ListItem from '../components/list/ListItem.vue';
import { useWidget } from '../composables/useWidget';
import type { Widget } from '../types/widgets';
import type { ListItemConfig } from '../types/list-widget';

const props = defineProps<{ widget: Widget }>();

const { title, subtitle, backgroundStyle } = useWidget(() => props.widget);

const items = computed<ListItemConfig[]>(
  () => (props.widget.items as ListItemConfig[] | undefined) ?? [],
);
</script>

<style lang="scss">
.widget-list {
  background: var(--list-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.list-widget {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__scroll-wrap {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  &__scroll {
    height: 100%;
    mask-image: linear-gradient(to bottom, black 70%, transparent 100%);

    :deep(.q-scrollarea__bar--h) {
      display: none;
    }

    :deep(.q-scrollarea__content) {
      max-width: 100%;
    }
  }

  &__list {
    padding: 4px 0 20px;
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
