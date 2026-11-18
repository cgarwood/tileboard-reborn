<template>
  <q-page
    padding
    class="page-wrapper"
    style="background: transparent"
    :style-fn="pageStyleFn"
  >
    <!-- Remount all widgets on page change or config reload, so widgets never see their config change -->
    <div
      v-if="page"
      :key="`${configStore.version}:${page.id}`"
      class="page-content"
      :class="[`page-content--${orientation}`, `page-content--nav-${navPosition}`]"
    >
      <div v-for="(row, rowIndex) in sectionRows" :key="rowIndex" class="section-row">
        <GridSection
          v-for="(section, i) in row"
          :key="i"
          :section="section"
          :grid-size="page.grid_size ?? topLevelGridSize"
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
import { useLayout } from '../composables/useLayout';
import type { Config } from '../types/config';
import type { Section } from '../types/sections';

const route = useRoute();
const configStore = useConfigStore();
const { orientation, navPosition } = useLayout();

const config = computed(() => configStore.config as Config | null);
const pages = computed(() => config.value?.pages ?? []);
const topLevelGridSize = computed(() => config.value?.grid_size);

// With the nav at the bottom the page scrolls inside its own fixed-height box instead of the
// window, so the content can fade out above the nav bar (a mask is relative to its element, and
// the window-scrolled page would carry the fade along with it). Quasar's default sets min-height.
function pageStyleFn(offset: number, height: number) {
  const size = height ? `${height - offset}px` : `calc(100vh - ${offset}px)`;
  return navPosition.value === 'bottom' ? { height: size } : { minHeight: size };
}

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
  overflow-x: auto;
  padding: 0 16px 16px 62px;

  // The bottom nav sits in the layout footer, which reserves its own space. Content scrolls here
  // (see pageStyleFn) and fades out over the last $fade px; the extra bottom padding lets the
  // last row scroll clear of the fade.
  &--nav-bottom {
    $fade: 40px;
    height: 100%;
    overflow: auto;
    padding-left: 16px;
    padding-bottom: $fade;
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - #{$fade}), transparent);
    mask-image: linear-gradient(to bottom, #000 calc(100% - #{$fade}), transparent);
  }
}

.section-row {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: flex-start;
  width: max-content;

  & + & {
    margin-top: 16px;
  }
}

// Portrait: sections wrap onto new lines and the page scrolls vertically. A section wider than
// the screen still falls back to horizontal scrolling.
.page-content--portrait .section-row {
  flex-wrap: wrap;
  row-gap: 16px;
  width: auto;

  > * {
    flex-shrink: 0;
  }
}
</style>
