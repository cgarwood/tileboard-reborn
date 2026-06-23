<template>
  <div class="grid-section" :style="section.style">
    <div v-if="section.name" class="section-header" :style="section.name_style">
      {{ section.name }}
    </div>
    <div :style="columnStyle">
      <div v-for="(child, i) in section.widgets" :key="i" :style="itemStyle(child)">
        <WidgetRenderer :widget="child" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import WidgetRenderer from './WidgetRenderer.vue';
import type { Section } from '../types/sections';
import type { Widget } from '../types/widgets';
import { getWidgetDefaults } from '../utils/widgetRegistry';

const GAP = 8; // px

const props = defineProps<{ section: Section; gridSize?: number }>();

const gridSize = computed(() => props.gridSize ?? 64);

const columnStyle = computed<CSSProperties>(() => {
  const cols = props.section.width ?? 4;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${gridSize.value}px)`,
    gridAutoRows: `${gridSize.value}px`,
    gap: `${GAP}px`,
  };
});

function itemStyle(child: Widget): CSSProperties {
  const defaults = getWidgetDefaults(child.type);
  const w = child.grid?.width ?? defaults.width ?? 2;
  const h = child.grid?.height ?? defaults.height ?? 2;
  return {
    gridColumn: `span ${w}`,
    gridRow: `span ${h}`,
  };
}
</script>
<style lang="scss" scoped>
.grid-section {
  padding: var(--section-padding);
}
</style>
