import type { VisibilityCondition, VisibilityConfig } from './visibility';
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

/** One case of a `conditional` widget. The first case whose conditions pass is shown. */
export interface ConditionalCase {
  match?: 'all' | 'any';
  conditions?: VisibilityCondition[];
  /** Slot size while this case is active; falls back to the conditional's own `grid`. */
  grid?: WidgetGrid;
  widgets?: Widget[];
}

export type ConditionalWidget = Widget & {
  type: 'conditional';
  cases?: ConditionalCase[];
  /** Widgets shown when no case matches. */
  default?: Widget[];
};
