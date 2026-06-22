import { computed } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import type { PropResolveContext } from '../utils/resolveWidgetProp';
import type { Widget } from '../types/widgets';

export function useWidget(widget: () => Widget) {
  const haStore = useHomeAssistantStore();

  const entity = computed(() => {
    const id = widget().entity;
    return id ? (haStore.states[id] ?? null) : null;
  });

  const state = computed(() => entity.value?.state ?? null);

  const NULL_ENTITY = { state: null as unknown as string, attributes: {} };

  const resolveCtx = computed<PropResolveContext>(() => ({
    state: state.value,
    attributes: entity.value?.attributes ?? {},
    entity: (id) => haStore.states[id] ?? NULL_ENTITY,
    states: haStore.states,
  }));

  const title = computed(() => {
    const raw = widget().title;
    const resolved = raw != null ? resolveWidgetProp(raw, resolveCtx.value) : undefined;
    return resolved ?? entity.value?.attributes.friendly_name ?? widget().entity ?? '';
  });

  const subtitle = computed(() => resolveWidgetProp(widget().subtitle, resolveCtx.value));

  const unitOfMeasurement = computed(() => entity.value?.attributes.unit_of_measurement ?? '');

  const isOn = computed(() => entity.value?.state === 'on');

  const cardClass = computed(() => resolveWidgetProp(widget().class, resolveCtx.value));

  const background = computed(() => resolveWidgetProp(widget().background, resolveCtx.value));

  const backgroundStyle = computed(() =>
    background.value ? { background: background.value } : {},
  );

  const cardStyle = computed(() => [widget().style ?? {}]);

  const icon = computed(() => resolveWidgetProp(widget().icon, resolveCtx.value));

  return {
    entity,
    title,
    subtitle,
    state,
    unitOfMeasurement,
    isOn,
    cardClass,
    cardStyle,
    background,
    backgroundStyle,
    icon,
  };
}
