import type { HassEntities } from 'home-assistant-js-websocket';

export interface PropResolveContext {
  state: string | null;
  attributes: Record<string, unknown>;
  entity: (id: string) => { state: string | null; attributes: Record<string, unknown> };
  states: HassEntities;
}

export function resolveWidgetProp(value: unknown, ctx: PropResolveContext): string | undefined {
  if (value == null) return undefined;

  // State map: { on: 'green', off: 'red', default: 'grey' }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const map = value as Record<string, string>;
    return ctx.state != null ? (map[ctx.state] ?? map['default']) : map['default'];
  }

  if (typeof value !== 'string') return undefined;

  // Static string — no template syntax
  if (!value.includes('{{')) return value;

  // Interpolation: replace each {{ expr }} block with its evaluated result
  return value.replace(/\{\{([\s\S]*?)\}\}/g, (_, expr: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const result = new Function(
        'state',
        'attributes',
        'entity',
        'states',
        `return (${expr.trim()})`,
      )(ctx.state, ctx.attributes, ctx.entity, ctx.states) as unknown;
      if (result == null || typeof result === 'object' || typeof result === 'function') return '';
      return String(result); //eslint-disable-line @typescript-eslint/no-base-to-string
    } catch (e) {
      console.error('[resolveWidgetProp] Template error in expression:', expr.trim(), e);
      return '';
    }
  });
}
