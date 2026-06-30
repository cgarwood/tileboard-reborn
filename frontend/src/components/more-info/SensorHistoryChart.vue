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
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { useHomeAssistantStore } from '../../stores/home-assistant';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

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

// Chart rendering
function formatLabel(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const chartData = computed(() => ({
  labels: points.value.map((p) => formatLabel(p.t)),
  datasets: [
    {
      data: points.value.map((p) => p.v),
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

const yMin = computed(() => {
  if (props.min !== undefined) return props.min;
  if (!points.value.length) return undefined;
  const min = Math.min(...points.value.map((p) => p.v));
  const max = Math.max(...points.value.map((p) => p.v));
  const pad = (max - min) * 0.15 || 1;
  return Math.floor(min - pad);
});

const yMax = computed(() => {
  if (props.max !== undefined) return props.max;
  if (!points.value.length) return undefined;
  const min = Math.min(...points.value.map((p) => p.v));
  const max = Math.max(...points.value.map((p) => p.v));
  const pad = (max - min) * 0.15 || 1;
  return Math.ceil(max + pad);
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: { y: number | null } }) =>
          ctx.parsed.y != null && props.unit
            ? `${ctx.parsed.y} ${props.unit}`
            : String(ctx.parsed.y ?? ''),
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: 'rgba(255,255,255,0.35)',
        maxTicksLimit: 6,
        maxRotation: 0,
        font: { size: 10 },
      },
      grid: { color: 'rgba(255,255,255,0.05)' },
      border: { display: false },
    },
    y: {
      min: yMin.value,
      max: yMax.value,
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
