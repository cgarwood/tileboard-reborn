import { describeError, useIssuesStore } from '../stores/issues';

/**
 * Scopes config-authored CSS to one element: every selector is prefixed with `.{scopeClass}`, and
 * `:scope` in a selector stands for that element itself.
 *
 * Native scoping (`@scope`, CSS nesting) needs Chrome 118+, newer than the oldest supported kiosk
 * WebView, so selectors are rewritten instead. The browser parses the CSS (no hand-rolled parser);
 * only each selector list is split and rewritten.
 */
export function scopeCss(css: string, scopeClass: string): string {
  const sheet = new CSSStyleSheet();
  try {
    sheet.replaceSync(css);
  } catch (e) {
    console.error('[scopeCss] Could not parse CSS:', e);
    useIssuesStore().report('config', `Couldn't parse widget CSS: ${describeError(e)}`, {
      detail: css,
    });
    return '';
  }
  return scopeRules(sheet.cssRules, `.${scopeClass}`);
}

function scopeRules(rules: CSSRuleList, scope: string): string {
  return Array.from(rules, (rule) => scopeRule(rule, scope)).join('\n');
}

function scopeRule(rule: CSSRule, scope: string): string {
  if (rule instanceof CSSStyleRule) {
    const selector = splitSelectorList(rule.selectorText)
      .map((s) => scopeSelector(s, scope))
      .join(', ');
    return `${selector} { ${rule.style.cssText} }`;
  }
  if (rule instanceof CSSMediaRule) {
    return `@media ${rule.media.mediaText} {\n${scopeRules(rule.cssRules, scope)}\n}`;
  }
  if (rule instanceof CSSSupportsRule) {
    return `@supports ${rule.conditionText} {\n${scopeRules(rule.cssRules, scope)}\n}`;
  }
  // @keyframes, @font-face, etc. have no selectors to scope
  return rule.cssText;
}

function scopeSelector(selector: string, scope: string): string {
  return selector.includes(':scope')
    ? selector.replace(/:scope\b/g, scope)
    : `${scope} ${selector}`;
}

/** Split a selector list on its top-level commas (not those inside `:is(a, b)` or `[x="a,b"]`). */
function splitSelectorList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i]!;
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(list.slice(start).trim());
  return parts.filter(Boolean);
}
