<template>
  <q-layout view="hHh Lpr lFf" :style="layoutBackgroundStyle">
    <q-header elevated class="app-header" :style="toolbarBackgroundStyle">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>{{ currentPageName }}</q-toolbar-title>

        <div class="header-title-block q-mr-xs">
          <div class="header-app-name">{{ configStore.config?.name ?? 'TileBoard' }}</div>
          <div class="header-ha-status">
            <span class="ha-dot" :class="haStore.connected ? 'ha-dot--on' : 'ha-dot--off'" />
            {{ haStore.connected ? 'Connected' : 'Disconnected' }}
          </div>
        </div>

        <q-btn flat dense round icon="mdi-dots-vertical" aria-label="Menu">
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 190px">
              <q-item
                clickable
                v-close-popup
                :disable="!configStore.configUrl || configStore.loading"
                @click="reloadConfig"
              >
                <q-item-section avatar>
                  <q-icon name="refresh" />
                </q-item-section>
                <q-item-section>Reload Config</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="screensaverStore.active = true">
                <q-item-section avatar>
                  <q-icon name="slideshow" />
                </q-item-section>
                <q-item-section>Start Screensaver</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      :mini="miniDrawer"
      mini-to-overlay
      show-if-above
      bordered
      @mouseenter="miniDrawer = false"
      @mouseleave="miniDrawer = true"
    >
      <q-list>
        <template v-for="page in pages" :key="page.id">
          <q-item
            clickable
            :to="{ name: 'dashboard-page', params: { pageId: page.id } }"
            :class="{ 'page-item--active': isActivePage(page.id) }"
          >
            <q-item-section avatar>
              <q-icon
                :name="page.icon ?? 'mdi-home'"
                :color="isActivePage(page.id) ? 'primary' : 'grey-5'"
              />
            </q-item-section>
            <q-item-section>{{ page.name }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer v-if="weatherAlertsStore.alerts.length">
      <q-toolbar class="weather-alert-footer-toolbar" :class="activeAlertClass">
        <q-carousel
          v-model="currentSlide"
          animated
          infinite
          :autoplay="7000"
          transition-prev="slide-right"
          transition-next="slide-left"
          class="alert-footer-carousel"
        >
          <q-carousel-slide
            v-for="(alert, index) in weatherAlertsStore.alerts"
            :key="alert.id"
            :name="index"
            class="alert-footer-slide"
            @click.stop="selectedAlert = alert"
          >
            <q-icon
              :name="weatherAlertsStore.weatherAlertIconMap[alert.event] ?? 'mdi-alert'"
              class="q-mr-sm"
              size="28px"
            />
            <span class="alert-footer-slide__event">{{ alert.event }}</span>
            <span class="alert-footer-slide__expires">
              until {{ formatAlertExpiry(alert.expires) }}
            </span>
          </q-carousel-slide>
        </q-carousel>
      </q-toolbar>
    </q-footer>

    <WeatherAlertDialog v-if="selectedAlert" :alert="selectedAlert" @hide="selectedAlert = null" />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { date } from 'quasar';
import { useRoute } from 'vue-router';
import { useConfigStore } from '../stores/config';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useScreensaverStore } from '../stores/screensaver';
import { useWeatherAlertsStore } from '../stores/weather-alerts';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import WeatherAlertDialog from '../components/dialogs/WeatherAlertDialog.vue';
import type { Config } from '@/types/config';
import type { WeatherAlert } from '../types/weather-alerts';
import type { PropResolveContext } from '../utils/resolveWidgetProp';

const configStore = useConfigStore();
const screensaverStore = useScreensaverStore();

function reloadConfig() {
  if (configStore.configUrl) void configStore.loadConfig(configStore.configUrl);
}
const haStore = useHomeAssistantStore();
const route = useRoute();

const pages = computed(() => (configStore.config as Config | null)?.pages ?? []);

const currentPageId = computed(() => {
  const paramId = route.params.pageId as string | undefined;
  return paramId || pages.value[0]?.id;
});

const currentPageName = computed(
  () => pages.value.find((p) => p.id === currentPageId.value)?.name ?? '',
);

function isActivePage(id: string) {
  return currentPageId.value === id;
}

const NULL_ENTITY = { state: null as unknown as string, attributes: {} };

const pageResolveCtx = computed<PropResolveContext>(() => ({
  state: null,
  attributes: {},
  entity: (id) => haStore.states[id] ?? NULL_ENTITY,
  states: haStore.states,
}));

const toolbarBackgroundStyle = computed(() => {
  const page = pages.value.find((p) => p.id === currentPageId.value);
  if (!page?.toolbarBackground) return undefined;
  const resolved = resolveWidgetProp(page.toolbarBackground, pageResolveCtx.value);
  return resolved ? { background: resolved } : undefined;
});

const layoutBackgroundStyle = computed(() => {
  if (route.name !== 'dashboard-page' && route.name !== 'dashboard-index') return undefined;
  const bg = pages.value.find((p) => p.id === currentPageId.value)?.background;
  if (!bg) return undefined;
  return {
    ...(bg.image
      ? {
          backgroundImage: `url(${bg.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {}),
    ...(bg.color ? { backgroundColor: bg.color } : {}),
    ...(bg.style ?? {}),
  };
});

const leftDrawerOpen = ref(false);
const miniDrawer = ref(true);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const weatherAlertsStore = useWeatherAlertsStore();
const currentSlide = ref(0);
const selectedAlert = ref<WeatherAlert | null>(null);

watch(
  () => weatherAlertsStore.alerts,
  () => {
    currentSlide.value = 0;
  },
);

const activeAlertClass = computed(() => {
  const alert = weatherAlertsStore.alerts[currentSlide.value];
  return alert ? alert.event.toLowerCase().replace(/\s+/g, '-') : '';
});

function formatAlertExpiry(expires: string) {
  return date.formatDate(new Date(expires), 'h:mma dddd, MMMM Do');
}
</script>

<style lang="scss" scoped>
.alert-footer-carousel {
  height: 50px;
  background: transparent;

  :deep(.q-carousel__slide) {
    padding: 0;
  }
}

.alert-footer-slide {
  display: flex;
  align-items: center;
  cursor: pointer;
  height: 100%;
  gap: 8px;
  padding: 0 16px;

  &__event {
    font-size: 1.2rem;
    font-weight: 600;
  }

  &__expires {
    font-size: 0.95rem;
    opacity: 0.85;
  }
}

.app-header {
  background: var(--toolbar-background);
  transition: background-color 1s ease;
}

.header-title-block {
  text-align: right;
  line-height: 1.2;
}

.header-app-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
}

.header-ha-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 0.7rem;
  opacity: 0.75;
  color: white;
}

.ha-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;

  &--on {
    background: #4caf50;
    box-shadow: 0 0 4px #4caf50;
  }

  &--off {
    background: #f44336;
  }
}

.page-item--active {
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.12);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--q-primary, #1976d2);
    border-radius: 0 2px 2px 0;
  }
}
</style>
