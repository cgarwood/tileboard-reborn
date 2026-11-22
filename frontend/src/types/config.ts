import type { ScreensaverConfig } from './screensaver';

export type Config = {
  ha_url: string;
  name: string;
  id: string;
  grid_size?: number;
  layout?: LayoutConfig;
  weather_alerts?: WeatherAlertConfig;
  screensaver?: ScreensaverConfig;
  sendspin?: SendSpinConfig;
  plex?: PlexConfig;
  restrictions?: RestrictionConfig;
  pages: PagesConfig[];
  events: EventsConfig[];
  resources?: ResourceConfig[];
};

export type LayoutConfig = {
  /** `auto` follows the device's orientation */
  orientation?: 'auto' | 'landscape' | 'portrait';
  /** `auto` puts the nav rail on the left in landscape and at the bottom in portrait */
  nav_position?: 'auto' | 'left' | 'bottom';
  header?: HeaderConfig;
};

/** Items in the top bar. The device status items only appear inside Fully Kiosk Browser. */
export type HeaderConfig = {
  /** Battery level and charging status. Default true */
  battery?: boolean;
  /** Badge that appears when there are problems to look at, opening the Issues dialog. Default true */
  issues?: boolean;
  /**
   * Device volume sliders in the header menu. `true` (default) shows media only; a list picks which streams to show, in order; `false` hides them.
   */
  volume?: boolean | VolumeStream[];
};

/** Android audio streams Fully Kiosk can set the volume of. Sendspin and other web audio play on `media`. */
export type VolumeStream = 'media' | 'notification' | 'alarm' | 'system' | 'ring';

/** `module` is reserved for custom widgets and not loaded yet */
export type ResourceType = 'css' | 'module';

export type ResourceConfig = {
  url: string;
  type?: ResourceType;
};

export type WeatherAlertConfig = {
  entity: string;
};

export type SendSpinConfig = {
  server: string;
  id: string;
  name: string;
};

export type PlexConfig = {
  server: string;
  port: number;
  protocol: 'http' | 'https';
  token: string;
};

export type RestrictionConfig = {
  [id: string]: {
    name: string;
    conditions?: RestrictionCondition[];
    pin?: RestrictionsPinConfig;
    unlock_time?: number;
    confirm?: RestictionsConfirmConfig;
  };
};

export type RestrictionCondition = {
  entity: string;
  state: string;
};

export type RestrictionsPinConfig = {
  code: string;
  message: string;
};

export type RestictionsConfirmConfig = {
  message: string;
};

import type { Page } from './page';

export type PagesConfig = Page;

import type { TapAction } from './actions';

export type EventsConfig = {
  command: string;
  action: TapAction | TapAction[];
};
