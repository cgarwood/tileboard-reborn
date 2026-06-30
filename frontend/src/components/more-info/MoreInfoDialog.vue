<template>
  <q-dialog v-model="dialogOpen" @hide="emit('hide')">
    <q-card class="more-info-dialog">
      <div class="more-info-dialog__header" :style="headerBgStyle">
        <div class="more-info-dialog__header-text">
          <div class="more-info-dialog__title">{{ dialogTitle }}</div>
          <div v-if="dialogSubtitle" class="more-info-dialog__subtitle">{{ dialogSubtitle }}</div>
        </div>
        <q-btn flat round dense icon="close" color="white" @click="dialogOpen = false" />
      </div>

      <div class="more-info-dialog__content">
        <MoreInfoLight v-if="contentType === 'light'" :entity-id="entityId!" />
        <MoreInfoClimate v-else-if="contentType === 'climate'" :entity-id="entityId!" />
        <MoreInfoNumber v-else-if="contentType === 'number'" :entity-id="entityId!" />
        <MoreInfoWeather v-else-if="contentType === 'weather'" :entity-id="entityId!" />
        <MoreInfoSensor
          v-else
          :entity-id="entityId ?? ''"
          :chart-enabled="moreInfoConfig.chart !== false"
          :chart-hours="moreInfoConfig.chart_hours"
          :chart-min="moreInfoConfig.chart_min"
          :chart-max="moreInfoConfig.chart_max"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';
import { resolveWidgetProp } from '../../utils/resolveWidgetProp';
import type { PropResolveContext } from '../../utils/resolveWidgetProp';
import type { Widget } from '../../types/widgets';
import type { MoreInfoConfig } from '../../types/more-info';
import MoreInfoSensor from './MoreInfoSensor.vue';
import MoreInfoLight from './MoreInfoLight.vue';
import MoreInfoNumber from './MoreInfoNumber.vue';
import MoreInfoClimate from './MoreInfoClimate.vue';
import MoreInfoWeather from './MoreInfoWeather.vue';

const props = defineProps<{
  widget: Widget;
  entityIdOverride?: string;
}>();
const emit = defineEmits<{ hide: [] }>();

const dialogOpen = ref(true);

const haStore = useHomeAssistantStore();

const entityId = computed(
  () => props.entityIdOverride ?? props.widget.more_info?.entity_id ?? props.widget.entity ?? null,
);

const entity = computed(() => (entityId.value ? (haStore.states[entityId.value] ?? null) : null));

const moreInfoConfig = computed<MoreInfoConfig>(() => props.widget.more_info ?? {});

const NULL_ENTITY = { state: null as unknown as string, attributes: {} };
const resolveCtx = computed<PropResolveContext>(() => ({
  state: entity.value?.state ?? null,
  attributes: entity.value?.attributes ?? {},
  entity: (id) => haStore.states[id] ?? NULL_ENTITY,
  states: haStore.states,
}));

const dialogTitle = computed(() => {
  const override = moreInfoConfig.value.title;
  if (override) return resolveWidgetProp(override, resolveCtx.value) ?? '';
  return (
    resolveWidgetProp(props.widget.title, resolveCtx.value) ??
    entity.value?.attributes.friendly_name ??
    entityId.value ??
    'More Info'
  );
});

const dialogSubtitle = computed(() => {
  const override = moreInfoConfig.value.subtitle;
  if (override) return resolveWidgetProp(override, resolveCtx.value);
  return resolveWidgetProp(props.widget.subtitle, resolveCtx.value);
});

const headerBgStyle = computed(() => {
  const bg = moreInfoConfig.value.header_background;
  if (!bg) return undefined;
  const resolved = resolveWidgetProp(bg, resolveCtx.value);
  return resolved ? { background: resolved } : undefined;
});

const contentType = computed(() => {
  const domain = entityId.value?.split('.')[0] ?? '';
  switch (domain) {
    case 'light':
      return 'light';
    case 'climate':
      return 'climate';
    case 'number':
    case 'input_number':
      return 'number';
    case 'weather':
      return 'weather';
    default:
      return 'sensor';
  }
});
</script>

<style lang="scss" scoped>
.more-info-dialog {
  width: min(480px, 95vw);
  background: #1e1e2e;
  color: #fff;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 12px 16px 20px;
    background: rgba(255, 255, 255, 0.06);
    min-height: 64px;
  }

  &__header-text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    font-size: 0.75rem;
    opacity: 0.65;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }

  &__content {
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
