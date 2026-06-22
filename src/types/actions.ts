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

export type TapAction =
  | ServiceAction
  | JavascriptAction
  | EventAction
  | NavigateAction
  | ScreensaverAction;
