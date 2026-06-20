import type { WidgetGrid } from '../types/widgets';

const registry = new Map<string, WidgetGrid>();

export function registerWidgetDefaults(type: string, grid: WidgetGrid): void {
  registry.set(type, grid);
}

export function getWidgetDefaults(type: string): WidgetGrid {
  return registry.get(type) ?? {};
}
