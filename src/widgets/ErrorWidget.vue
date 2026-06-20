<template>
  <BaseWidget :widget="widget" class="widget-error">
    <q-card-section class="widget-body q-pa-sm">
      <div class="state-area">
        <div class="column items-center q-gutter-xs">
          <q-icon name="warning" color="yellow-9" size="42px" />
          <span class="error-type">Invalid widget type<br />{{ widget.type }}</span>
        </div>
      </div>
    </q-card-section>
  </BaseWidget>
</template>

<script setup lang="ts">
import BaseWidget from '../components/BaseWidget.vue';
import type { Widget } from '../types/widgets';

defineProps<{ widget: Widget }>();
</script>

<style lang="scss">
.widget-error {
  background: var(--error-widget-background);
  color: var(--text-light);
}
</style>

<style lang="scss" scoped>
@use '../css/widget';

.error-type {
  font-size: 0.8rem;
  color: var(--text-dark);
  text-align: center;
  word-break: break-all;
}
</style>
