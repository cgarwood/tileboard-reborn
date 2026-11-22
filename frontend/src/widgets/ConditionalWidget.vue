<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('conditional', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import WidgetRenderer from '../components/WidgetRenderer.vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useWidgetGrid, widgetSize, WIDGET_GRID_GAP } from '../composables/useWidgetGrid';
import { resolveConditional } from '../utils/conditionalWidget';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();

const haStore = useHomeAssistantStore();

const active = computed(() => resolveConditional(props.widget, haStore.states));
const { items } = useWidgetGrid(() => active.value.widgets);

// Tracks are sized from the slot, not the section's grid_size, so inner cells match outer cells
// exactly (the slot spans n cells plus n-1 gaps). Content past the slot gets implicit tracks of
// the same size and is clipped.
const gridStyle = computed<CSSProperties>(() => {
  const { width, height } = widgetSize(props.widget, haStore.states);
  const track = (n: number) => `calc((100% - ${(n - 1) * WIDGET_GRID_GAP}px) / ${n})`;
  return {
    gridTemplateColumns: `repeat(${width}, ${track(width)})`,
    gridTemplateRows: `repeat(${height}, ${track(height)})`,
    gridAutoColumns: track(width),
    gridAutoRows: track(height),
    gap: `${WIDGET_GRID_GAP}px`,
  };
});
</script>

<template>
  <div class="widget-conditional" :style="gridStyle">
    <div v-for="item in items" :key="`${active.key}-${item.index}`" :style="item.style">
      <WidgetRenderer :widget="item.widget" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.widget-conditional {
  display: grid;
  height: 100%;
  overflow: hidden;
}
</style>
