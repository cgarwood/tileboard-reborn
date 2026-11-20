const RELOAD_PARAM = '_reload';

/**
 * Reload the page past any cached copy: clear Fully Kiosk's WebView cache and the Cache Storage
 * API, unregister service workers, then load the page with a unique query parameter so
 * index.html is fetched again. Built assets have hashed names, so a fresh index.html brings in
 * new ones.
 */
export async function forceReload(): Promise<void> {
  try {
    window.fully?.clearCache?.();
  } catch (e) {
    console.warn('[Reload] Fully Kiosk clearCache failed', e);
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn('[Reload] Failed to clear Cache Storage', e);
  }
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    console.warn('[Reload] Failed to unregister service workers', e);
  }

  const url = new URL(window.location.href);
  url.searchParams.set(RELOAD_PARAM, Date.now().toString(36));
  window.location.replace(url.toString());
}

/** Remove the cache-busting parameter forceReload() added, once the page has loaded. */
export function stripReloadParam(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(RELOAD_PARAM)) return;
  url.searchParams.delete(RELOAD_PARAM);
  history.replaceState(history.state, '', url.toString());
}
