<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center bg-grey-1">
        <q-card style="width: 560px; max-width: 95vw" flat bordered>
          <q-card-section class="row items-center no-wrap q-gutter-sm q-pb-none">
            <q-icon name="mdi-alert-circle-outline" color="negative" size="32px" />
            <div class="text-h6">Couldn't load the dashboard</div>
          </q-card-section>

          <q-card-section>
            <div class="text-caption text-grey-7">{{ configStore.failedUrl }}</div>
            <pre class="config-error__message">{{ configStore.error }}</pre>
            <div class="text-body2 text-grey-8">
              <template v-if="configStore.loading">Retrying…</template>
              <template v-else>Retrying in {{ secondsLeft }}s</template>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat no-caps color="grey-8" label="Choose another config" @click="chooseOther" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="mdi-refresh"
              label="Retry now"
              :loading="configStore.loading"
              @click="retry"
            />
          </q-card-actions>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';
import { serverConfigName } from '../utils/serverConfigs';

// Shown when the config can't be loaded at startup. A kiosk often boots before its server (or
// with a config that's being edited), so it keeps retrying until the config loads.
const RETRY_DELAYS_S = [5, 10, 20, 30, 60];

const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();

let attempt = 0;
const secondsLeft = ref(0);
let countdown: ReturnType<typeof setInterval> | null = null;

function scheduleRetry() {
  secondsLeft.value = RETRY_DELAYS_S[Math.min(attempt, RETRY_DELAYS_S.length - 1)]!;
  attempt++;
  stopCountdown();
  countdown = setInterval(() => {
    if (--secondsLeft.value <= 0) void retry();
  }, 1000);
}

function stopCountdown() {
  if (countdown) clearInterval(countdown);
  countdown = null;
}

async function retry() {
  const url = configStore.failedUrl;
  if (!url || configStore.loading) return;
  stopCountdown();
  try {
    await configStore.loadConfig(url);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect);
  } catch {
    scheduleRetry();
  }
}

function chooseOther() {
  stopCountdown();
  const name = serverConfigName(configStore.failedUrl);
  void router.replace({ path: '/onboarding', query: name ? { config: name } : {} });
}

scheduleRetry();
onUnmounted(stopCountdown);
</script>

<style lang="scss" scoped>
.config-error__message {
  margin: 8px 0 12px;
  padding: 10px 12px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
