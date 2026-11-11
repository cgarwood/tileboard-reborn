<template>
  <div class="menu-slide">
    <q-icon
      v-if="day === 'tomorrow'"
      name="mdi-arrow-right-bold-circle-outline"
      class="menu-slide__arrow-watermark"
    />
    <div class="menu-slide__header">{{ day === 'today' ? "Today's Menu" : "Tomorrow's Menu" }}</div>
    <div class="menu-slide__title">{{ title }}</div>
    <div class="menu-slide__date">{{ longDateFormat.format(date) }}</div>
    <div
      class="menu-slide__sections"
      :class="{ 'menu-slide__sections--grid': menu.sections.length > 3 }"
    >
      <div v-for="section in menu.sections" :key="section.name" class="menu-slide__card">
        <MenuDayView :menu="{ sections: [section] }" extras />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MenuDayView from '../menu/MenuDayView.vue';
import type { MenuDay } from '../../types/menu';
import { longDateFormat } from '../../utils/formatters';

defineProps<{
  title: string;
  day: 'today' | 'tomorrow';
  date: Date;
  menu: MenuDay;
}>();
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
  padding: 40px 40px 30vh;
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
    margin-bottom: 16px;
  }

  &__sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(700px, 100%);

    &--grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: min(1100px, 100%);
    }
  }

  &__card {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 12px 20px;
    font-size: 1.15rem;
  }
}
</style>
