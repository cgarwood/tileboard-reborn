<template>
  <div
    class="sensor-widget-chart"
    :class="{ 'sensor-widget-chart--visible': !loading && displayPoints.length > 1 }"
  >
    <svg
      v-if="paths"
      class="sensor-widget-chart__svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path :d="paths.area" :fill="lineColor" fill-opacity="0.6" />
      <path
        :d="paths.line"
        fill="none"
        :stroke="lineColor"
        stroke-opacity="0.9"
        stroke-width="3.5"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import { useHomeAssistantStore } from '../../stores/home-assistant';

interface HistoryPoint {
  t: number;
  v: number;
}

const props = defineProps<{
  entityId: string;
  hours?: number;
  min?: number;
  max?: number;
  smoothing?: number;
  color?: string;
}>();

const haStore = useHomeAssistantStore();
const historyHours = computed(() => props.hours ?? 24);
const tension = computed(() => Math.min(props.smoothing ?? 0.3, 1));

const points = ref<HistoryPoint[]>([]);
const loading = ref(false);

// Incremented per fetch so a slow response from before a reconnect can't overwrite a newer one.
let fetchSeq = 0;
let disposed = false;

/** Returns false if superseded by a newer fetch or the component unmounted meanwhile. */
async function fetchHistory(): Promise<boolean> {
  const seq = ++fetchSeq;
  loading.value = true;
  try {
    const startTime = new Date(Date.now() - historyHours.value * 3_600_000).toISOString();
    const result = await haStore.sendMessage<Record<string, Array<{ s: string; lu: number }>>>({
      type: 'history/history_during_period',
      entity_ids: [props.entityId],
      start_time: startTime,
      significant_changes_only: false,
      no_attributes: true,
      minimal_response: true,
    });
    if (seq !== fetchSeq || disposed) return false;
    const raw = result[props.entityId] ?? [];
    points.value = raw
      .filter((p) => p.s !== 'unavailable' && p.s !== 'unknown' && !isNaN(parseFloat(p.s)))
      .map((p) => ({ t: p.lu, v: parseFloat(p.s) }));
  } catch {
    // silently ignore — widget chart is decorative
  } finally {
    if (seq === fetchSeq) loading.value = false;
  }
  return seq === fetchSeq && !disposed;
}

let stopLiveWatch: (() => void) | null = null;

function startLiveWatch() {
  stopLiveWatch?.();
  stopLiveWatch = watch(
    () => haStore.states[props.entityId]?.last_updated,
    () => {
      const e = haStore.states[props.entityId];
      if (!e) return;
      const v = parseFloat(e.state);
      if (isNaN(v)) return;
      const t = new Date(e.last_updated).getTime() / 1000;
      const last = points.value[points.value.length - 1];
      if (last && last.t >= t) return;
      const cutoff = Date.now() / 1000 - historyHours.value * 3600;
      points.value = [...points.value.filter((p) => p.t >= cutoff), { t, v }];
    },
  );
}

// Load once connected: widgets can mount before the HA connection is up. Refetching after a
// reconnect also fills any gap in the live data; the old points stay visible until it lands.
watch(
  () => haStore.connected,
  async (connected) => {
    stopLiveWatch?.();
    stopLiveWatch = null;
    if (!connected) return;
    if (await fetchHistory()) startLiveWatch();
  },
  { immediate: true },
);

onUnmounted(() => {
  disposed = true;
  stopLiveWatch?.();
});

function meanDownsample(data: HistoryPoint[], target: number): HistoryPoint[] {
  if (data.length <= target) return data;
  const bucketSize = data.length / target;
  return Array.from({ length: target }, (_, i) => {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);
    const bucket = data.slice(start, end);
    return {
      t: bucket.reduce((s, p) => s + p.t, 0) / bucket.length,
      v: bucket.reduce((s, p) => s + p.v, 0) / bucket.length,
    };
  });
}

const displayPoints = computed(() => {
  const p = points.value;
  if (tension.value <= 0) return p;
  const target = Math.max(8, Math.round(12 / tension.value));
  if (p.length <= target) return p;
  return meanDownsample(p, target);
});

// SVG accepts any CSS color, including var(--foo), so nothing needs resolving.
const lineColor = computed(() => props.color?.trim() || '#fff');

// Auto-range to the plotted (downsampled) points, padded 15%.
const yRange = computed(() => {
  const pts = displayPoints.value;
  let min = Infinity;
  let max = -Infinity;
  for (const p of pts) {
    if (p.v < min) min = p.v;
    if (p.v > max) max = p.v;
  }
  const pad = (max - min) * 0.15 || 1;
  return { min: props.min ?? min - pad, max: props.max ?? max + pad };
});

/**
 * Line and fill paths in a 100x100 viewBox (stretched to the element). Points are evenly spaced
 * and joined with monotone cubic curves (Fritsch-Carlson), which never overshoot the data.
 */
const paths = computed(() => {
  const pts = displayPoints.value;
  const n = pts.length;
  if (n < 2) return null;
  const { min, max } = yRange.value;
  const range = max - min || 1;
  const x = pts.map((_, i) => (i / (n - 1)) * 100);
  const y = pts.map((p) => (1 - (p.v - min) / range) * 100);

  // Secant slopes, then tangents limited so each segment stays monotone.
  const d = Array.from({ length: n - 1 }, (_, i) => (y[i + 1]! - y[i]!) / (x[i + 1]! - x[i]!));
  const m = y.map((_, i) => {
    if (i === 0) return d[0]!;
    if (i === n - 1) return d[n - 2]!;
    return d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i]! / d[i]!;
    const b = m[i + 1]! / d[i]!;
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i]!;
      m[i + 1] = t * b * d[i]!;
    }
  }

  const f = (v: number) => v.toFixed(2);
  let line = `M${f(x[0]!)},${f(y[0]!)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (x[i + 1]! - x[i]!) / 3;
    line +=
      `C${f(x[i]! + dx)},${f(y[i]! + m[i]! * dx)} ` +
      `${f(x[i + 1]! - dx)},${f(y[i + 1]! - m[i + 1]! * dx)} ${f(x[i + 1]!)},${f(y[i + 1]!)}`;
  }
  // Fill down to zero, or to the bottom edge when zero is below the visible range.
  const base = f(Math.min(100, Math.max(0, (1 - (0 - min) / range) * 100)));
  return { line, area: `${line}L100,${base}L0,${base}Z` };
});
</script>

<style lang="scss" scoped>
.sensor-widget-chart {
  position: absolute;
  bottom: -2px;
  left: -2px;
  right: -2px;
  height: 55%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;

  &--visible {
    opacity: 1;
  }

  &__svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
