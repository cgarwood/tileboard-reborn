export interface ServiceAction {
  action: 'service';
  service: string;
  data?: Record<string, unknown>;
}

export interface JavascriptAction {
  action: 'javascript';
  data: string;
}

export interface EventAction {
  action: 'event';
  event: string;
  data?: Record<string, unknown>;
}

export interface NavigateAction {
  action: 'navigate';
  url?: string;
  page?: string;
}

export interface ScreensaverAction {
  action: 'screensaver';
}

export interface MoreInfoAction {
  action: 'more_info';
  entity?: string;
}

export interface NoneAction {
  action: 'none';
}

export type TapAction =
  | ServiceAction
  | JavascriptAction
  | EventAction
  | NavigateAction
  | ScreensaverAction
  | MoreInfoAction
  | NoneAction;

/** An action that needs no other keys can be written as just its name, e.g. `tap_action: more_info`. */
export type ActionShorthand = 'more_info' | 'none' | 'screensaver';

/** `tap_action`, `hold_action` and event `action` values: one action or a list, run in order. */
export type ActionConfig = TapAction | ActionShorthand | (TapAction | ActionShorthand)[];
