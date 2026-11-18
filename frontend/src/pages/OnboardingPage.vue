<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center bg-grey-1">
        <q-card style="width: 480px; max-width: 95vw" flat bordered>
          <q-card-section class="q-pb-none">
            <div class="text-h5 q-mb-xs">Welcome to TileBoard</div>
            <div class="text-body2 text-grey-7">
              {{
                useServer
                  ? 'Choose the dashboard for this device.'
                  : 'Enter the URL to your dashboard configuration to get started.'
              }}
            </div>
          </q-card-section>

          <q-card-section v-if="listLoading" class="flex flex-center q-py-lg">
            <q-spinner size="32px" color="primary" />
          </q-card-section>

          <q-card-section v-else>
            <q-form @submit.prevent="submit">
              <q-select
                v-if="useServer"
                v-model="selected"
                :options="serverConfigs ?? []"
                option-value="name"
                option-label="title"
                emit-value
                map-options
                label="Dashboard"
                outlined
                :error="!!configStore.error"
                :error-message="configStore.error ?? undefined"
                :disable="configStore.loading"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.title }}</q-item-label>
                      <q-item-label v-if="scope.opt.title !== scope.opt.name" caption>
                        {{ scope.opt.name }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-input
                v-else
                v-model="url"
                label="Configuration URL"
                placeholder="https://example.com/dashboard.json"
                outlined
                autofocus
                :error="!!configStore.error"
                :error-message="configStore.error ?? undefined"
                :disable="configStore.loading"
              />
              <q-btn
                type="submit"
                label="Load Configuration"
                color="primary"
                class="full-width q-mt-md"
                unelevated
                :loading="configStore.loading"
                :disable="!canSubmit"
              />
              <q-btn
                v-if="serverConfigs?.length"
                :label="useServer ? 'Use a custom URL instead' : 'Choose from this server instead'"
                flat
                no-caps
                color="grey-7"
                class="full-width q-mt-sm"
                :disable="configStore.loading"
                @click="useServer = !useServer"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';
import {
  fetchServerConfigs,
  serverConfigName,
  serverConfigUrl,
  type ServerConfig,
} from '../utils/serverConfigs';

const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();

const url = ref(configStore.configUrl ?? '');
const selected = ref<string | null>(null);
const serverConfigs = ref<ServerConfig[] | null>(null);
const listLoading = ref(true);
// Pick from the server's list, rather than typing a URL
const useServer = ref(false);

const canSubmit = computed(() => (useServer.value ? !!selected.value : !!url.value.trim()));

onMounted(async () => {
  const configs = await fetchServerConfigs();
  serverConfigs.value = configs;
  listLoading.value = false;
  if (!configs?.length) return;

  // Preselect the config requested with ?config=, else the one this device last used
  const requested = typeof route.query.config === 'string' ? route.query.config : null;
  const current = serverConfigName(configStore.configUrl);
  const preselect = [requested, current].find((n) => n && configs.some((c) => c.name === n));
  selected.value = preselect ?? (configs.length === 1 ? configs[0]!.name : null);

  // Stay on the URL field if this device was set up with a custom URL
  useServer.value = !configStore.configUrl || current !== null || requested !== null;
});

async function submit() {
  const target = useServer.value ? serverConfigUrl(selected.value!) : url.value.trim();
  try {
    await configStore.loadConfig(target);
    await router.replace('/');
  } catch {
    // error is set on the store, displayed under the field
  }
}
</script>
