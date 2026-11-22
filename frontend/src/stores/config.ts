import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';

const CONFIG_URL_KEY = 'tileboard:configUrl';

/** Turns a failed config fetch into a message, using the server's `{ error }` body when it sent one. */
async function describeConfigFailure(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === 'string' && body.error) return body.error;
  } catch {
    // Not JSON: fall back to the status line
  }
  if (response.status === 404) return 'Config not found (404)';
  return `Server returned ${response.status} ${response.statusText}`.trim();
}

export const useConfigStore = defineStore('configStore', () => {
  const configUrl = ref<string | null>(localStorage.getItem(CONFIG_URL_KEY));
  const config = ref<Record<string, unknown> | null>(null);
  // Incremented on every successful load; the dashboard keys on it so a reload remounts all
  // widgets. Widgets can therefore treat their config as fixed for their lifetime.
  const version = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  /** URL of the last load that failed, so the config error page can retry it. */
  const failedUrl = ref<string | null>(null);

  async function loadConfig(url: string) {
    loading.value = true;
    error.value = null;
    try {
      let response: Response;
      try {
        response = await fetch(url);
      } catch {
        throw new Error("Couldn't reach the server");
      }
      if (!response.ok) throw new Error(await describeConfigFailure(response));
      let data: Record<string, unknown>;
      try {
        data = (await response.json()) as Record<string, unknown>;
      } catch {
        throw new Error('The config is not valid JSON');
      }
      config.value = data;
      version.value++;
      configUrl.value = url;
      failedUrl.value = null;
      localStorage.setItem(CONFIG_URL_KEY, url);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      failedUrl.value = url;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { configUrl, config, version, loading, error, failedUrl, loadConfig };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigStore, import.meta.hot));
}
