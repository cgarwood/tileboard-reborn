/** One serving line (or menu section) for a day. */
export interface MenuSection {
  name: string;
  /** Headline items, e.g. the entrees on that line. */
  main: string[];
  /** Everything else worth listing: sides, grains, toppings. */
  extra: string[];
}

export interface MenuDay {
  /** Local date ("2026-11-10") the menu is for, when the entity reports one. */
  date?: string;
  sections: MenuSection[];
}

export type MenuSourceType = 'nutrislice' | 'sections';

/** Shared by the `menu` widget and the screensaver `menus` entries. */
export interface MenuConfig {
  /** Entity holding today's menu. */
  entity: string;
  title?: string;
  source?: MenuSourceType;
  /** `sections` source: attribute holding `{ sectionName: string[] }`. */
  attribute?: string;
  /** Entity holding tomorrow's menu. Derived from `entity` for nutrislice. */
  tomorrow_entity?: string;
  /** "HH:MM" from which tomorrow's menu is shown. "00:00" (default) always shows today. */
  switch_at?: string;
  /** Section names to leave out (case-insensitive). */
  hide_sections?: string[];
  /** Show tomorrow's menu when there is none today. Default true. */
  fallback_to_tomorrow?: boolean;
}
