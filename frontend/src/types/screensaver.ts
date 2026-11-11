import type { MenuConfig } from './menu';

export interface ScreensaverConfig {
  timeout: number;
  slide_duration?: number;
  media_source: string;
  weather_entity?: string;
  calendars?: ScreensaverCalendarConfig[];
  menus?: ScreensaverMenuConfig[];
  backgrounds?: ScreensaverBackgrounds;
}

/** Image URL, state map or `{{ template }}`, resolved like a widget prop. `false` shows the gradient only. */
export type SlideBackground = string | Record<string, string> | false;

export interface ScreensaverBackgrounds {
  /** Resolved against `weather_entity`, so a state map can pick an image per condition. */
  weather?: SlideBackground;
  calendar?: SlideBackground;
  /** Resolved against each menu's entity. */
  menu?: SlideBackground;
}

export interface ScreensaverMenuConfig extends MenuConfig {
  /** Overrides `backgrounds.menu` for this menu's slide. */
  background?: SlideBackground;
}

export interface HABrowseMediaChild {
  media_content_id: string;
  can_expand: boolean;
}

export interface HABrowseMediaResult {
  children?: HABrowseMediaChild[];
}

export interface ScreensaverCalendarConfig {
  entity: string;
  name?: string;
  color?: string;
}

// Discriminated union — extend with NewsSlide, AlertSlide, etc.
export interface ImageSlide {
  type: 'image';
  url: string;
}

export interface WeatherCurrentSlide {
  type: 'weather-current';
}

export interface WeatherHourlySlide {
  type: 'weather-hourly';
}

export interface WeatherDailySlide {
  type: 'weather-daily';
}

export interface CalendarTodaySlide {
  type: 'calendar-today';
}

export interface CalendarTomorrowSlide {
  type: 'calendar-tomorrow';
}

export interface MenuSlide {
  type: 'menu';
  /** Index into the screensaver `menus` config. */
  index: number;
}

export type Slide = ImageSlide | WeatherCurrentSlide | WeatherHourlySlide | WeatherDailySlide | CalendarTodaySlide | CalendarTomorrowSlide | MenuSlide;
