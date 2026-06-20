import type { ScreensaverConfig } from './screensaver';

export type Config = {
  haUrl: string;
  name: string;
  id: string;
  weatherAlerts?: WeatherAlertConfig;
  screensaver?: ScreensaverConfig;
  snapcast?: SnapcastConfig;
  plex?: PlexConfig;
  restrictions?: RestrictionConfig;
  pages: PagesConfig[];
};

export type WeatherAlertConfig = {
  source: string;
  interval?: number;
};

export type SnapcastConfig = {
  server: string;
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
