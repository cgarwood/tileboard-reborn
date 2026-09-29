import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';

// Compressed payloads of HA's `subscribe_entities` command (mirrors home-assistant-js-websocket's
// internal types, which aren't exported).
interface CompressedState {
  s: string;
  a: Record<string, unknown>;
  c: string | { id: string; parent_id: string | null; user_id: string | null };
  lc: number;
  lu?: number;
}

interface CompressedStateDiff {
  '+'?: Partial<CompressedState>;
  '-'?: { a?: string[] };
}

export interface EntityUpdatesMessage {
  a?: Record<string, CompressedState>; // added (or full snapshot)
  c?: Record<string, CompressedStateDiff>; // changed
  r?: string[]; // removed
}

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString();

/**
 * Applies one `subscribe_entities` message to `target` in place, touching only the entities it
 * names. Changed entities get a new object (attributes too, if they changed) so consumers can
 * rely on identity; unchanged entities are left alone.
 *
 * Same semantics as home-assistant-js-websocket's collection, which instead copies the entire
 * state object on every message — O(all entities) instead of O(changed entities).
 */
export function applyEntityUpdates(target: HassEntities, msg: EntityUpdatesMessage): void {
  if (msg.a) {
    for (const entityId in msg.a) {
      const s = msg.a[entityId]!;
      const lastChanged = toIso(s.lc);
      target[entityId] = {
        entity_id: entityId,
        state: s.s,
        attributes: s.a,
        context: typeof s.c === 'string' ? { id: s.c, parent_id: null, user_id: null } : s.c,
        last_changed: lastChanged,
        last_updated: s.lu ? toIso(s.lu) : lastChanged,
      };
    }
  }

  if (msg.r) {
    for (const entityId of msg.r) delete target[entityId];
  }

  if (msg.c) {
    for (const entityId in msg.c) {
      const current = target[entityId];
      if (!current) {
        console.warn('Received state update for unknown entity', entityId);
        continue;
      }
      const { '+': toAdd, '-': toRemove } = msg.c[entityId]!;
      const attributesChanged = !!(toAdd?.a || toRemove?.a);
      const next: HassEntity = { ...current };
      const attributes = attributesChanged ? { ...current.attributes } : current.attributes;

      if (toAdd) {
        if (toAdd.s !== undefined) next.state = toAdd.s;
        if (toAdd.c) {
          next.context =
            typeof toAdd.c === 'string' ? { ...next.context, id: toAdd.c } : { ...next.context, ...toAdd.c };
        }
        if (toAdd.lc) {
          next.last_updated = next.last_changed = toIso(toAdd.lc);
        } else if (toAdd.lu) {
          next.last_updated = toIso(toAdd.lu);
        }
        if (toAdd.a) Object.assign(attributes, toAdd.a);
      }
      if (toRemove?.a) {
        for (const key of toRemove.a) delete attributes[key];
      }
      if (attributesChanged) next.attributes = attributes;

      target[entityId] = next;
    }
  }
}
