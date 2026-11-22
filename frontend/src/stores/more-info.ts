import { defineStore, acceptHMRUpdate } from 'pinia';
import { shallowRef, watch } from 'vue';
import { useConfigStore } from './config';
import type { Widget } from '../types/widgets';

export interface MoreInfoTarget {
  /** Changes on every open, so opening another entity while the dialog is up remounts it. */
  id: number;
  /** Entity to show. Without one, the widget's `more_info.entity_id` or `entity` is used. */
  entityId?: string | undefined;
  /** Widget it was opened from: supplies the dialog's title, subtitle and `more_info` settings. */
  widget?: Widget | undefined;
}

/**
 * The one more-info dialog, rendered by App.vue. Anything can open it (widgets, chips inside a
 * widget, actions run from events), not only the widget that owns the entity.
 */
export const useMoreInfoStore = defineStore('moreInfo', () => {
  const target = shallowRef<MoreInfoTarget | null>(null);
  let nextId = 1;

  /** Opens the dialog. Does nothing when there's no entity to show. */
  function open(entityId?: string, widget?: Widget) {
    const resolved = entityId ?? widget?.more_info?.entity_id ?? widget?.entity;
    if (!resolved) return;
    target.value = { id: nextId++, entityId, widget };
  }

  function close() {
    target.value = null;
  }

  // A reloaded config remounts every widget; a dialog left open would describe the old one
  watch(() => useConfigStore().version, close);

  return { target, open, close };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMoreInfoStore, import.meta.hot));
}
