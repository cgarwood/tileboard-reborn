import type { ScreensaverConfig } from './screensaver';

export type Config = {
  ha_url: string;
  name: string;
  id: string;
  grid_size?: number;
  weather_alerts?: WeatherAlertConfig;
  screensaver?: ScreensaverConfig;
  sendspin?: SendSpinConfig;
  plex?: PlexConfig;
  restrictions?: RestrictionConfig;
  pages: PagesConfig[];
  events: EventsConfig[];
};

export type WeatherAlertConfig = {
  source: string;
  interval?: number;
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
