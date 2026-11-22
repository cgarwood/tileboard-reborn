import { computed } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';
import { widgetSize } from './useWidgetGrid';

/**
 * Layout class for a tile's size:
 * - `micro`: 1×1
 * - `short`: one cell high and at least two wide (a single row: icon, labels, badge)
 * - `normal`: everything else
 */
export type WidgetSizeClass = 'micro' | 'short' | 'normal';

const ICON_SIZES: Record<WidgetSizeClass, string> = {
  micro: '28px',
  short: '26px',
  normal: '40px',
};

/**
 * A widget's size in grid cells and its layout class. Falls back to the type's registered
 * defaults the same way the grid does, so it matches the space the widget actually gets.
 */
export function useWidgetSize(getWidget: () => Widget) {
  const haStore = useHomeAssistantStore();

  const dims = computed(() => widgetSize(getWidget(), haStore.states));
  const width = computed(() => dims.value.width);
  const height = computed(() => dims.value.height);

  const size = computed<WidgetSizeClass>(() => {
    if (height.value > 1) return 'normal';
    return width.value <= 1 ? 'micro' : 'short';
  });

  /** `widget-body--micro` / `widget-body--short` (styled in css/_widget.scss), or none. */
  const bodyClass = computed(() => (size.value === 'normal' ? null : `widget-body--${size.value}`));

  /** Icon size for the widgets that show one large icon. */
  const iconSize = computed(() => ICON_SIZES[size.value]);

  return { width, height, size, bodyClass, iconSize };
}
