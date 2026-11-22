import { defineStore, acceptHMRUpdate } from 'pinia';
import { Notify } from 'quasar';
import { computed, ref, shallowRef, watch } from 'vue';
import { useConfigStore } from './config';
import { useHomeAssistantStore } from './home-assistant';
import { useSendspinStore } from './sendspin';

/**
 * Where an issue came from. `config` and `template` issues are about the loaded config and are
 * cleared when it reloads; the rest describe something that happened at runtime.
 */
export type IssueSource =
  | 'config'
  | 'template'
  | 'action'
  | 'homeassistant'
  | 'sendspin'
  | 'resource'
  | 'screensaver'
  | 'events';

export type IssueLevel = 'error' | 'warning';

export interface Issue {
  /** Repeats of the same key are ignored, so an error hit on every render is listed once. */
  key: string;
  source: IssueSource;
  level: IssueLevel;
  message: string;
  /** Extra text shown under the message, e.g. the template that failed. */
  detail?: string | undefined;
  time: number;
}

export interface ReportOptions {
  level?: IssueLevel;
  detail?: string | undefined;
  /** Dedupe key. Defaults to source + message + detail. */
  key?: string;
  /**
   * Also show a toast. Only for failures of something the user just did (a tap, a menu item), so a
   * wall display isn't covered in pop-ups for background problems.
   */
  notify?: boolean;
}

/** A readable message for anything thrown, including HA's `{ code, message }` rejections. */
export function describeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String(e.message);
  return String(e);
}

const MAX_ISSUES = 50;
const CONFIG_SOURCES: IssueSource[] = ['config', 'template'];
// A connection has to stay down this long before it's listed, so brief reconnects don't flash it
const CONNECTION_GRACE_MS = 10_000;

export const useIssuesStore = defineStore('issues', () => {
  // Newest first. Replaced, not mutated, so readers re-render once per flush.
  const logged = shallowRef<Issue[]>([]);
  const seen = new Set<string>();
  // Reports are often made while a computed is evaluating (template errors). Changing reactive
  // state there would re-trigger renders, so they're queued and added after the current tick.
  let queue: Issue[] = [];
  let flushScheduled = false;

  function flush() {
    flushScheduled = false;
    if (!queue.length) return;
    const next = [...queue.reverse(), ...logged.value];
    queue = [];
    for (const dropped of next.splice(MAX_ISSUES)) seen.delete(dropped.key);
    logged.value = next;
  }

  function report(source: IssueSource, message: string, options: ReportOptions = {}) {
    const { level = 'error', detail, notify = false } = options;
    if (notify) {
      Notify.create({
        type: level === 'error' ? 'negative' : 'warning',
        message,
        caption: detail,
        // Top: the bottom edge has the page navigation bar and weather alerts
        position: 'top',
        timeout: 4000,
      });
    }
    const key = options.key ?? `${source}\n${message}\n${detail ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ key, source, level, message, detail, time: Date.now() });
    if (!flushScheduled) {
      flushScheduled = true;
      queueMicrotask(flush);
    }
  }

  function clear(sources?: IssueSource[]) {
    flush();
    const keep = sources ? logged.value.filter((i) => !sources.includes(i.source)) : [];
    for (const issue of logged.value) if (!keep.includes(issue)) seen.delete(issue.key);
    logged.value = keep;
  }

  // ── Live conditions: listed while they last, gone once resolved ───────────────────────────
  const haStore = useHomeAssistantStore();
  const sendspinStore = useSendspinStore();
  const configStore = useConfigStore();

  const haDown = useSustained(() => !!configStore.config && !haStore.connected);
  const sendspinDown = useSustained(
    () => !!configStore.config?.sendspin && !sendspinStore.connected,
  );

  const live = computed<Issue[]>(() => {
    const issues: Issue[] = [];
    if (haDown.value) {
      issues.push({
        key: 'live:homeassistant',
        source: 'homeassistant',
        level: 'error',
        message: 'Not connected to Home Assistant',
        detail:
          haStore.error ?? (haStore.hassUrl ? `Reconnecting to ${haStore.hassUrl}` : undefined),
        time: haDown.since,
      });
    }
    if (sendspinDown.value) {
      issues.push({
        key: 'live:sendspin',
        source: 'sendspin',
        level: 'warning',
        message: 'Not connected to Sendspin',
        detail: sendspinStore.connecting ? 'Reconnecting…' : undefined,
        time: sendspinDown.since,
      });
    }
    return issues;
  });

  const issues = computed(() => [...live.value, ...logged.value]);
  const errorCount = computed(() => issues.value.filter((i) => i.level === 'error').length);

  // Issues about the old config don't apply to a newly loaded one
  watch(
    () => configStore.version,
    () => clear(CONFIG_SOURCES),
  );

  return { issues, errorCount, report, clear };
});

/** True once `condition` has held for CONNECTION_GRACE_MS; `since` is when it started holding. */
function useSustained(condition: () => boolean) {
  const value = ref(false);
  const state = { since: 0 };
  let timer: ReturnType<typeof setTimeout> | null = null;
  watch(
    condition,
    (holds) => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (!holds) {
        value.value = false;
        return;
      }
      state.since = Date.now();
      timer = setTimeout(() => (value.value = true), CONNECTION_GRACE_MS);
    },
    { immediate: true },
  );
  return {
    get value() {
      return value.value;
    },
    get since() {
      return state.since;
    },
  };
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useIssuesStore, import.meta.hot));
}
