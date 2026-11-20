import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, shallowRef, shallowReactive, toRaw } from 'vue';
import {
  createConnection,
  getAuth,
  callService,
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_AUTH,
  type Connection,
} from 'home-assistant-js-websocket';
import type { HassEntities, AuthData } from 'home-assistant-js-websocket';
import type { ForecastType, WeatherForecast } from '../types/weather';
import { applyEntityUpdates, type EntityUpdatesMessage } from '../utils/applyEntityUpdates';

const TOKENS_KEY = 'tileboard:haTokens';

// HAWS has no keepalive. When the network drops without a clean close (Wi-Fi loss, tablet sleep,
// NAT timeout) the socket stays OPEN, sends are silently buffered and replies never come. Ping
// periodically and force a reconnect when a ping goes unanswered.
const PING_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MS = 8_000;
// Backoff for retrying the initial connection (HAWS only auto-reconnects an established one).
const RETRY_MAX_MS = 30_000;

export const useHomeAssistantStore = defineStore('homeAssistant', () => {
  // Per-entity reactivity: readers of states[id] only re-run when that entity changes.
  // Never reassign this object — it's mutated in place by applyEntityUpdates().
  const states = shallowReactive<HassEntities>({});
  const connection = shallowRef<Connection | null>(null);
  const connected = ref(false);
  const entitiesLoaded = ref(false);
  const hassUrl = ref<string | null>(null);
  const haVersion = ref<string | null>(null);
  const error = ref<string | null>(null);
  // Shallow like `states`: per-entity tracking, and forecast arrays stay plain (not deep-proxied).
  // Entries are replaced, never mutated, so consumers of one entity don't re-run for another.
  const weatherForecasts = shallowReactive<
    Record<string, Readonly<Partial<Record<ForecastType, WeatherForecast[]>>>>
  >({});

  let unsubscribeEntities: (() => void) | null = null;
  // The first subscribe_entities message (initially and after each reconnect) is a full snapshot.
  let expectSnapshot = true;

  // Non-reactive: keyed by `${entityId}:${forecastType}`. Entries (ref counts) survive disconnects;
  // `unsubPromise` is null while not subscribed on the current socket, and resubscribeForecasts()
  // fills it in once connected again.
  const forecastSubs = new Map<string, {
    entityId: string;
    forecastType: ForecastType;
    unsubPromise: Promise<() => Promise<void>> | null;
    refCount: number;
  }>();

  // Bumped by every connect()/disconnect() so a stale in-flight connect() can tell it lost the race.
  let connectGen = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryAttempt = 0;
  let pingInFlight: Promise<void> | null = null;

  function onEntitiesMessage(msg: EntityUpdatesMessage) {
    if (expectSnapshot) {
      expectSnapshot = false;
      // Drop entities that disappeared while we were disconnected.
      const incoming = msg.a ?? {};
      for (const id of Object.keys(toRaw(states))) {
        if (!(id in incoming)) delete states[id];
      }
    }
    applyEntityUpdates(states, msg);
    entitiesLoaded.value = true;
  }

  function clearStates() {
    for (const id of Object.keys(toRaw(states))) delete states[id];
  }

  function clearTokens() {
    localStorage.removeItem(TOKENS_KEY);
  }

  function stripAuthParams() {
    const url = new URL(window.location.href);
    const params = ['auth_callback', 'code', 'state'];
    if (params.some((p) => url.searchParams.has(p))) {
      params.forEach((p) => url.searchParams.delete(p));
      history.replaceState(null, '', url.toString());
    }
  }

  function scheduleRetry(haUrl: string) {
    if (retryTimer) clearTimeout(retryTimer);
    const delay = Math.min(1000 * 2 ** retryAttempt, RETRY_MAX_MS);
    retryAttempt++;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void connect(haUrl);
    }, delay);
  }

  /** Skip the backoff wait if an initial-connection retry is pending (e.g. the network came back). */
  function retryNow() {
    if (!retryTimer || !hassUrl.value) return;
    clearTimeout(retryTimer);
    retryTimer = null;
    void connect(hassUrl.value);
  }

  /**
   * Verify the socket is actually alive by pinging HA. If no pong arrives in time, the socket is
   * half-open: discard it so HAWS fires 'disconnected' and starts its reconnect loop.
   */
  function checkConnection(): Promise<void> {
    const conn = connection.value;
    if (!conn?.connected) return Promise.resolve();
    if (pingInFlight) return pingInFlight;

    pingInFlight = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        if (connection.value === conn && conn.connected) {
          console.warn(`Home Assistant did not answer a ping within ${PING_TIMEOUT_MS} ms; reconnecting`);
          conn.reconnect(true);
        }
        resolve();
      }, PING_TIMEOUT_MS);
      // A rejection means the socket closed meanwhile; HAWS' own reconnect handles that.
      const done = () => {
        clearTimeout(timer);
        resolve();
      };
      conn.ping().then(done, done);
    }).finally(() => {
      pingInFlight = null;
    });
    return pingInFlight;
  }

  function subscribeForecast(conn: Connection, entityId: string, forecastType: ForecastType) {
    return conn.subscribeMessage<{ forecast: WeatherForecast[] }>(
      (msg) => {
        weatherForecasts[entityId] = { ...weatherForecasts[entityId], [forecastType]: msg.forecast };
      },
      { type: 'weather/subscribe_forecast', forecast_type: forecastType, entity_id: entityId },
      { resubscribe: false },
    );
  }

  function resubscribeForecasts() {
    const conn = connection.value;
    if (!conn?.connected) return;
    for (const sub of forecastSubs.values()) {
      if (!sub.unsubPromise) sub.unsubPromise = subscribeForecast(conn, sub.entityId, sub.forecastType);
    }
  }

  async function connect(haUrl: string) {
    disconnect();
    const gen = connectGen;
    hassUrl.value = haUrl;
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
      if (gen !== connectGen) {
        // disconnect() or another connect() ran while this one was in flight.
        conn.close();
        return;
      }
      retryAttempt = 0;
      connection.value = conn;
      connected.value = true;
      haVersion.value = conn.haVersion;

      // After a successful OAuth callback the URL still contains ?auth_callback=1&code=…
      // Strip those params so a reload doesn't re-present the already-consumed code to HA.
      stripAuthParams();

      conn.addEventListener('disconnected', () => {
        connected.value = false;
        // States are stale until the post-reconnect snapshot arrives.
        entitiesLoaded.value = false;
        // Those subscriptions died with the socket (they're created with resubscribe: false).
        for (const sub of forecastSubs.values()) sub.unsubPromise = null;
        console.log('Home Assistant connection closed');
      });
      conn.addEventListener('ready', () => {
        connected.value = true;
        // HA may have been upgraded while we were disconnected.
        haVersion.value = conn.haVersion;
        // HAWS re-sends subscribe_entities just before firing 'ready', so the next message is a snapshot.
        expectSnapshot = true;
        resubscribeForecasts();
      });
      // HAWS stops reconnecting for good when a reconnect fails with invalid auth (e.g. the refresh
      // token was rejected). Start over: connect() keeps the tokens if they still work, and
      // otherwise clears them and goes through the login flow.
      conn.addEventListener('reconnect-error', () => {
        if (gen !== connectGen) return;
        console.warn('Home Assistant reconnect failed with invalid auth; reconnecting from scratch');
        void connect(haUrl);
      });

      // Subscribed directly rather than via HAWS' subscribeEntities(), whose collection copies all
      // entities on every message; see applyEntityUpdates().
      expectSnapshot = true;
      const unsubPromise = conn.subscribeMessage<EntityUpdatesMessage>(onEntitiesMessage, {
        type: 'subscribe_entities',
      });
      unsubscribeEntities = () => {
        void unsubPromise.then((unsub) => unsub()).catch(() => {});
      };
      resubscribeForecasts();
    } catch (e) {
      if (gen !== connectGen) return;
      const is400 = e instanceof Response && e.status === 400;
      if (e === ERR_INVALID_AUTH || is400) {
        // Tokens are invalid/revoked, or the auth code was already consumed (400).
        // Strip the auth callback params first so the retry doesn't hit the token
        // endpoint again with the same dead code, causing an infinite loop.
        stripAuthParams();
        clearTokens();
        void connect(haUrl);
        return;
      }
      connected.value = false;
      if (e === ERR_HASS_HOST_REQUIRED) {
        error.value = 'Home Assistant URL is required';
        return;
      }
      error.value = e instanceof Error ? e.message : `Connection failed (code: ${String(e)})`;
      // e.g. the network or HA isn't up yet at boot. Keep trying.
      scheduleRetry(haUrl);
    }
  }

  function disconnect() {
    connectGen++;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;

    unsubscribeEntities?.();
    unsubscribeEntities = null;

    // Keep the ref-counted entries so mounted consumers are resubscribed on the next connection.
    for (const sub of forecastSubs.values()) {
      if (sub.unsubPromise) void sub.unsubPromise.then((unsub) => void unsub()).catch(() => {});
      sub.unsubPromise = null;
    }
    for (const id of Object.keys(weatherForecasts)) delete weatherForecasts[id];

    connection.value?.close();
    connection.value = null;
    connected.value = false;
    entitiesLoaded.value = false;
    clearStates();
  }

  function subscribeWeatherForecast(entityId: string, forecastType: ForecastType): void {
    const key = `${entityId}:${forecastType}`;

    const existing = forecastSubs.get(key);
    if (existing) {
      existing.refCount++;
      return;
    }

    // Not connected yet: resubscribeForecasts() picks the entry up once we are.
    const conn = connection.value;
    const unsubPromise = conn?.connected ? subscribeForecast(conn, entityId, forecastType) : null;
    forecastSubs.set(key, { entityId, forecastType, unsubPromise, refCount: 1 });
  }

  function unsubscribeWeatherForecast(entityId: string, forecastType: ForecastType): void {
    const key = `${entityId}:${forecastType}`;
    const sub = forecastSubs.get(key);
    if (!sub) return;

    sub.refCount--;
    if (sub.refCount > 0) return;

    if (sub.unsubPromise) void sub.unsubPromise.then((unsub) => void unsub()).catch(() => {});
    forecastSubs.delete(key);

    const entityForecasts = weatherForecasts[entityId];
    if (entityForecasts) {
      const rest = { ...entityForecasts };
      delete rest[forecastType];
      if (Object.keys(rest).length === 0) delete weatherForecasts[entityId];
      else weatherForecasts[entityId] = rest;
    }
  }

  async function callHassService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ) {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    // A tap is when a dead socket matters most: verify it now rather than at the next periodic
    // ping, so the status flips and reconnecting starts within seconds.
    void checkConnection();
    await callService(connection.value, domain, service, serviceData ?? {});
  }

  async function fireEvent(eventType: string, eventData?: Record<string, unknown>) {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    void checkConnection();
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

  /**
   * Not resubscribed automatically after a reconnect: callers re-subscribe when `connected` turns
   * true again (HAWS' own resubscription on top of theirs would double up).
   */
  function subscribeMessage<T>(
    callback: (msg: T) => void,
    message: { type: string; [key: string]: unknown },
  ): Promise<() => Promise<void>> {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    return connection.value.subscribeMessage<T>(callback, message, { resubscribe: false });
  }

  async function signPath(path: string, expires = 3600): Promise<string> {
    const result = await sendMessage<{ path: string }>({
      type: 'auth/sign_path',
      path,
      expires,
    });
    return `${hassUrl.value}${result.path}`;
  }

  /** Like subscribeMessage(): callers re-subscribe after a reconnect. */
  function subscribeHassEvents<T = unknown>(
    callback: (event: T) => void,
    eventType?: string,
  ): Promise<() => Promise<void>> {
    if (!connection.value) throw new Error('Not connected to Home Assistant');
    return connection.value.subscribeMessage<T>(
      callback,
      { type: 'subscribe_events', event_type: eventType },
      { resubscribe: false },
    );
  }

  // Liveness checks. The store lives as long as the app, so these are registered once.
  setInterval(() => void checkConnection(), PING_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    // Timers are throttled or frozen while the screen is off; check as soon as it's back.
    if (document.visibilityState !== 'visible') return;
    retryNow();
    void checkConnection();
  });
  window.addEventListener('online', () => {
    retryNow();
    void checkConnection();
  });
  window.addEventListener('offline', () => {
    // The socket can't be alive; drop it now so the status is accurate and HAWS starts retrying.
    const conn = connection.value;
    if (conn?.connected) conn.reconnect(true);
  });

  return {
    states,
    connected,
    entitiesLoaded,
    hassUrl,
    haVersion,
    error,
    weatherForecasts,
    connect,
    disconnect,
    clearTokens,
    callService: callHassService,
    fireEvent,
    sendMessage,
    signPath,
    subscribeMessage,
    subscribeHassEvents,
    subscribeWeatherForecast,
    unsubscribeWeatherForecast,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHomeAssistantStore, import.meta.hot));
}
