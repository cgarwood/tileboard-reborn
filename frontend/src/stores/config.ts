import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';

const CONFIG_URL_KEY = 'tileboard:configUrl';

export const useConfigStore = defineStore('configStore', () => {
  const configUrl = ref<string | null>(localStorage.getItem(CONFIG_URL_KEY));
  const config = ref<Record<string, unknown> | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadConfig(url: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
      }
      const data = (await response.json()) as Record<string, unknown>;
      config.value = data;
      configUrl.value = url;
      localStorage.setItem(CONFIG_URL_KEY, url);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { configUrl, config, loading, error, loadConfig };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
