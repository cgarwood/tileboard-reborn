export type Widget = {
  type: string;
  entity?: string;
  title?: string;
  subtitle?: string;
  class?: string;
  style?: Record<string, string | number>;
  background?: string;
  grid?: WidgetGrid;
  restriction?: string;
  [key: string]: unknown;
};

export interface WidgetGrid {
  width?: number;
  height?: number;
}
