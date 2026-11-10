<template>
  <div class="menu-day">
    <div v-for="section in menu.sections" :key="section.name" class="menu-day__section">
      <div class="menu-day__name">{{ section.name }}</div>
      <div class="menu-day__main">{{ section.main.join(' · ') }}</div>
      <div v-if="extras && section.extra.length" class="menu-day__extra">
        {{ section.extra.join(' · ') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuDay } from '../../types/menu';

defineProps<{
  menu: MenuDay;
  /** Also list each section's sides and toppings. */
  extras?: boolean;
}>();
</script>

<style lang="scss" scoped>
// Sizes are in em so the widget, dialog and screensaver slide can scale it with font-size.
.menu-day {
  display: flex;
  flex-direction: column;
  gap: 0.6em;

  &__section {
    min-width: 0;
  }

  &__name {
    font-size: 0.7em;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.6;
  }

  &__main {
    font-size: 1em;
    line-height: 1.3;
  }

  &__extra {
    font-size: 0.8em;
    line-height: 1.3;
    opacity: 0.6;
    margin-top: 0.15em;
  }
}
</style>
