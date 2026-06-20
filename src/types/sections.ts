import type { Widget } from './widgets';

export type Section = {
  name?: string;
  width?: number;
  style?: Record<string, string | number>;
  name_style?: Record<string, string | number>;
  widgets: Widget[];
};
