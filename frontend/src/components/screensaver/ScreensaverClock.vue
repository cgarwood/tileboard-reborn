<template>
  <div class="screensaver-clock">
    <div class="clock-time">
      <template v-for="part in timeParts.mainParts" :key="part.type">
        <span v-if="part.type === 'literal'" class="clock-colon">{{ part.value }}</span>
        <template v-else>{{ part.value }}</template>
      </template>
      <span class="clock-ampm">{{ timeParts.period }}</span>
    </div>
    <div class="clock-date">{{ date }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const now = ref(new Date());
let intervalId: ReturnType<typeof setInterval>;

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});

const timeParts = computed(() => {
  const parts = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).formatToParts(
    now.value,
  );
  const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  const mainParts = parts.filter((p) => p.type !== 'dayPeriod' && p.value.trim() !== '');
  return { mainParts, period };
});

const date = computed(() =>
  now.value.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
);
</script>

<style lang="scss" scoped>
.screensaver-clock {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #fff;
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.9),
    0 4px 40px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  user-select: none;
  font-family: 'Source Sans Pro';
}

.clock-time {
  /*font-size: 8rem;*/
  font-size: 128px;
  font-weight: 700;
  line-height: 1;
}

.clock-colon {
  animation: colon-blink 3s ease-in-out infinite;
  font-size: 128px;
  padding: 10px;
}

@keyframes colon-blink {
  0%,
  35% {
    opacity: 1;
  }
  65% {
    opacity: 0.05;
  }
  100% {
    opacity: 1;
  }
}

.clock-ampm {
  font-size: 4.5rem;
  font-weight: 500;
  margin-left: 0.35rem;
}

.clock-date {
  font-size: 3rem;
  font-weight: 500;
  margin-top: 0px;
  line-height: 1;
}
</style>
