import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import type { WeatherAlertConfig } from '../types/config';
import type { WeatherAlert } from '../types/weather-alerts';

const DEFAULT_INTERVAL_S = 60;

export const useWeatherAlertsStore = defineStore('weatherAlerts', () => {
  const alerts = ref<WeatherAlert[]>([]);
  const lastRefresh = ref<Date | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let pollerId: ReturnType<typeof setInterval> | null = null;
  let activeSource = '';

  async function fetchAlerts(source: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(source, {
        headers: { Accept: 'application/geo+json' },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data = (await response.json()) as { features: NwsFeature[] };
      alerts.value = (data.features ?? []).map(featureToAlert);
      lastRefresh.value = new Date();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  function startPolling(config: WeatherAlertConfig) {
    stopPolling();
    activeSource = config.source;
    const intervalMs = (config.interval ?? DEFAULT_INTERVAL_S) * 1000;
    void fetchAlerts(activeSource);
    pollerId = setInterval(() => void fetchAlerts(activeSource), intervalMs);
  }

  function stopPolling() {
    if (pollerId !== null) {
      clearInterval(pollerId);
      pollerId = null;
    }
  }

  const weatherAlertIconMap: { [index: string]: string } = {
    'Tornado Warning': 'mdi-weather-tornado',
    'Tornado Watch': 'mdi-weather-tornado',
    'Severe Thunderstorm Warning': 'mdi-weather-lightning',
    'Severe Thunderstorm Watch': 'mdi-weather-lightning',
    'Flood Warning': 'mdi-home-flood',
    'Flash Flood Warning': 'mdi-home-flood',
    'Flood Watch': 'mdi-home-flood',
    'Flash Flood Watch': 'mdi-home-flood',
    'Air Quality Alert': 'mdi-air-filter',
    'Winter Storm Watch': 'mdi-weather-snowy',
    'Winter Storm Warning': 'mdi-weather-snowy',
    'Winter Weather Advisory': 'mdi-weather-snowy',
    'Blizzard Warning': 'mdi-weather-snowy-heavy',
    'Blizzard Watch': 'mdi-weather-snowy-heavy',
    'Wind Chill Advisory': 'mdi-snowflake-thermometer',
    'Wind Chill Warning': 'mdi-snowflake-thermometer',
    'Heat Advisory': 'mdi-sun-thermometer',
    'Excessive Heat Warning': 'mdi-sun-thermometer',
    'Excessive Heat Watch': 'mdi-sun-thermometer',
  };
  return { alerts, lastRefresh, loading, error, weatherAlertIconMap, startPolling, stopPolling };
});

// NWS GeoJSON feature shape (only what we use)
interface NwsFeature {
  id: string;
  properties: {
    event: string;
    headline: string | null;
    description: string | null;
    instruction: string | null;
    severity: string;
    urgency: string;
    certainty: string;
    status: string;
    messageType: string;
    areaDesc: string;
    sent: string;
    effective: string;
    onset: string | null;
    expires: string;
    ends: string | null;
    senderName: string;
  };
}

function featureToAlert(f: NwsFeature): WeatherAlert {
  const p = f.properties;
  return {
    id: f.id,
    event: p.event,
    headline: p.headline,
    description: p.description,
    instruction: p.instruction,
    severity: p.severity,
    urgency: p.urgency,
    certainty: p.certainty,
    status: p.status,
    messageType: p.messageType,
    areaDesc: p.areaDesc,
    sent: p.sent,
    effective: p.effective,
    onset: p.onset,
    expires: p.expires,
    ends: p.ends,
    senderName: p.senderName,
  };
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWeatherAlertsStore, import.meta.hot));
}
