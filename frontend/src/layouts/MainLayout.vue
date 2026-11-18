<template>
  <q-layout view="hHh lpR lFf" :style="layoutBackgroundStyle">
    <q-header elevated class="app-header" :style="toolbarBackgroundStyle">
      <q-toolbar>

        <q-icon v-if="currentPageIcon" :name="currentPageIcon" size="22px" class="q-mr-sm" />
        <q-toolbar-title>{{ currentPageName }}</q-toolbar-title>

        <FullyKioskBattery />

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
                  <q-icon name="mdi-refresh" />
                </q-item-section>
                <q-item-section>Reload Config</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="screensaverStore.active = true">
                <q-item-section avatar>
                  <q-icon name="mdi-play-box-outline" />
                </q-item-section>
                <q-item-section>Start Screensaver</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Page navigation rail (left). The bottom variant lives in the footer below. -->
    <div
      v-if="navPages.length && navPosition === 'left'"
      class="page-nav-rail"
      :style="navBackground ? { background: navBackground } : undefined"
    >
      <div
        v-for="page in navPages"
        :key="page.id"
        class="nav-rail-btn"
        :class="{ 'nav-rail-btn--active': isActivePage(page.id) }"
        @click="goToPage(page.id)"
      >
        <q-icon :name="page.icon ?? 'mdi-home'" size="22px" />
        <q-tooltip anchor="center right" self="center left" :delay="600">{{ page.name }}</q-tooltip>
      </div>
    </div>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer v-if="showBottomNav || weatherAlertsStore.alerts.length" class="app-footer">
      <div
        v-if="showBottomNav"
        class="page-nav-bar"
        :style="bottomNavBackground ? { background: bottomNavBackground } : undefined"
      >
        <div
          v-for="page in navPages"
          :key="page.id"
          class="nav-rail-btn"
          :class="{ 'nav-rail-btn--active': isActivePage(page.id) }"
          @click="goToPage(page.id)"
        >
          <q-icon :name="page.icon ?? 'mdi-home'" size="22px" />
          <q-tooltip anchor="top middle" self="bottom middle" :delay="600">{{
            page.name
          }}</q-tooltip>
        </div>
      </div>
      <q-toolbar
        v-if="weatherAlertsStore.alerts.length"
        class="weather-alert-footer-toolbar"
        :class="activeAlertClass"
      >
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
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useScreensaverStore } from '../stores/screensaver';
import { useWeatherAlertsStore } from '../stores/weather-alerts';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import { evaluateVisibility } from '../composables/useVisibility';
import { useLayout } from '../composables/useLayout';
import WeatherAlertDialog from '../components/dialogs/WeatherAlertDialog.vue';
import FullyKioskBattery from '../components/FullyKioskBattery.vue';
import type { Config } from '@/types/config';
import type { WeatherAlert } from '../types/weather-alerts';
import type { PropResolveContext } from '../utils/resolveWidgetProp';

const router = useRouter();
const configStore = useConfigStore();
const screensaverStore = useScreensaverStore();

function reloadConfig() {
  if (configStore.configUrl) void configStore.loadConfig(configStore.configUrl);
}
const haStore = useHomeAssistantStore();
const route = useRoute();

const pages = computed(() => (configStore.config as Config | null)?.pages ?? []);
const navPages = computed(() =>
  pages.value.filter((p) => evaluateVisibility(p.visibility, haStore.states)),
);

const currentPageId = computed(() => {
  const paramId = route.params.pageId as string | undefined;
  return paramId || pages.value[0]?.id;
});

const currentPage = computed(() => pages.value.find((p) => p.id === currentPageId.value));
const currentPageName = computed(() => currentPage.value?.name ?? '');
const currentPageIcon = computed(() => currentPage.value?.icon ?? null);

function isActivePage(id: string) {
  return currentPageId.value === id;
}

function goToPage(pageId: string) {
  void router.push({ name: 'dashboard-page', params: { pageId } });
}

const { navPosition } = useLayout();
const showBottomNav = computed(() => navPages.value.length > 0 && navPosition.value === 'bottom');

const NULL_ENTITY = { state: null as unknown as string, attributes: {} };

const pageResolveCtx = computed<PropResolveContext>(() => ({
  state: null,
  attributes: {},
  entity: (id) => haStore.states[id] ?? NULL_ENTITY,
  states: haStore.states,
}));

function resolvePageProp(value: string | Record<string, string> | undefined) {
  return value ? resolveWidgetProp(value, pageResolveCtx.value) || undefined : undefined;
}

const toolbarBackground = computed(() => resolvePageProp(currentPage.value?.toolbar_background));

const toolbarBackgroundStyle = computed(() =>
  toolbarBackground.value ? { background: toolbarBackground.value } : undefined,
);

// The left rail has no background unless `nav_background` is set. The bottom bar matches the
// header: nav_background, then the page's toolbar_background, then --nav-bar-background.
const navBackground = computed(() => resolvePageProp(currentPage.value?.nav_background));
const bottomNavBackground = computed(() => navBackground.value ?? toolbarBackground.value);

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
  margin-left: 16px;
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

.page-nav-rail {
  position: fixed;
  top: 50px;
  bottom: 0;
  width: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  z-index: 200;
  pointer-events: none;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-footer {
  background: transparent;
}

.page-nav-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  overflow-x: auto;
  background: var(--nav-bar-background);
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.3);
  transition: background-color 1s ease;

  // Centered via auto margins rather than justify-content, so a row too wide for the screen
  // still scrolls from its first button instead of clipping on the left.
  .nav-rail-btn {
    flex-shrink: 0;

    &:first-child {
      margin-left: auto;
    }

    &:last-child {
      margin-right: auto;
    }
  }
}

.nav-rail-btn {
  pointer-events: all;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.45);
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.08);
  }

  &--active {
    color: white;
    background: rgba(255, 255, 255, 0.18);
  }
}
</style>
