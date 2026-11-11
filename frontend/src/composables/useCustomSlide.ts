import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { resolveWidgetProp } from '../utils/resolveWidgetProp';
import type { PropResolveContext } from '../utils/resolveWidgetProp';
import { evaluateVisibility } from './useVisibility';
import type { CustomSlideConfig } from '../types/screensaver';

const NULL_ENTITY = { state: null, attributes: {} };
const UNAVAILABLE = new Set(['unavailable', 'unknown']);

export interface CustomSlideContent {
  header?: string;
  icon?: string;
  title?: string;
  text?: string;
  footer?: string;
  /** Author's markup with `{{ }}` results escaped. Replaces the built-in layout when set. */
  html?: string;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

/**
 * Resolved content of a screensaver `custom_slides` entry, or null when the slide should be left
 * out: its visibility conditions fail, its entity is unavailable, or it has nothing to show.
 */
export function useCustomSlide(
  getConfig: () => CustomSlideConfig,
): ComputedRef<CustomSlideContent | null> {
  const haStore = useHomeAssistantStore();

  return computed(() => {
    const config = getConfig();
    if (!evaluateVisibility(config.visibility, haStore.states)) return null;

    const entity = config.entity ? haStore.states[config.entity] : undefined;
    if (config.entity && (!entity || UNAVAILABLE.has(entity.state))) return null;

    const ctx: PropResolveContext = {
      state: entity?.state ?? null,
      attributes: entity?.attributes ?? {},
      entity: (id) => haStore.states[id] ?? NULL_ENTITY,
      states: haStore.states,
    };
    const resolve = (value: unknown) => resolveWidgetProp(value, ctx)?.trim() || undefined;

    if (config.html !== undefined) {
      const html = resolveWidgetProp(config.html, ctx, escapeHtml)?.trim();
      return html ? { html } : null;
    }

    const content: CustomSlideContent = {
      header: resolve(config.header),
      icon: resolve(config.icon),
      title: resolve(config.title),
      text: resolve(config.text),
      footer: resolve(config.footer),
    };
    // A slide whose main content resolved to nothing (e.g. an empty sensor) isn't worth showing
    const main = config.text !== undefined ? content.text : content.title;
    return main ? content : null;
  });
}
