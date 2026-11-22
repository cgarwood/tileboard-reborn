import { computed, onUnmounted, watch } from 'vue';
import { scopeCss } from '../utils/scopeCss';

// One <style> per distinct CSS source, shared by every element using it and removed with the last
const sheets = new Map<string, { el: HTMLStyleElement; refs: number }>();

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function acquire(scopeClass: string, css: string) {
  const sheet = sheets.get(scopeClass);
  if (sheet) {
    sheet.refs++;
    return;
  }
  const el = document.createElement('style');
  el.dataset.tileboardScope = scopeClass;
  el.textContent = scopeCss(css, scopeClass);
  document.head.appendChild(el);
  sheets.set(scopeClass, { el, refs: 1 });
}

function release(scopeClass: string) {
  const sheet = sheets.get(scopeClass);
  if (!sheet || --sheet.refs > 0) return;
  sheet.el.remove();
  sheets.delete(scopeClass);
}

/**
 * Injects config CSS scoped to the element that gets the returned `scopeClass` (see `scopeCss`).
 * The class is derived from the CSS itself, so identical CSS shares one stylesheet.
 */
export function useScopedCss(getCss: () => string | undefined) {
  const source = computed(() => getCss()?.trim() || undefined);
  const scopeClass = computed(() => (source.value ? `tb-css-${hash(source.value)}` : undefined));

  let held: string | undefined;
  watch(
    scopeClass,
    (cls) => {
      if (cls === held) return;
      if (cls) acquire(cls, source.value!);
      if (held) release(held);
      held = cls;
    },
    { immediate: true },
  );
  onUnmounted(() => {
    if (held) release(held);
    held = undefined;
  });

  return { scopeClass };
}
