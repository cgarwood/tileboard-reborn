import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { useConfigStore } from '../stores/config';
import { serverConfigUrl, takeConfigSearchParam } from '../utils/serverConfigs';

import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    const configStore = useConfigStore();
    // `?config=<name>` selects a server config by name. It's accepted before the hash
    // (`/?config=kids_room`, the form for a kiosk start URL) or inside it (`#/?config=kids_room`).
    const searchName = takeConfigSearchParam();

    if (to.path === '/onboarding') {
      // Onboarding preselects the requested config instead of loading it.
      if (searchName && !to.query.config) {
        return { path: to.path, query: { ...to.query, config: searchName } };
      }
      return;
    }

    if (to.path === '/config-error') {
      // Only meaningful after a failed load (not, say, after reloading the page on it)
      return configStore.failedUrl ? undefined : '/';
    }
    // The config error page retries the failed load, then continues to where this was headed
    const configError = { path: '/config-error', query: { redirect: to.path } };

    const hashName = typeof to.query.config === 'string' ? to.query.config.trim() : '';
    const requested = searchName || hashName;
    if (requested) {
      try {
        await configStore.loadConfig(serverConfigUrl(requested));
      } catch {
        return configError;
      }
      if (!hashName) return;
      const query = { ...to.query };
      delete query.config;
      return { path: to.path, query, hash: to.hash, replace: true };
    }

    if (configStore.config) return;
    // If a URL was persisted, try to auto-load before redirecting
    if (configStore.configUrl) {
      try {
        await configStore.loadConfig(configStore.configUrl);
        return;
      } catch {
        return configError;
      }
    }
    return '/onboarding';
  });

  return Router;
});
