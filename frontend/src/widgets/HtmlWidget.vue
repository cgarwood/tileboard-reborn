<template>
  <BaseWidget :widget="widget" :class="scopeClass" :style="backgroundStyle">
    <!-- Markup comes from the dashboard config; interpolated {{ }} values are escaped -->
    <div class="widget-html__content" v-html="html" />
    <div v-if="showTitle || subtitle" class="label-group">
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
      <div v-if="showTitle" class="title ellipsis">{{ title }}</div>
    </div>
  </BaseWidget>
</template>

<script lang="ts">
import { registerWidgetDefaults } from '../utils/widgetRegistry';
registerWidgetDefaults('html', { width: 2, height: 2 });
</script>

<script setup lang="ts">
import { computed } from 'vue';
import BaseWidget from '../components/BaseWidget.vue';
import { useWidget } from '../composables/useWidget';
import { useScopedCss } from '../composables/useScopedCss';
import { escapeHtml } from '../utils/escapeHtml';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import type { Widget } from '../types/widgets';

const props = defineProps<{ widget: Widget }>();
const { title, subtitle, backgroundStyle, resolveCtx } = useWidget(() => props.widget);

// Only when configured: `title` otherwise falls back to the entity's name, and an HTML widget
// usually draws its own labels.
const showTitle = computed(() => props.widget.title != null && title.value !== '');
const { scopeClass } = useScopedCss(() => props.widget.css as string | undefined);

const html = computed(() => {
  const raw = props.widget.html;
  // A state map picks the markup first; the chosen markup may itself contain templates
  const markup =
    typeof raw === 'object' && raw !== null ? resolveWidgetProp(raw, resolveCtx.value) : raw;
  return resolveWidgetProp(markup, resolveCtx.value, escapeHtml) ?? '';
});
</script>

<style lang="scss">
.widget-html {
  background: var(--html-widget-background);
  color: var(--text-light);
}

// Undo Quasar's page-sized heading typography. Specificity (0,1,0) beats Quasar's `h1` but loses
// to the widget's own `css`, whose selectors are all prefixed with a class.
.widget-html__content :where(h1, h2, h3, h4, h5, h6, p) {
  margin: 0;
  font-size: 1em;
  line-height: 1.25;
  letter-spacing: normal;
}

.widget-html__content :where(h1, h2, h3, h4, h5, h6) {
  font-weight: 500;
}

.widget-html__content :where(h1) {
  font-size: 1.6em;
}

.widget-html__content :where(h2) {
  font-size: 1.35em;
}

.widget-html__content :where(h3) {
  font-size: 1.15em;
}
</style>

<style lang="scss" scoped>
.widget-html__content {
  height: 100%;
}
</style>
