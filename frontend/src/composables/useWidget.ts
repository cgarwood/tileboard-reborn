import { computed, inject, provide } from 'vue';
import type { InjectionKey } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import type { PropResolveContext } from '../utils/resolveWidgetProp';
import type { Widget } from '../types/widgets';

type WidgetContext = ReturnType<typeof createWidgetContext>;

const WIDGET_CONTEXT: InjectionKey<{ widget: () => Widget; ctx: WidgetContext }> =
  Symbol('widget-context');

/**
 * Resolved props for a widget. A widget and the BaseWidget it renders both call this for the same
 * config object; the second call reuses the first's computeds instead of building a duplicate set.
 */
export function useWidget(widget: () => Widget): WidgetContext {
  const shared = inject(WIDGET_CONTEXT, null);
  if (shared && shared.widget() === widget()) return shared.ctx;

  const ctx = createWidgetContext(widget);
  provide(WIDGET_CONTEXT, { widget, ctx });
  return ctx;
}

function createWidgetContext(widget: () => Widget) {
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
  const iconColor = computed(() => resolveWidgetProp(widget().icon_color, resolveCtx.value));
  const titleColor = computed(() => resolveWidgetProp(widget().title_color, resolveCtx.value));
  const subtitleColor = computed(() => resolveWidgetProp(widget().subtitle_color, resolveCtx.value));
  const stateBadge = computed(() => resolveWidgetProp(widget().state_badge, resolveCtx.value));

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
    iconColor,
    titleColor,
    subtitleColor,
    stateBadge,
    resolveCtx,
  };
}
