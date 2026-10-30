import type { HassEntities } from 'home-assistant-js-websocket';

export interface PropResolveContext {
  state: string | null;
  attributes: Record<string, unknown>;
  entity: (id: string) => { state: string | null; attributes: Record<string, unknown> };
  states: HassEntities;
}

type TemplateFn = (
  state: PropResolveContext['state'],
  attributes: PropResolveContext['attributes'],
  entity: PropResolveContext['entity'],
  states: PropResolveContext['states'],
) => unknown;

// Literal text, a compiled {{ expr }}, or null for an expression that failed to compile
type Segment = string | { expr: string; fn: TemplateFn | null };

// Parsed templates keyed by source. Templates come from the dashboard config, so this stays small.
const templateCache = new Map<string, Segment[]>();

function compile(expr: string): TemplateFn | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return new Function('state', 'attributes', 'entity', 'states', `return (${expr})`) as TemplateFn;
  } catch (e) {
    console.error('[resolveWidgetProp] Template error in expression:', expr, e);
    return null;
  }
}

function parseTemplate(template: string): Segment[] {
  let segments = templateCache.get(template);
  if (segments) return segments;

  segments = [];
  const re = /\{\{([\s\S]*?)\}\}/g;
  let last = 0;
  for (let m = re.exec(template); m; m = re.exec(template)) {
    if (m.index > last) segments.push(template.slice(last, m.index));
    const expr = m[1]!.trim();
    segments.push({ expr, fn: compile(expr) });
    last = re.lastIndex;
  }
  if (last < template.length) segments.push(template.slice(last));

  templateCache.set(template, segments);
  return segments;
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
  let out = '';
  for (const seg of parseTemplate(value)) {
    if (typeof seg === 'string') {
      out += seg;
      continue;
    }
    if (!seg.fn) continue;
    try {
      const result = seg.fn(ctx.state, ctx.attributes, ctx.entity, ctx.states);
      if (result == null || typeof result === 'object' || typeof result === 'function') continue;
      out += String(result); //eslint-disable-line @typescript-eslint/no-base-to-string
    } catch (e) {
      console.error('[resolveWidgetProp] Template error in expression:', seg.expr, e);
    }
  }
  return out;
}
