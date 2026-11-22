import { defineStore, acceptHMRUpdate } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useConfigStore } from './config';
import type { NotificationsConfig } from '../types/config';
import { getTileboardId } from '../utils/tileboardId';
import { serverConfigName } from '../utils/serverConfigs';

export type NotificationLevel = 'info' | 'warning' | 'critical';

export interface TileboardNotification {
  id: string;
  message: string;
  title?: string | undefined;
  level: NotificationLevel;
  icon?: string | undefined;
  /** Seconds the banner stays up (info/warning only). */
  duration?: number | undefined;
  time: number;
  read: boolean;
}

const STORAGE_KEY = 'tileboard:notifications';
const MAX_HISTORY = 50;
const DEFAULT_DURATION_S = 10;
const LEVELS: NotificationLevel[] = ['info', 'warning', 'critical'];

function loadHistory(): TileboardNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as TileboardNotification[]).slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

const DEFAULT_ICONS: Record<NotificationLevel, string> = {
  info: 'mdi-information-outline',
  warning: 'mdi-alert-outline',
  critical: 'mdi-alert-octagon',
};

/** The notification's own icon, or the default for its level. */
export function notificationIcon(n: TileboardNotification): string {
  return n.icon ?? DEFAULT_ICONS[n.level];
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

export const useNotificationsStore = defineStore('notifications', () => {
  const configStore = useConfigStore();

  /** Newest first. Saved on the tablet so a reload doesn't lose what arrived overnight. */
  const history = ref<TileboardNotification[]>(loadHistory());
  /** info/warning waiting for, or showing in, the banner. The first one is on screen. */
  const bannerQueue = ref<TileboardNotification[]>([]);
  /** critical notifications not yet dismissed. The first one is on screen. */
  const criticalQueue = ref<TileboardNotification[]>([]);

  const config = computed<NotificationsConfig | false>(() => {
    const value = configStore.config?.notifications as NotificationsConfig | false | undefined;
    return value === false ? false : (value ?? {});
  });
  const enabled = computed(() => config.value !== false);

  const banner = computed(() => bannerQueue.value[0] ?? null);
  const critical = computed(() => criticalQueue.value[0] ?? null);
  const unreadCount = computed(() => history.value.filter((n) => !n.read).length);

  watch(
    history,
    (list) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {
        // Storage full or unavailable: history just won't survive a reload
      }
    },
    { deep: true },
  );

  /**
   * Whether `target` (absent, a name, or a list of names) includes this tablet: its server config
   * name (`config/<name>`), the config's `id`, or its TileBoard ID (shown in Device Info).
   */
  function isTargeted(target: unknown): boolean {
    if (target == null || target === '') return true;
    const targets = (Array.isArray(target) ? target : [target]).map((t) => String(t).trim());
    const configId = configStore.config?.id;
    const mine = [
      serverConfigName(configStore.configUrl),
      typeof configId === 'string' ? configId : null,
      getTileboardId(),
    ].filter(Boolean);
    return targets.some((t) => mine.includes(t));
  }

  /** Handles a `notify` tileboard event. Returns false if it was ignored. */
  function receive(data: Record<string, unknown>): boolean {
    if (!enabled.value || !isTargeted(data.target)) return false;
    const message = str(data.message);
    const title = str(data.title);
    if (!message && !title) return false;

    const level = LEVELS.includes(data.level as NotificationLevel)
      ? (data.level as NotificationLevel)
      : 'info';
    const duration = Number(data.duration);
    const notification: TileboardNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: message ?? '',
      title,
      level,
      icon: str(data.icon),
      duration: duration > 0 ? duration : undefined,
      time: Date.now(),
      read: false,
    };

    history.value = [notification, ...history.value].slice(0, MAX_HISTORY);
    if (level === 'critical') criticalQueue.value.push(notification);
    else bannerQueue.value.push(notification);
    return true;
  }

  function bannerDuration(n: TileboardNotification): number {
    const configured = config.value === false ? undefined : config.value.duration;
    return (n.duration ?? configured ?? DEFAULT_DURATION_S) * 1000;
  }

  function markRead(id: string) {
    const n = history.value.find((h) => h.id === id);
    if (n) n.read = true;
  }

  /** Takes the banner down. `seen` marks it read (it was tapped, not just timed out). */
  function hideBanner(seen: boolean) {
    const n = bannerQueue.value.shift();
    if (n && seen) markRead(n.id);
  }

  function dismissCritical() {
    const n = criticalQueue.value.shift();
    if (n) markRead(n.id);
  }

  function markAllRead() {
    for (const n of history.value) n.read = true;
  }

  function clearHistory() {
    history.value = [];
  }

  return {
    history,
    banner,
    critical,
    criticalCount: computed(() => criticalQueue.value.length),
    unreadCount,
    enabled,
    receive,
    bannerDuration,
    hideBanner,
    dismissCritical,
    markAllRead,
    clearHistory,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot));
}
