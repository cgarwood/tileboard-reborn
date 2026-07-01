<template>
  <div
    class="sensor-widget-chart"
    :class="{ 'sensor-widget-chart--visible': !loading && displayPoints.length > 1 }"
  >
    <Line v-if="displayPoints.length > 1" :data="chartData" :options="chartOptions" />
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
} from 'chart.js';
import { useHomeAssistantStore } from '../../stores/home-assistant';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

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

function resolveCssColor(color: string): string {
  if (!color.includes('var(')) return color;
  const el = document.createElement('div');
  el.style.color = color;
  document.body.appendChild(el);
  const resolved = getComputedStyle(el).color;
  document.body.removeChild(el);
  return resolved || color;
}

function colorWithAlpha(color: string | undefined, alpha: number): string {
  if (!color) return `rgba(255,255,255,${alpha})`;
  const resolved = resolveCssColor(color.trim());
  if (/^#[0-9a-fA-F]{6}$/.test(resolved)) {
    const r = parseInt(resolved.slice(1, 3), 16);
    const g = parseInt(resolved.slice(3, 5), 16);
    const b = parseInt(resolved.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (/^rgb\(/.test(resolved)) {
    return resolved.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  }
  if (/^rgba\(/.test(resolved)) {
    return resolved.replace(/,\s*[\d.]+\)$/, `,${alpha})`);
  }
  return resolved;
}

const haStore = useHomeAssistantStore();
const historyHours = computed(() => props.hours ?? 24);
const tension = computed(() => Math.min(props.smoothing ?? 0.3, 1));

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
  } catch {
    // silently ignore — widget chart is decorative
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

const chartData = computed(() => ({
  labels: displayPoints.value.map(() => ''),
  datasets: [
    {
      data: displayPoints.value.map((p) => p.v),
      borderColor: colorWithAlpha(props.color, 0.9),
      backgroundColor: colorWithAlpha(props.color, 0.6),
      borderWidth: 3.5,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: true,
      cubicInterpolationMode: 'monotone' as const,
    },
  ],
}));

const yMin = computed(() => {
  if (props.min !== undefined) return props.min;
  if (!points.value.length) return undefined;
  const vals = points.value.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.15 || 1;
  return min - pad;
});

const yMax = computed(() => {
  if (props.max !== undefined) return props.max;
  if (!points.value.length) return undefined;
  const vals = points.value.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.15 || 1;
  return max + pad;
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  events: [] as never[],
  animation: false as const,
  layout: { padding: 0 },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: { display: false },
    y: {
      display: false,
      min: yMin.value,
      max: yMax.value,
    },
  },
}));
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

  :deep(canvas) {
    display: block;
  }
}
</style>
