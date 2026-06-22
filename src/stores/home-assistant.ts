import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, shallowRef } from 'vue';
import {
  createConnection,
  getAuth,
  subscribeEntities,
  callService,
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_AUTH,
  type Connection,
} from 'home-assistant-js-websocket';
import type { HassEntities, AuthData } from 'home-assistant-js-websocket';
import type { ForecastType, WeatherForecast } from '../types/weather';

const TOKENS_KEY = 'tileboard:haTokens';

export const useHomeAssistantStore = defineStore('homeAssistant', () => {
  const states = ref<HassEntities>({});
  const connection = shallowRef<Connection | null>(null);
  const connected = ref(false);
  const error = ref<string | null>(null);
  const weatherForecasts = ref<Record<string, Partial<Record<ForecastType, WeatherForecast[]>>>>({});

  let unsubscribeEntities: (() => void) | null = null;

  // Non-reactive: keyed by `${entityId}:${forecastType}`
  const forecastSubs = new Map<string, {
    unsubPromise: Promise<() => Promise<void>>;
    refCount: number;
  }>();

  function clearTokens() {
    localStorage.removeItem(TOKENS_KEY);
  }

  async function connect(haUrl: string) {
    disconnect();
    error.value = null;

    try {
      const auth = await getAuth({
        hassUrl: haUrl,
        saveTokens: (tokens) => {
          localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
        },
        loadTokens: () => {
          const stored = localStorage.getItem(TOKENS_KEY);
          return Promise.resolve(stored ? (JSON.parse(stored) as AuthData) : null);
        },
      });

      const conn = await createConnection({ auth });
      connection.value = conn;
      connected.value = true;

      conn.addEventListener('disconnected', (_conn, code?: number) => {
        connected.value = false;
        console.log('Home Assistant connection closed', code);
      });
      conn.addEventListener('ready', () => {
        connected.value = true;
      });

      unsubscribeEntities = subscribeEntities(conn, (entities) => {
        states.value = entities;
      });
    } catch (e) {
      if (e === ERR_INVALID_AUTH) {
        // Tokens are invalid or revoked — clear them and retry, which will
        // trigger the OAuth redirect since no tokens are stored.
        clearTokens();
        //void connect(haUrl);
        return;
      }
      if (e === ERR_HASS_HOST_REQUIRED) {
        error.value = 'Home Assistant URL is required';
      } else {
        error.value = e instanceof Error ? e.message : `Connection failed (code: ${String(e)})`;
      }
      connected.value = false;
    }
  }

  function disconnect() {
    unsubscribeEntities?.();
    unsubscribeEntities = null;

    for (const sub of forecastSubs.values()) {
      void sub.unsubPromise.then((unsub) => void unsub()).catch(() => {});
    }
    forecastSubs.clear();
    weatherForecasts.value = {};

    connection.value?.close();
    connection.value = null;
    connected.value = false;
    states.value = {};
  }

  function subscribeWeatherForecast(entityId: string, forecastType: ForecastType): void {
    if (!connection.value) return;
    const key = `${entityId}:${forecastType}`;

    const existing = forecastSubs.get(key);
    if (existing) {
      existing.refCount++;
      return;
    }

    const unsubPromise = connection.value.subscribeMessage<{ forecast: WeatherForecast[] }>(
      (msg) => {
        if (!weatherForecasts.value[entityId]) weatherForecasts.value[entityId] = {};
        weatherForecasts.value[entityId][forecastType] = msg.forecast;
      },
      { type: 'weather/subscribe_forecast', forecast_type: forecastType, entity_id: entityId },
    );

    forecastSubs.set(key, { unsubPromise, refCount: 1 });
  }

  function unsubscribeWeatherForecast(entityId: string, forecastType: ForecastType): void {
    const key = `${entityId}:${forecastType}`;
    const sub = forecastSubs.get(key);
    if (!sub) return;

    sub.refCount--;
    if (sub.refCount > 0) return;

    void sub.unsubPromise.then((unsub) => void unsub()).catch(() => {});
    forecastSubs.delete(key);

    const entityForecasts = weatherForecasts.value[entityId];
    if (entityForecasts) {
      delete entityForecasts[forecastType];
      if (Object.keys(entityForecasts).length === 0) delete weatherForecasts.value[entityId];
    }
  }

  async function callHassService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ) {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    await callService(connection.value, domain, service, serviceData ?? {});
  }

  async function fireEvent(eventType: string, eventData?: Record<string, unknown>) {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    await connection.value.sendMessagePromise({
      type: 'fire_event',
      event_type: eventType,
      event_data: eventData ?? {},
    });
  }

  async function sendMessage<T>(message: { type: string; [key: string]: unknown }): Promise<T> {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    return connection.value.sendMessagePromise<T>(message);
  }

  function subscribeMessage<T>(
    callback: (msg: T) => void,
    message: { type: string; [key: string]: unknown },
  ): Promise<() => Promise<void>> {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    return connection.value.subscribeMessage<T>(callback, message);
  }

  function subscribeHassEvents<T = unknown>(
    callback: (event: T) => void,
    eventType?: string,
  ): Promise<() => Promise<void>> {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    return connection.value.subscribeMessage<T>(callback, {
      type: 'subscribe_events',
      event_type: eventType,
    });
  }

  return {
    states,
    connected,
    error,
    weatherForecasts,
    connect,
    disconnect,
    clearTokens,
    callService: callHassService,
    fireEvent,
    sendMessage,
    subscribeMessage,
    subscribeHassEvents,
    subscribeWeatherForecast,
    unsubscribeWeatherForecast,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHomeAssistantStore, import.meta.hot));
}
