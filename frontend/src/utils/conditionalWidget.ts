import type { HassEntities } from 'home-assistant-js-websocket';
import { evaluateVisibility } from '../composables/useVisibility';
import type { ConditionalWidget, Widget, WidgetGrid } from '../types/widgets';

export interface ActiveConditionalCase {
  /** Stable id of the active branch, so switching cases mounts fresh child widgets. */
  key: string;
  grid?: WidgetGrid;
  widgets: Widget[];
}

/**
 * The branch of a `conditional` widget to show: the first case whose conditions pass, then
 * `default`, then nothing (the slot stays empty but keeps its size).
 */
export function resolveConditional(widget: Widget, states: HassEntities): ActiveConditionalCase {
  const config = widget as ConditionalWidget;
  const cases = config.cases ?? [];
  const index = cases.findIndex((c) =>
    evaluateVisibility({ match: c.match ?? 'all', conditions: c.conditions ?? [] }, states),
  );
  const match = index >= 0 ? cases[index] : undefined;
  if (match) {
    return {
      key: `case-${index}`,
      ...(match.grid ? { grid: match.grid } : {}),
      widgets: match.widgets ?? [],
    };
  }
  return { key: config.default ? 'default' : 'none', widgets: config.default ?? [] };
}
