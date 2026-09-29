import { computed, effectScope, onScopeDispose, ref, shallowRef, watch } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';

export interface HistoryPoint {
  t: number; // unix seconds
  v: number;
}

/**
 * Bucketed history for one entity: the window is split into fixed-length time buckets, each
 * holding a running sum and count. Live states update one bucket in place, so nothing is
 * re-downsampled when a new state arrives.
 */
interface Series {
  key: string;
  entityId: string;
  buckets: number;
  duration: number; // bucket length, seconds
  first: number; // bucket index (unix seconds / duration) of sums[0]
  sums: Float64Array;
  counts: Uint32Array;
  carry: number | undefined; // last value before the window, for leading empty buckets
  lastT: number;
  points: ShallowRef<HistoryPoint[]>;
  loading: Ref<boolean>;
  users: number;
  evictTimer: ReturnType<typeof setTimeout> | null;
  seq: number;
  stop: () => void;
}

// Keep a series alive (and live-updating) this long after its last chart unmounts, so switching
// pages and back doesn't refetch.
const EVICT_AFTER_MS = 10 * 60_000;

// 5-minute statistics are compiled shortly after each period ends; raw history covers the rest.
const RAW_TAIL_S = 20 * 60;

const cache = new Map<string, Series>();

type HaStore = ReturnType<typeof useHomeAssistantStore>;
let haStore: HaStore | null = null;

