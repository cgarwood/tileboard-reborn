export const WEATHER_ICON_MAP: Record<string, string> = {
  'clear-night': 'mdi-weather-night',
  cloudy: 'mdi-weather-cloudy',
  exceptional: 'mdi-alert-circle-outline',
  fog: 'mdi-weather-fog',
  hail: 'mdi-weather-hail',
  lightning: 'mdi-weather-lightning',
  'lightning-rainy': 'mdi-weather-lightning-rainy',
  partlycloudy: 'mdi-weather-partly-cloudy',
  pouring: 'mdi-weather-pouring',
  rainy: 'mdi-weather-rainy',
  snowy: 'mdi-weather-snowy',
  'snowy-rainy': 'mdi-weather-snowy-rainy',
  sunny: 'mdi-weather-sunny',
  windy: 'mdi-weather-windy',
  'windy-variant': 'mdi-weather-windy-variant',
};

// Some weather states are not user-friendly, so we provide a mapping to more human-friendly labels.
const WEATHER_STATE_LABELS: Record<string, string> = {
  partlycloudy: 'Partly Cloudy',
  pouring: 'Heavy Rain',
  'snowy-rainy': 'Wintery Mix',
  lightning: 'Thunderstorms',
  'lightning-rainy': 'Rain & Thunderstorms',
};

export function getWeatherIcon(state: string, fallback = 'mdi-weather-cloudy'): string {
  return WEATHER_ICON_MAP[state] ?? fallback;
}

export function formatWeatherState(state: string): string {
  return (
    WEATHER_STATE_LABELS[state] ?? state.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
