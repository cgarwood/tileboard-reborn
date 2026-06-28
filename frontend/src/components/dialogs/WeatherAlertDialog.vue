<template>
  <q-dialog v-model="dialogOpen" @hide="emit('hide')">
    <q-card class="weather-alert-dialog">
      <q-toolbar :class="alertClass(alert.event)" class="weather-alert-dialog__toolbar">
        <q-icon
          :name="weatherStore.weatherAlertIconMap[alert.event] ?? 'mdi-alert'"
          size="28px"
          class="q-mr-sm animation-pulsate self-center"
        />
        <q-toolbar-title>
          <div class="weather-alert-dialog__title">{{ alert.event }}</div>
          <div class="weather-alert-dialog__expires text-caption">
            Expires {{ formatExpiry(alert.expires) }}
          </div>
        </q-toolbar-title>
      </q-toolbar>

      <q-scroll-area class="weather-alert-dialog__scroll">
        <q-card-section v-if="alert.headline" class="weather-alert-dialog__headline">
          {{ alert.headline }}
        </q-card-section>

        <q-separator v-if="alert.description" />

        <q-card-section v-if="alert.description">
          <div class="alert-text">{{ alert.description }}</div>
        </q-card-section>

        <template v-if="alert.instruction">
          <q-separator />
          <q-card-section>
            <div class="alert-text">{{ alert.instruction }}</div>
          </q-card-section>
        </template>
      </q-scroll-area>

      <q-separator />
      <q-card-actions align="right">
        <q-btn flat label="Close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { date } from 'quasar';
import { ref } from 'vue';
import { useWeatherAlertsStore } from '../../stores/weather-alerts';
import type { WeatherAlert } from '../../types/weather-alerts';

defineProps<{ alert: WeatherAlert }>();
const emit = defineEmits<{ hide: [] }>();

const weatherStore = useWeatherAlertsStore();
const dialogOpen = ref(true);

function alertClass(event: string) {
  return event.toLowerCase().replace(/\s+/g, '-');
}

function formatExpiry(expires: string) {
  const d = new Date(expires);
  return date.formatDate(d, 'h:mma dddd, MMMM Do');
}
</script>

<style lang="scss" scoped>
:where(.q-toolbar) {
  background-color: $blue-10;
}
.q-toolbar {
  min-height: 60px;
}
.weather-alert-dialog {
  min-width: 50vw;
  max-width: 90vw;
  display: flex;
  flex-direction: column;

  &__toolbar {
    color: #fff;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.6);
    font-weight: 700;
    flex-shrink: 0;

    .text-caption {
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      line-height: 1rem;
    }
  }

  &__title {
    font-weight: bold;
    line-height: 1.5rem;
  }

  &__expires {
    opacity: 0.9;
  }

  &__headline {
    font-weight: 500;
    line-height: 1.4;
  }

  &__scroll {
    height: 60vh;
  }
}

.alert-text {
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>
