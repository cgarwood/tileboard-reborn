import type { MenuConfig } from './menu';
import type { VisibilityConfig } from './visibility';

export interface ScreensaverConfig {
  timeout: number;
  slide_duration?: number;
  media_source: string;
  weather_entity?: string;
  calendars?: ScreensaverCalendarConfig[];
  menus?: ScreensaverMenuConfig[];
  custom_slides?: CustomSlideConfig[];
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
  /** Resolved against each custom slide's entity. */
  custom?: SlideBackground;
}

export interface ScreensaverMenuConfig extends MenuConfig {
  /** Overrides `backgrounds.menu` for this menu's slide. */
  background?: SlideBackground;
}

/** Plain text, a state map or a `{{ template }}`, resolved against the slide's `entity`. */
export type SlideText = string | Record<string, string>;

/** A user-defined slide: the built-in card layout, or the author's own `html` + `css`. */
export interface CustomSlideConfig {
  /** Entity that `state`/`attributes` and state maps resolve against. The slide is hidden while it's unavailable. */
  entity?: string;
  /** Small uppercase label at the top, e.g. "Joke of the Day". */
  header?: SlideText;
  /** MDI icon (`mdi-...`) shown above the title. */
  icon?: SlideText;
  title?: SlideText;
  /** Main body. The slide is hidden when this resolves to empty. */
  text?: SlideText;
  footer?: SlideText;
  /** Replaces the built-in layout. `{{ }}` results are HTML-escaped; the rest is used as written. */
  html?: string;
  /** Global CSS for this slide. Prefix selectors with the slide's `class` to keep them local. */
  css?: string;
  /** Extra class on the slide's root element. */
  class?: string;
  background?: SlideBackground;
  visibility?: VisibilityConfig;
  /** Seconds on screen. Defaults to twice `slide_duration`, like the other info slides. */
  duration?: number;
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

export interface CustomSlide {
  type: 'custom';
  /** Index into the screensaver `custom_slides` config. */
  index: number;
}

export type Slide = CustomSlide | ImageSlide | WeatherCurrentSlide | WeatherHourlySlide | WeatherDailySlide | CalendarTodaySlide | CalendarTomorrowSlide | MenuSlide;
