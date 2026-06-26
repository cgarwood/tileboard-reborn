import type { VisibilityConfig } from './visibility';

export type Widget = {
  type: string;
  entity?: string;
  title?: string;
  subtitle?: string;
  class?: string;
  style?: Record<string, string | number>;
  background?: string;
  title_color?: string | Record<string, string>;
  subtitle_color?: string | Record<string, string>;
  grid?: WidgetGrid;
  restriction?: string;
  visibility?: VisibilityConfig;
  [key: string]: unknown;
};

export interface WidgetGrid {
  width?: number;
  height?: number;
}
