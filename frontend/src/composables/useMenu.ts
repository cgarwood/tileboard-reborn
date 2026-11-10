import { computed } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useMinuteClock } from './useMinuteClock';
import { getMenuSource } from '../utils/menuSources';
import { localDateStr } from '../utils/formatters';
import type { MenuConfig, MenuDay } from '../types/menu';

function parseMinutes(value: string | undefined): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

/**
 * Picks today's or tomorrow's menu for a menu config. Entities are matched to days by their
 * `date` attribute when they have one, so a "today" sensor that hasn't refreshed since midnight
 * isn't shown as today's menu. `menu` is null when the chosen day has no menu.
 */
export function useMenu(config: () => MenuConfig) {
  const haStore = useHomeAssistantStore();
  const clock = useMinuteClock();

  const source = computed(() => getMenuSource(config().source));

  const tomorrowEntity = computed(
    () => config().tomorrow_entity ?? source.value.tomorrowEntity?.(config().entity),
  );

  const hidden = computed(
    () =>
      new Set((config().hide_sections ?? source.value.defaultHidden).map((s) => s.toLowerCase())),
  );

  function load(entityId: string | undefined): MenuDay | null {
    const entity = entityId ? haStore.states[entityId] : undefined;
    if (!entity) return null;
    const day = source.value.parse(entity.attributes, config());
    return {
      ...day,
      sections: day.sections.filter((s) => !hidden.value.has(s.name.toLowerCase())),
    };
  }

  const todayStr = computed(() => localDateStr(clock.value));
  const tomorrowStr = computed(() => {
    const d = new Date(clock.value);
    d.setDate(d.getDate() + 1);
    return localDateStr(d);
  });

  const byDate = computed(() => {
    const result = new Map<string, MenuDay>();
    const entries: [MenuDay | null, string][] = [
      [load(config().entity), todayStr.value],
      [load(tomorrowEntity.value), tomorrowStr.value],
    ];
    for (const [day, assumedDate] of entries) {
      if (day?.sections.length) result.set(day.date ?? assumedDate, day);
    }
    return result;
  });

  const todayMenu = computed(() => byDate.value.get(todayStr.value) ?? null);
  const tomorrowMenu = computed(() => byDate.value.get(tomorrowStr.value) ?? null);

  const day = computed<'today' | 'tomorrow'>(() => {
    const switchAt = parseMinutes(config().switch_at);
    const now = clock.value.getHours() * 60 + clock.value.getMinutes();
    if (switchAt > 0 && now >= switchAt) return 'tomorrow';
    if (config().fallback_to_tomorrow !== false && !todayMenu.value && tomorrowMenu.value) {
      return 'tomorrow';
    }
    return 'today';
  });

  const menu = computed(() => (day.value === 'today' ? todayMenu.value : tomorrowMenu.value));

  const date = computed(() => {
    const d = new Date(clock.value);
    if (day.value === 'tomorrow') d.setDate(d.getDate() + 1);
    return d;
  });

  return { day, date, menu };
}
