declare const fully: { getDeviceId(): string } | undefined;

const STORAGE_KEY = 'tileboard:id';

let cached: string | null = null;

export function getTileboardId(): string {
  if (cached) return cached;

  if (typeof fully !== 'undefined') {
    cached = 'fk-' + fully.getDeviceId();
    return cached;
  }

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  cached = id;
  return cached;
}
