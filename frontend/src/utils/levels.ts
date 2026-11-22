/**
 * Shared severity levels. Their colors are the `--level-*` theme variables, so alert widgets,
 * gauge segments and notifications always match.
 */
export type Level = 'info' | 'success' | 'warning' | 'error';

const ALIASES: Record<string, Level> = {
  info: 'info',
  success: 'success',
  good: 'success',
  ok: 'success',
  warning: 'warning',
  warn: 'warning',
  error: 'error',
  bad: 'error',
  critical: 'error',
  danger: 'error',
};

export const LEVEL_ICONS: Record<Level, string> = {
  info: 'mdi-information-outline',
  success: 'mdi-check-circle-outline',
  warning: 'mdi-alert-outline',
  error: 'mdi-alert-octagon-outline',
};

/** The level a config value names (case-insensitive, aliases allowed), or null if none. */
export function parseLevel(value: unknown): Level | null {
  return typeof value === 'string' ? (ALIASES[value.trim().toLowerCase()] ?? null) : null;
}

/** A level name becomes its theme color; anything else is taken as a CSS color. */
export function levelOrColor(value: string): string {
  const level = parseLevel(value);
  return level ? `var(--level-${level})` : value;
}
