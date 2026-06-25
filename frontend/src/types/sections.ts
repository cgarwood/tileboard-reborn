import type { Widget } from './widgets';
import type { VisibilityConfig } from './visibility';

export type Section = {
  name?: string;
  width?: number;
  style?: Record<string, string | number>;
  name_style?: Record<string, string | number>;
  visibility?: VisibilityConfig;
  widgets: Widget[];
};
