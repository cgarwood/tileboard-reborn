<template>
  <q-card
    flat
    bordered
    :class="_class"
    :style="[{ height: '100%', overflow: 'hidden', '--widget-title-color': titleColor ?? undefined, '--widget-subtitle-color': subtitleColor ?? undefined }, ...cardStyle]"
  >
    <slot />
    <q-icon name="mdi-lock" size="14px" v-if="isLocked" class="widget-lock-badge" />
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Widget } from '../types/widgets';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { slugifyState } from '../utils/slugifyState';

const props = defineProps<{ widget: Widget }>();

const { cardClass, cardStyle, state, titleColor, subtitleColor } = useWidget(() => props.widget);
const { isLocked } = useRestriction(() => props.widget);

const _class = computed(() => [
  cardClass.value,
  'widget-base',
  'widget',
  `widget-${props.widget.type}`,
  state.value != null ? `state--${slugifyState(state.value)}` : null,
]);
</script>

<style lang="scss">
.widget-base {
  position: relative;
}

.widget-lock-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
  color: #fff;
  display: flex;
  align-items: center;
  pointer-events: none;
}
</style>
