<template>
  <div ref="rootEl" class="menu-slide">
    <q-icon
      v-if="day === 'tomorrow'"
      name="mdi-arrow-right-bold-circle-outline"
      class="menu-slide__arrow-watermark"
    />
    <div class="menu-slide__header">{{ day === 'today' ? "Today's Menu" : "Tomorrow's Menu" }}</div>
    <div class="menu-slide__title">{{ title }}</div>
    <div class="menu-slide__date">{{ longDateFormat.format(date) }}</div>
    <div
      ref="sectionsEl"
      class="menu-slide__sections"
      :class="{
        'menu-slide__sections--grid': menu.sections.length > 3,
        'menu-slide__sections--clipped': clipped,
      }"
      :style="{ fontSize: `${fit.size}rem` }"
    >
      <div v-for="section in menu.sections" :key="section.name" class="menu-slide__card">
        <MenuDayView :menu="{ sections: [section] }" :extras="fit.extras" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import MenuDayView from '../menu/MenuDayView.vue';
import type { MenuDay } from '../../types/menu';
import { longDateFormat } from '../../utils/formatters';

const props = defineProps<{
  title: string;
  day: 'today' | 'tomorrow';
  date: Date;
  menu: MenuDay;
}>();

// Fit steps, largest first. The cards shrink until the sections fit the space
// between the date and the clock; dropping the sides is the last resort.
const FIT_STEPS = [
  { size: 1.15, extras: true },
  { size: 1.05, extras: true },
  { size: 0.95, extras: true },
  { size: 0.875, extras: true },
  { size: 0.8, extras: true },
  { size: 0.8, extras: false },
] as const;

const rootEl = ref<HTMLElement | null>(null);
const sectionsEl = ref<HTMLElement | null>(null);
const step = ref(0);
// Still overflowing at the last step: fade the bottom out instead of hard-cutting.
const clipped = ref(false);
const fit = computed(() => FIT_STEPS[step.value]!);

function overflows(): boolean {
  const el = sectionsEl.value;
  return !!el && el.scrollHeight > el.clientHeight + 1;
}

let fitRun = 0;

async function refit() {
  const run = ++fitRun;
  step.value = 0;
  clipped.value = false;
  await nextTick();
  while (run === fitRun && overflows() && step.value < FIT_STEPS.length - 1) {
    step.value++;
    await nextTick();
  }
  if (run === fitRun) clipped.value = overflows();
}

watch(() => props.menu, refit, { deep: true });

// The root's content box shrinks when the clock space (its bottom padding)
// changes, as well as on screen resize, so watching it covers both.
let observer: ResizeObserver | null = null;
onMounted(() => {
  observer = new ResizeObserver(() => void refit());
  if (rootEl.value) observer.observe(rootEl.value);
  void refit();
});
onUnmounted(() => observer?.disconnect());
</script>

<style lang="scss" scoped>
.menu-slide {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, rgba(10, 22, 40, 0.72) 0%, rgba(22, 32, 50, 0.72) 100%),
    var(--slide-bg, none) center / cover no-repeat;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: clamp(16px, 5vh, 40px) 40px var(--screensaver-clock-space, 30vh);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  user-select: none;
  overflow: hidden;
}

.menu-slide {
  &__arrow-watermark {
    position: absolute;
    bottom: -180px;
    left: -180px;
    font-size: 980px;
    opacity: 0.08;
    pointer-events: none;
  }

  &__header,
  &__title,
  &__date {
    flex-shrink: 0;
  }

  &__header {
    font-size: 1.4rem;
    font-weight: 300;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.55;
  }

  &__title {
    font-size: 2rem;
    font-weight: 500;
  }

  &__date {
    font-size: 1.1rem;
    opacity: 0.6;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  // Takes whatever height is left (and no more), so overflow is measurable
  // and never pushes the header off the top.
  &__sections {
    flex: 0 1 auto;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.6em;
    width: min(700px, 100%);

    &--grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-content: start;
      width: min(1100px, 100%);
    }

    &--clipped {
      mask-image: linear-gradient(to bottom, #000 calc(100% - 3em), transparent);
    }
  }

  &__card {
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 0.6em 1.1em;
  }
}

// Portrait: two columns are too narrow, so stack every section; the fit steps handle height.
:root.layout--portrait {
  .menu-slide {
    padding-left: 24px;
    padding-right: 24px;
  }

  .menu-slide__sections--grid {
    grid-template-columns: minmax(0, 1fr);
    width: min(700px, 100%);
  }
}
</style>
