/**
 * Configs served by the TileBoard server that also serves this page. URLs are relative, so they
 * resolve against wherever the page was loaded from (and through the dev server proxy in dev).
 */

export interface ServerConfig {
  name: string;
  title: string;
}

const PREFIX = 'config/';

export function serverConfigUrl(name: string): string {
  return PREFIX + encodeURIComponent(name);
}

/** The config name if `url` is one built by serverConfigUrl, else null. */
export function serverConfigName(url: string | null): string | null {
  if (!url?.startsWith(PREFIX)) return null;
  const name = url.slice(PREFIX.length);
  return name && !name.includes('/') ? decodeURIComponent(name) : null;
}

/** The server's config list, or null if this page isn't served by a TileBoard server. */
export async function fetchServerConfigs(): Promise<ServerConfig[] | null> {
  try {
    const response = await fetch('api/configs');
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as ServerConfig[]) : null;
  } catch {
    return null;
  }
}

/**
 * Reads `?config=<name>` from the page URL (before the `#`), e.g. a Fully Kiosk start URL of
 * `http://host:9090/?config=kids_room`, and removes it so it's only applied once.
 */
export function takeConfigSearchParam(): string | null {
  const url = new URL(window.location.href);
  const name = url.searchParams.get('config');
  if (name === null) return null;
  url.searchParams.delete('config');
  history.replaceState(history.state, '', url.toString());
  return name.trim() || null;
}
