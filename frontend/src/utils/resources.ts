import type { ResourceConfig, ResourceType } from '../types/config';

const ATTR = 'data-tileboard-resource';

type Resolved = { key: string; href: string; type: ResourceType };

// Elements this module injected, keyed by `${type} ${href}`
const injected = new Map<string, HTMLElement>();

function inferType(url: URL): ResourceType | undefined {
  const path = url.pathname.toLowerCase();
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'module';
  return undefined;
}

function resolve(entry: unknown, base: string): Resolved | null {
  const config = entry as Partial<ResourceConfig> | null;
  if (!config || typeof config.url !== 'string' || !config.url) {
    console.warn('[Resources] Ignoring entry without a url', entry);
    return null;
  }
  let url: URL;
  try {
    // Relative URLs are relative to the config's server, not the page: the dashboard is
    // often served from a different origin than the tileboard server.
    url = new URL(config.url, base);
  } catch {
    console.warn(`[Resources] Invalid url "${config.url}"`);
    return null;
  }
  const type = config.type ?? inferType(url);
  if (type !== 'css' && type !== 'module') {
    console.warn(
      `[Resources] Can't determine the type of "${config.url}"; set type: css or type: module`,
    );
    return null;
  }
  return { key: `${type} ${url.href}`, href: url.href, type };
}

function createElement(resource: Resolved): HTMLElement | null {
  if (resource.type === 'module') {
    // Reserved for custom widgets
    console.warn(`[Resources] type: module is not supported yet; skipping ${resource.href}`);
    return null;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = resource.href;
  link.setAttribute(ATTR, resource.key);
  link.addEventListener('error', () =>
    console.warn(`[Resources] Failed to load stylesheet ${resource.href}`),
  );
  return link;
}

/**
 * Syncs the injected resources with the config's `resources` list. Resources still listed are
 * left in place (no reload or flash of unstyled content), stale ones are removed, and new ones
 * are added at the end of <head> so they override the app's own styles.
 */
export function applyResources(resources: unknown, configUrl: string | null): void {
  const base = new URL(configUrl ?? '', window.location.href).href;
  const wanted = (Array.isArray(resources) ? resources : [])
    .map((entry) => resolve(entry, base))
    .filter((r): r is Resolved => r !== null);
  const wantedKeys = new Set(wanted.map((r) => r.key));

  for (const [key, el] of injected) {
    if (!wantedKeys.has(key)) {
      el.remove();
      injected.delete(key);
    }
  }

  // Walk backwards so each new element can be inserted before the next one in config order
  let next: HTMLElement | null = null;
  for (let i = wanted.length - 1; i >= 0; i--) {
    const resource = wanted[i]!;
    let el = injected.get(resource.key) ?? null;
    if (!el) {
      el = createElement(resource);
      if (!el) continue;
      if (next) next.before(el);
      else document.head.appendChild(el);
      injected.set(resource.key, el);
    }
    next = el;
  }
}
