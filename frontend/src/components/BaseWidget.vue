<template>
  <q-card
    v-bind="$attrs"
    v-touch-hold.mouse="onHold"
    flat
    bordered
    :class="_class"
    :style="[
      {
        height: '100%',
        overflow: 'hidden',
        '--widget-title-color': titleColor ?? undefined,
        '--widget-subtitle-color': subtitleColor ?? undefined,
      },
      ...cardStyle,
    ]"
  >
    <slot />
    <q-icon name="mdi-lock" size="14px" v-if="isLocked" class="widget-lock-badge" />
  </q-card>
  <MoreInfoDialog
    v-if="moreInfoOpen"
    :widget="widget"
    :entity-id-override="moreInfoEntityId"
    @hide="moreInfoOpen = false"
  />
</template>

<script lang="ts">
export default { inheritAttrs: false };
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Widget } from '../types/widgets';
import { useWidget } from '../composables/useWidget';
import { useRestriction } from '../composables/useRestriction';
import { useActionExecutor } from '../composables/useActionExecutor';
import { slugifyState } from '../utils/slugifyState';
import MoreInfoDialog from './more-info/MoreInfoDialog.vue';

const props = defineProps<{ widget: Widget }>();

const { cardClass, cardStyle, state, titleColor, subtitleColor } = useWidget(() => props.widget);
const { isLocked, withUnlock } = useRestriction(() => props.widget);
const { executeActions } = useActionExecutor();

const _class = computed(() => [
  cardClass.value,
  'widget-base',
  'widget',
  `widget-${props.widget.type}`,
  state.value != null ? `state--${slugifyState(state.value)}` : null,
]);

const moreInfoOpen = ref(false);
const moreInfoEntityId = ref<string | undefined>(undefined);

function openMoreInfo(entityId?: string) {
  moreInfoEntityId.value = entityId;
  moreInfoOpen.value = true;
}

function onHold() {
  const holdAction = props.widget.hold_action;
  if (holdAction) {
    withUnlock(() => executeActions(holdAction, {}, openMoreInfo));
    return;
  }
  // Default: open more-info
  const cfg = props.widget.more_info;
  if (cfg?.disabled) return;
  const targetEntity = cfg?.entity_id ?? props.widget.entity;
  if (!targetEntity) return;
  withUnlock(() => openMoreInfo(cfg?.entity_id));
}
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
