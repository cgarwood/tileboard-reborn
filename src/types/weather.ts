export type ForecastType = 'daily' | 'hourly' | 'twice_daily';

export enum WeatherEntityFeature {
  FORECAST_DAILY = 1,
  FORECAST_HOURLY = 2,
  FORECAST_TWICE_DAILY = 4,
}

export interface WeatherForecast {
  datetime: string;
  condition: string;
  temperature?: number;
  templow?: number;
  precipitation?: number;
  precipitation_probability?: number;
  wind_speed?: number;
  wind_bearing?: number;
  humidity?: number;
  uv_index?: number;
  cloud_coverage?: number;
  /** Only present for twice_daily forecasts */
  is_daytime?: boolean;
}
