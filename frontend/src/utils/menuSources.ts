// Adapters that turn a menu entity's attributes into a MenuDay. The widget and screensaver slide
// only ever see MenuDay, so supporting another menu integration means adding a source here.

import type { MenuConfig, MenuDay, MenuSection, MenuSourceType } from '../types/menu';

export interface MenuSource {
  parse(attributes: Record<string, unknown>, config: MenuConfig): MenuDay;
  /** Sections hidden when `hide_sections` isn't set. */
  defaultHidden: string[];
  /** Tomorrow's entity when `tomorrow_entity` isn't set. */
  tomorrowEntity?(todayEntity: string): string | undefined;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function sectionMap(value: unknown): [string, string[]][] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([name, items]) => [
    name,
    stringList(items),
  ]);
}

function dateAttr(attributes: Record<string, unknown>): string | undefined {
  return typeof attributes.date === 'string' ? attributes.date.slice(0, 10) : undefined;
}

// Nutrislice (via the "Nutrislice School Menus" custom integration): `categories` maps each serving
// line to all of its items in order, and `menu_items` tags each item with a food category. Lines
// mix entrees with toppings, so entrees (and meats: taco lines have no "entree") are the headline,
// condiments are dropped, and the rest is listed as extras.
const NUTRISLICE_MAIN = new Set(['entree', 'meat']);
const NUTRISLICE_DROP = new Set(['condiment']);

const nutrislice: MenuSource = {
  defaultHidden: ['Extra Extra', 'Milk & Condiments'],

  tomorrowEntity: (today) =>
    today.endsWith('_today') ? today.slice(0, -'_today'.length) + '_tomorrow' : undefined,

  parse(attributes) {
    const categoryOf = new Map<string, string>();
    if (Array.isArray(attributes.menu_items)) {
      for (const item of attributes.menu_items as Record<string, unknown>[]) {
        if (typeof item?.name !== 'string' || typeof item.category !== 'string') continue;
        categoryOf.set(`${String(item.section)}\u0000${item.name}`, item.category);
      }
    }

    const sections: MenuSection[] = [];
    for (const [name, items] of sectionMap(attributes.categories)) {
      const main: string[] = [];
      const extra: string[] = [];
      for (const item of new Set(items)) {
        const category = categoryOf.get(`${name}\u0000${item}`);
        if (category && NUTRISLICE_DROP.has(category)) continue;
        (category && NUTRISLICE_MAIN.has(category) ? main : extra).push(item);
      }
      if (!main.length && extra.length) main.push(extra.shift()!);
      if (main.length) sections.push({ name, main, extra });
    }

    const date = dateAttr(attributes);
    return date ? { date, sections } : { sections };
  },
};

// Generic: any attribute shaped `{ sectionName: string[] }`, every item treated as a headline.
const sections: MenuSource = {
  defaultHidden: [],

  parse(attributes, config) {
    const result: MenuSection[] = sectionMap(attributes[config.attribute ?? 'categories'])
      .filter(([, items]) => items.length)
      .map(([name, items]) => ({ name, main: items, extra: [] }));
    const date = dateAttr(attributes);
    return date ? { date, sections: result } : { sections: result };
  },
};

export const MENU_SOURCES: Record<MenuSourceType, MenuSource> = { nutrislice, sections };

export function getMenuSource(type: string | undefined): MenuSource {
  return MENU_SOURCES[(type ?? 'nutrislice') as MenuSourceType] ?? nutrislice;
}
