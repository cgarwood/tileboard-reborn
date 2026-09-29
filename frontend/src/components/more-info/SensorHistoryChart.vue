<template>
  <div class="sensor-chart">
    <div v-if="loading" class="sensor-chart__loading">
      <q-spinner size="20px" color="white" />
    </div>
    <Line v-else-if="points.length > 1" :data="chartData" :options="chartOptions" />
    <div v-else class="sensor-chart__empty">No history available</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Decimation,
} from 'chart.js';
import { useHomeAssistantStore } from '../../stores/home-assistant';

ChartJS.register(LinearScale, PointElement, LineElement, Filler, Tooltip, Decimation);

interface HistoryPoint {
  t: number; // unix timestamp in seconds
  v: number;
}

const props = defineProps<{
  entityId: string;
  unit?: string;
  hours?: number;
  min?: number;
  max?: number;
}>();

const haStore = useHomeAssistantStore();
const historyHours = computed(() => props.hours ?? 24);

// History state
const points = ref<HistoryPoint[]>([]);
const loading = ref(false);

async function fetchHistory() {
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
    const raw = result[props.entityId] ?? [];
    points.value = raw
      .filter((p) => p.s !== 'unavailable' && p.s !== 'unknown' && !isNaN(parseFloat(p.s)))
      .map((p) => ({ t: p.lu, v: parseFloat(p.s) }));
  } catch (e) {
    console.error('[SensorHistoryChart] Failed to fetch history:', e);
  } finally {
    loading.value = false;
  }
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

onMounted(async () => {
  await fetchHistory();
  startLiveWatch();
});

onUnmounted(() => {
  stopLiveWatch?.();
});

// Chart rendering. The x axis is linear time (unix seconds), so only tick and tooltip labels are
// formatted, not every point, and Chart.js can decimate large histories to about 1 point per pixel.
const timeFormat = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' });

function formatLabel(ts: number): string {
  return timeFormat.format(ts * 1000);
}

/** Up to ~5 ticks on local whole hours (e.g. every 6 h at 12 AM, 6 AM, ... for a 24 h chart). */
function hourTicks(min: number, max: number): Array<{ value: number }> {
  const spanHours = (max - min) / 3600;
  const step = [1, 2, 3, 4, 6, 8, 12, 24].find((h) => spanHours / h <= 5) ?? 24;
  const d = new Date(min * 1000);
  d.setMinutes(0, 0, 0);
  while (d.getTime() / 1000 < min || d.getHours() % step !== 0) d.setHours(d.getHours() + 1);
  const ticks = [];
  for (; d.getTime() / 1000 <= max; d.setHours(d.getHours() + step)) {
    ticks.push({ value: d.getTime() / 1000 });
  }
  return ticks;
}

const chartData = computed(() => ({
  datasets: [
    {
      data: points.value.map((p) => ({ x: p.t, y: p.v })),
      borderColor: 'rgba(99, 179, 237, 0.85)',
      backgroundColor: 'rgba(99, 179, 237, 0.1)',
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: 'rgba(99, 179, 237, 1)',
      fill: true,
      tension: 0.3,
    },
  ],
}));

// One pass: Math.min(...values) is slow on long histories and throws past ~100k points.
const yRange = computed(() => {
  const pts = points.value;
  if (!pts.length) return { min: props.min, max: props.max };
  let min = Infinity;
  let max = -Infinity;
  for (const p of pts) {
    if (p.v < min) min = p.v;
    if (p.v > max) max = p.v;
  }
  const pad = (max - min) * 0.15 || 1;
  return { min: props.min ?? Math.floor(min - pad), max: props.max ?? Math.ceil(max + pad) };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // Required by the decimation plugin; data is already {x, y} numbers sorted by time.
  parsing: false as const,
  plugins: {
    legend: { display: false },
    decimation: { enabled: true, algorithm: 'lttb' as const },
    tooltip: {
      callbacks: {
        title: (items: Array<{ parsed: { x: number | null } }>) =>
          items[0]?.parsed.x != null ? formatLabel(items[0].parsed.x) : '',
        label: (ctx: { parsed: { y: number | null } }) =>
          ctx.parsed.y != null && props.unit
            ? `${ctx.parsed.y} ${props.unit}`
            : String(ctx.parsed.y ?? ''),
      },
    },
  },
  scales: {
    x: {
      type: 'linear' as const,
      bounds: 'data' as const,
      ticks: {
        color: 'rgba(255,255,255,0.35)',
        maxTicksLimit: 6,
        maxRotation: 0,
        font: { size: 10 },
        callback: (v: number | string) => formatLabel(Number(v)),
      },
      afterBuildTicks: (axis: { min: number; max: number; ticks: Array<{ value: number }> }) => {
        axis.ticks = hourTicks(axis.min, axis.max);
      },
      grid: { color: 'rgba(255,255,255,0.05)' },
      border: { display: false },
    },
    y: {
      min: yRange.value.min,
      max: yRange.value.max,
      ticks: {
        color: 'rgba(255,255,255,0.35)',
        maxTicksLimit: 5,
        font: { size: 10 },
        callback: (v: number | string) => (props.unit ? `${v}${props.unit}` : v),
      },
      grid: { color: 'rgba(255,255,255,0.07)' },
      border: { display: false },
    },
  },
  animation: { duration: 250 },
  interaction: { mode: 'index' as const, intersect: false },
}));
</script>

<style lang="scss" scoped>
.sensor-chart {
  height: 160px;
  position: relative;
  padding: 0 4px;

  &__loading,
  &__empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.3);
  }
}
</style>
