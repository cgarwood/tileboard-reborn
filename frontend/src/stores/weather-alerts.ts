import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, watch } from 'vue';
import type { WeatherAlertConfig } from '../types/config';
import type { WeatherAlert } from '../types/weather-alerts';
import { useHomeAssistantStore } from './home-assistant';

export const useWeatherAlertsStore = defineStore('weatherAlerts', () => {
  const alerts = ref<WeatherAlert[]>([]);

  function initialize(config: WeatherAlertConfig) {
    const haStore = useHomeAssistantStore();
    watch(
      () => haStore.states[config.entity],
      (entity) => {
        const raw = (entity?.attributes.alerts ?? []) as HaAlert[];
        alerts.value = raw.map(haAlertToAlert);
      },
      { immediate: true },
    );
  }

  const weatherAlertIconMap: Record<string, string> = {
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

  return { alerts, weatherAlertIconMap, initialize };
});

// HA weatheralerts sensor attribute shape
interface HaAlert {
  id: string;
  event: string;
  NWSheadline: string | null;
  description: string | null;
  instruction: string | null;
  severity: string;
  urgency: string;
  certainty: string;
  status: string;
  messageType: string;
  area: string;
  sent: string;
  effective: string;
  onset: string | null;
  expires: string;
  ends: string | null;
  senderName: string;
}

function haAlertToAlert(a: HaAlert): WeatherAlert {
  return {
    id: a.id,
    event: a.event,
    headline: a.NWSheadline,
    description: a.description,
    instruction: a.instruction,
    severity: a.severity,
    urgency: a.urgency,
    certainty: a.certainty,
    status: a.status,
    messageType: a.messageType,
    areaDesc: a.area,
    sent: a.sent,
    effective: a.effective,
    onset: a.onset,
    expires: a.expires,
    ends: a.ends,
    senderName: a.senderName,
  };
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWeatherAlertsStore, import.meta.hot));
}
