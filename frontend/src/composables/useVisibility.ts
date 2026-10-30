import { computed } from 'vue';
import type { HassEntities } from 'home-assistant-js-websocket';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { VisibilityCondition, VisibilityConfig } from '../types/visibility';
import { usesTime } from '../utils/resolveWidgetProp';
import { useMinuteClock } from './useMinuteClock';

type ConditionFn = (states: HassEntities) => boolean;

// Compiled conditions keyed by template source; null if it failed to compile
const conditionCache = new Map<
  string,
  { expr: string; fn: ConditionFn | null; usesTime: boolean }
>();

function compileCondition(template: string) {
  let compiled = conditionCache.get(template);
  if (compiled) return compiled;

  const raw = template.trim();
  const expr = raw.startsWith('{{') ? raw.slice(2, raw.lastIndexOf('}}')).trim() : raw;
  let fn: ConditionFn | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    fn = new Function('states', `return !!(${expr})`) as ConditionFn;
  } catch (e) {
    console.error('[useVisibility] Template error:', expr, e);
  }
  compiled = { expr, fn, usesTime: usesTime(expr) };
  conditionCache.set(template, compiled);
  return compiled;
}

function evaluateCondition(cond: VisibilityCondition, states: HassEntities): boolean {
  if (cond.template !== undefined) {
    const compiled = compileCondition(cond.template);
    const { expr, fn } = compiled;
    if (!fn) return false;
    // Re-evaluate each minute, not just on state changes
    if (compiled.usesTime) void useMinuteClock().value;
    try {
      return fn(states);
    } catch (e) {
      console.error('[useVisibility] Template error:', expr, e);
      return false;
    }
  }

  if (!cond.entity) return true;
  const entityState = states[cond.entity]?.state ?? null;

  if (cond.state !== undefined) return entityState === cond.state;
  if (cond.not !== undefined) return entityState !== cond.not;
  if (cond.above !== undefined) return entityState !== null && parseFloat(entityState) > cond.above;
  if (cond.below !== undefined) return entityState !== null && parseFloat(entityState) < cond.below;

  return true;
}

export function evaluateVisibility(
  config: VisibilityConfig | undefined | null,
  states: HassEntities,
): boolean {
  if (!config?.conditions?.length) return true;
  const match = config.match ?? 'all';
  const results = config.conditions.map((c) => evaluateCondition(c, states));
  return match === 'any' ? results.some(Boolean) : results.every(Boolean);
}

export function useVisibility(getConfig: () => VisibilityConfig | undefined | null) {
  const haStore = useHomeAssistantStore();
  const visible = computed(() => evaluateVisibility(getConfig(), haStore.states));
  return { visible };
}
