import type { VisibilityConfig } from './visibility';
import type { MoreInfoConfig } from './more-info';
import type { TapAction } from './actions';

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
  more_info?: MoreInfoConfig;
  tap_action?: TapAction | TapAction[];
  hold_action?: TapAction | TapAction[];
  [key: string]: unknown;
};

export interface WidgetGrid {
  width?: number;
  height?: number;
}
