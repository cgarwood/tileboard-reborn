<template>
  <q-page padding class="page-wrapper" style="background: transparent">
    <div v-if="page" style="overflow-x: auto" class="page-content">
      <div
        v-for="(row, rowIndex) in sectionRows"
        :key="rowIndex"
        style="
          display: flex;
          flex-direction: row;
          gap: 8px;
          align-items: flex-start;
          width: max-content;
        "
        :style="rowIndex > 0 ? { marginTop: '16px' } : {}"
      >
        <GridSection
          v-for="(section, i) in row"
          :key="i"
          :section="section"
          :grid-size="page.grid_size"
        />
      </div>
    </div>
    <q-banner v-else class="text-grey-7">
      Page "{{ pageId }}" not found in configuration.
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigStore } from '../stores/config';
import GridSection from '../components/GridSection.vue';
import type { Page } from '../types/page';
import type { Section } from '../types/sections';

interface DashboardConfig {
  pages: Page[];
  [key: string]: unknown;
}

const route = useRoute();
const configStore = useConfigStore();

const pages = computed(() => (configStore.config as DashboardConfig | null)?.pages ?? []);

const pageId = computed(() => route.params.pageId as string | undefined);

const page = computed(() => {
  if (!pages.value.length) return null;
  if (!pageId.value) return pages.value[0] ?? null;
  return pages.value.find((p) => p.id === pageId.value) ?? null;
});

const sectionRows = computed(() => {
  const rows: Section[][] = [[]];
  for (const item of page.value?.sections ?? []) {
    if (item === 'break') {
      rows.push([]);
    } else {
      rows[rows.length - 1]!.push(item);
    }
  }
  return rows;
});
</script>
<style lang="scss" scoped>
.q-page {
  padding: 0;
}
.page-content {
  padding: 16px 16px 16px 62px;
}
</style>
