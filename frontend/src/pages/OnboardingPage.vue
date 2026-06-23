<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center bg-grey-1">
        <q-card style="width: 480px; max-width: 95vw" flat bordered>
          <q-card-section class="q-pb-none">
            <div class="text-h5 q-mb-xs">Welcome to TileBoard</div>
            <div class="text-body2 text-grey-7">
              Enter the URL to your dashboard configuration to get started.
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="submit">
              <q-input
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
                :disable="!url.trim()"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';

const configStore = useConfigStore();
const router = useRouter();

const url = ref(configStore.configUrl ?? '');

async function submit() {
  try {
    await configStore.loadConfig(url.value.trim());
    await router.replace('/');
  } catch {
    // error is set on the store, displayed in the input
  }
}
</script>