function parseValue(s: string): number | null {
  if (s === 'unavailable' || s === 'unknown') return null;
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

function reset(series: Series, now: number) {
  series.first = Math.floor(now / series.duration) - series.buckets + 1;
  series.sums.fill(0);
  series.counts.fill(0);
  series.carry = undefined;
  series.lastT = 0;
}

function addPoint(series: Series, t: number, v: number) {
  const k = Math.floor(t / series.duration);
  const last = series.first + series.buckets - 1;
  if (k < series.first) {
    series.carry = v;
    return;
  }
  if (k > last) {
    // Slide the window forward; remember the newest value that falls out of it.
    const shift = k - last;
    const dropped = Math.min(shift, series.buckets);
    for (let i = dropped - 1; i >= 0; i--) {
      if (series.counts[i]) {
        series.carry = series.sums[i]! / series.counts[i]!;
        break;
      }
    }
    if (shift >= series.buckets) {
      series.sums.fill(0);
      series.counts.fill(0);
    } else {
      series.sums.copyWithin(0, shift);
      series.counts.copyWithin(0, shift);
      series.sums.fill(0, series.buckets - shift);
      series.counts.fill(0, series.buckets - shift);
    }
    series.first += shift;
  }
  const i = k - series.first;
  series.sums[i]! += v;
  series.counts[i]!++;
  if (t > series.lastT) series.lastT = t;
}

/** Bucket means, oldest first. Empty buckets repeat the previous value (the state held). */
function publish(series: Series) {
  const out: HistoryPoint[] = [];
  let value = series.carry;
  for (let i = 0; i < series.buckets; i++) {
    if (series.counts[i]) value = series.sums[i]! / series.counts[i]!;
    if (value === undefined) continue;
    out.push({ t: (series.first + i + 0.5) * series.duration, v: value });
  }
  series.points.value = out;
}

async function fetchRaw(entityId: string, startS: number): Promise<HistoryPoint[]> {
  const result = await haStore!.sendMessage<Record<string, Array<{ s: string; lu: number }>>>({
    type: 'history/history_during_period',
    entity_ids: [entityId],
    start_time: new Date(startS * 1000).toISOString(),
    significant_changes_only: false,
    no_attributes: true,
    minimal_response: true,
  });
  const out: HistoryPoint[] = [];
  for (const p of result[entityId] ?? []) {
    const v = parseValue(p.s);
    if (v !== null) out.push({ t: p.lu, v });
  }
  return out;
}

/**
 * 5-minute means from the recorder (288 rows per 24 h, precomputed by HA) plus raw history for
 * the minutes not compiled yet. Null when statistics aren't usable for this entity.
 */
async function fetchStatistics(entityId: string, startS: number): Promise<HistoryPoint[] | null> {
  const now = Date.now() / 1000;
  const [stats, meta, tail] = await Promise.all([
    haStore!.sendMessage<Record<string, Array<{ start: number; end: number; mean: number | null }>>>({
      type: 'recorder/statistics_during_period',
      start_time: new Date(startS * 1000).toISOString(),
      statistic_ids: [entityId],
      period: '5minute',
      types: ['mean'],
    }),
    haStore!.sendMessage<Array<{ statistics_unit_of_measurement: string | null }>>({
      type: 'recorder/get_statistics_metadata',
      statistic_ids: [entityId],
    }),
    fetchRaw(entityId, now - RAW_TAIL_S),
  ]);
  const rows = stats[entityId] ?? [];
  // Statistics are stored in the unit at compile time; skip them if the entity's unit changed.
  const unit = haStore!.states[entityId]?.attributes.unit_of_measurement ?? null;
  if (!rows.length || (meta[0]?.statistics_unit_of_measurement ?? null) !== unit) return null;

  const out: HistoryPoint[] = [];
  let statsEnd = 0;
  for (const r of rows) {
    if (r.mean == null) continue;
    out.push({ t: (r.start + r.end) / 2000, v: r.mean });
    statsEnd = r.end / 1000;
  }
  for (const p of tail) if (p.t >= statsEnd) out.push(p);
  return out;
}

async function load(series: Series) {
  const seq = ++series.seq;
  series.loading.value = true;
  try {
    const now = Date.now() / 1000;
    const windowStart = (Math.floor(now / series.duration) - series.buckets + 1) * series.duration;
    const stateClass = haStore!.states[series.entityId]?.attributes.state_class;
    const points =
      (stateClass === 'measurement' ? await fetchStatistics(series.entityId, windowStart) : null) ??
      (await fetchRaw(series.entityId, windowStart));
    if (seq !== series.seq) return;
    reset(series, now);
    for (const p of points) addPoint(series, p.t, p.v);
    publish(series);
  } catch {
    // Decorative; keep whatever was shown before.
  } finally {
    if (seq === series.seq) series.loading.value = false;
  }
}

function createSeries(key: string, entityId: string, hours: number, buckets: number): Series {
  const series: Series = {
    key,
    entityId,
    buckets,
    duration: (hours * 3600) / buckets,
    first: 0,
    sums: new Float64Array(buckets),
    counts: new Uint32Array(buckets),
    carry: undefined,
    lastT: 0,
    points: shallowRef([]),
    loading: ref(true),
    users: 0,
    evictTimer: null,
    seq: 0,
    stop: () => {},
  };

  // Detached from any component so the series outlives the chart that created it.
  const scope = effectScope(true);
  scope.run(() => {
    // (Re)load once connected and entities are in (state_class decides statistics vs raw history).
    // Charts can mount before that, and a reload after a reconnect fills the gap. Live updates
    // wait until the history has landed.
    watch(
      () => haStore!.connected && haStore!.entitiesLoaded,
      (ready) => {
        if (ready) void load(series);
      },
      { immediate: true },
    );
    watch(
      () => haStore!.states[entityId]?.last_updated,
      () => {
        if (series.loading.value) return;
        const e = haStore!.states[entityId];
        const v = e ? parseValue(e.state) : null;
        if (v === null) return;
        const t = new Date(e!.last_updated).getTime() / 1000;
        if (t <= series.lastT) return;
        addPoint(series, t, v);
        publish(series);
      },
    );
  });
  series.stop = () => {
    series.seq++;
    scope.stop();
  };
  return series;
}

/**
 * Time-bucketed numeric history for a sensor, shared between charts with the same
 * (entity, hours, buckets) and cached briefly after the last one unmounts.
 */
export function useSensorHistory(
  entityId: () => string,
  hours: () => number,
  buckets: () => number,
) {
  haStore ??= useHomeAssistantStore();
  const current = shallowRef<Series | null>(null);

  function release(series: Series | null) {
    if (!series || --series.users > 0) return;
    series.evictTimer = setTimeout(() => {
      series.stop();
      cache.delete(series.key);
    }, EVICT_AFTER_MS);
  }

  watch(
    () => `${entityId()}|${hours()}|${buckets()}`,
    (key) => {
      release(current.value);
      let series = cache.get(key);
      if (!series) {
        series = createSeries(key, entityId(), hours(), buckets());
        cache.set(key, series);
      }
      if (series.evictTimer) {
        clearTimeout(series.evictTimer);
        series.evictTimer = null;
      }
      series.users++;
      current.value = series;
    },
    { immediate: true },
  );

  onScopeDispose(() => release(current.value));

  return {
    points: computed(() => current.value?.points.value ?? []),
    loading: computed(() => current.value?.loading.value ?? true),
  };
}
