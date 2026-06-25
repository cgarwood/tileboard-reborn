export interface ScreensaverConfig {
  timeout: number;
  slide_duration?: number;
  media_source: string;
  weather_entity?: string;
  calendars?: ScreensaverCalendarConfig[];
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

export type Slide = ImageSlide | WeatherCurrentSlide | WeatherHourlySlide | WeatherDailySlide | CalendarTodaySlide | CalendarTomorrowSlide;
