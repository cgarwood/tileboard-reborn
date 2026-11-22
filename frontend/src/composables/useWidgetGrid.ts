import { computed, type CSSProperties } from 'vue';
import type { HassEntities } from 'home-assistant-js-websocket';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { Widget } from '../types/widgets';
import { getWidgetDefaults } from '../utils/widgetRegistry';
import { resolveConditional } from '../utils/conditionalWidget';
import { evaluateVisibility } from './useVisibility';

/** Gap between grid cells, in px. Shared by sections and nested grids so cells line up. */
export const WIDGET_GRID_GAP = 8;

const DEFAULT_SPAN = 2;

/** A widget's size in grid cells. A conditional takes the active case's `grid` first. */
export function widgetSize(
  widget: Widget,
  states: HassEntities,
): { width: number; height: number } {
  const defaults = getWidgetDefaults(widget.type);
  const caseGrid =
    widget.type === 'conditional' ? resolveConditional(widget, states).grid : undefined;
  return {
    width: caseGrid?.width ?? widget.grid?.width ?? defaults.width ?? DEFAULT_SPAN,
    height: caseGrid?.height ?? widget.grid?.height ?? defaults.height ?? DEFAULT_SPAN,
  };
}

/** Visible widgets of a grid, each with the style that places it. */
export function useWidgetGrid(getWidgets: () => Widget[]) {
  const haStore = useHomeAssistantStore();

  // Keyed by position in the config (not in the filtered list) so a widget hiding doesn't shift
  // every later widget onto a different component instance.
  const items = computed(() =>
    getWidgets()
      .map((widget, index) => ({ widget, index }))
      .filter(({ widget }) => evaluateVisibility(widget.visibility, haStore.states))
      .map(({ widget, index }) => {
        const { width, height } = widgetSize(widget, haStore.states);
        const style: CSSProperties = { gridColumn: `span ${width}`, gridRow: `span ${height}` };
        return { widget, index, style };
      }),
  );

  return { items };
}
