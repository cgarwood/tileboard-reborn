import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useConfigStore } from '../stores/config';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { useRestrictionsStore } from '../stores/restrictions';
import type { Config, RestrictionConfig } from '../types/config';
import type { Widget } from '../types/widgets';
import RestrictionConfirmDialog from '../components/dialogs/RestrictionConfirmDialog.vue';
import RestrictionPinDialog from '../components/dialogs/RestrictionPinDialog.vue';

type RestrictionDef = RestrictionConfig[string];

export function useRestriction(widget: () => Widget) {
  const $q = useQuasar();
  const configStore = useConfigStore();
  const haStore = useHomeAssistantStore();
  const restrictionsStore = useRestrictionsStore();

  const restrictionId = computed(() => widget().restriction);

  const restrictionDef = computed((): RestrictionDef | null => {
    const id = restrictionId.value;
    if (!id) return null;
    return (configStore.config as Config | null)?.restrictions?.[id] ?? null;
  });

  const isActive = computed(() => {
    const def = restrictionDef.value;
    if (!def) return false;
    if (!def.conditions?.length) return true;
    return def.conditions.every((c) => haStore.states[c.entity]?.state === c.state);
  });

  const isLocked = computed(
    () => isActive.value && !restrictionsStore.isUnlocked(restrictionId.value ?? ''),
  );

  function withUnlock(action: () => void) {
    if (!isLocked.value) {
      action();
      return;
    }

    const def = restrictionDef.value!;
    const id = restrictionId.value!;

    function complete() {
      if (def.unlock_time) restrictionsStore.unlock(id, def.unlock_time);
      action();
    }

    if (def.pin) {
      $q.dialog({
        component: RestrictionPinDialog,
        componentProps: {
          message: def.pin.message,
          validate: (pin: string) => pin === def.pin!.code.toString(),
        },
      }).onOk(complete);
    } else {
      $q.dialog({
        component: RestrictionConfirmDialog,
        componentProps: { message: def.confirm!.message },
      }).onOk(complete);
    }
  }

  return { isLocked, withUnlock };
}
