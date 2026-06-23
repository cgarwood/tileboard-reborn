import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useRestrictionsStore = defineStore('restrictions', () => {
  const unlocked = ref<Record<string, boolean>>({});
  const timers: Record<string, ReturnType<typeof setTimeout>> = {};

  function unlock(id: string, seconds: number) {
    if (timers[id]) clearTimeout(timers[id]);
    unlocked.value[id] = true;
    timers[id] = setTimeout(() => {
      unlocked.value[id] = false;
      delete timers[id];
    }, seconds * 1000);
  }

  function isUnlocked(id: string): boolean {
    return unlocked.value[id] === true;
  }

  function lock(id: string) {
    if (timers[id]) clearTimeout(timers[id]);
    delete timers[id];
    unlocked.value[id] = false;
  }

  return { unlocked, unlock, isUnlocked, lock };
});
