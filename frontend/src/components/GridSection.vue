<template>
  <div v-if="visible" class="grid-section" :style="section.style">
    <div v-if="section.name" class="section-header" :style="section.name_style">
      {{ section.name }}
    </div>
    <div :style="columnStyle">
      <div v-for="item in items" :key="item.index" :style="item.style">
        <WidgetRenderer :widget="item.widget" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import WidgetRenderer from './WidgetRenderer.vue';
import { useVisibility } from '../composables/useVisibility';
import { useWidgetGrid, WIDGET_GRID_GAP } from '../composables/useWidgetGrid';
import type { Section } from '../types/sections';

const props = defineProps<{ section: Section; gridSize?: number }>();

const { visible } = useVisibility(() => props.section.visibility);
const { items } = useWidgetGrid(() => props.section.widgets);

const gridSize = computed(() => props.gridSize ?? 64);

const columnStyle = computed<CSSProperties>(() => {
  const cols = props.section.width ?? 4;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${gridSize.value}px)`,
    gridAutoRows: `${gridSize.value}px`,
    gap: `${WIDGET_GRID_GAP}px`,
  };
});
</script>
<style lang="scss" scoped>
.grid-section {
  padding: var(--section-padding);
}
</style>
