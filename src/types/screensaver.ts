export interface ScreensaverConfig {
  timeout: number;
  speed?: number;
  source: string;
  sourcePrefix?: string;
  weather_entity?: string;
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

export type Slide = ImageSlide | WeatherCurrentSlide | WeatherHourlySlide | WeatherDailySlide;
