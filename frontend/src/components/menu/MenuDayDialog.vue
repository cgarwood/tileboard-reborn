<template>
  <q-dialog v-model="dialogOpen" @hide="emit('hide')">
    <q-card class="menu-dialog">
      <div class="menu-dialog__header">
        <div class="menu-dialog__heading">
          <div class="menu-dialog__title ellipsis">{{ title }}</div>
          <div class="menu-dialog__date">{{ dateLabel }}</div>
        </div>
        <q-btn flat round dense icon="mdi-close" color="white" @click="dialogOpen = false" />
      </div>

      <div class="menu-dialog__content">
        <MenuDayView v-if="menu" :menu="menu" extras />
        <div v-else class="menu-dialog__empty">No menu</div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import MenuDayView from './MenuDayView.vue';
import type { MenuDay } from '../../types/menu';
import { longDateFormat } from '../../utils/formatters';

const props = defineProps<{
  title: string;
  day: 'today' | 'tomorrow';
  date: Date;
  menu: MenuDay | null;
}>();

const emit = defineEmits<{ hide: [] }>();

const dialogOpen = ref(true);

const dateLabel = computed(
  () => `${props.day === 'today' ? 'Today' : 'Tomorrow'} · ${longDateFormat.format(props.date)}`,
);
</script>

<style lang="scss" scoped>
.menu-dialog {
  width: min(520px, 95vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #1e1e2e;
  color: #fff;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 12px 16px 20px;
    background: rgba(255, 255, 255, 0.06);
    min-height: 64px;
    flex-shrink: 0;
  }

  &__heading {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 500;
  }

  &__date {
    font-size: 0.8rem;
    opacity: 0.6;
  }

  &__content {
    padding: 16px 20px;
    overflow-y: auto;
    font-size: 1rem;

    .menu-day {
      gap: 14px;
    }
  }

  &__empty {
    opacity: 0.6;
    text-align: center;
    padding: 16px 0;
  }
}
</style>
