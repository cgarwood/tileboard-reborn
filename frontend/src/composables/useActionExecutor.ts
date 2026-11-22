import { useRouter } from 'vue-router';
import { useHomeAssistantStore } from '../stores/home-assistant';
import { describeError, useIssuesStore } from '../stores/issues';
import { useScreensaverStore } from '../stores/screensaver';
import type { ActionConfig, TapAction } from '../types/actions';

/** The config value as a list of action objects, expanding shorthands like `more_info`. */
export function normalizeActions(actions: ActionConfig | undefined): TapAction[] {
  const list = Array.isArray(actions) ? actions : actions ? [actions] : [];
  return list.map((a) => (typeof a === 'string' ? { action: a } : a));
}

export function useActionExecutor() {
  const haStore = useHomeAssistantStore();
  const screensaverStore = useScreensaverStore();
  const issuesStore = useIssuesStore();
  const router = useRouter();

  function executeActions(
    actions: ActionConfig | undefined,
    context: Record<string, unknown> = {},
    onMoreInfo?: (entityId?: string) => void,
  ) {
    const list = normalizeActions(actions);
    if (!list.length) return;

    for (const action of list) {
      if (action.action === 'none') {
        return;
      } else if (action.action === 'more_info') {
        onMoreInfo?.(action.entity);
      } else if (action.action === 'service') {
        const dot = action.service.indexOf('.');
        if (dot === -1) continue;
        void haStore.callService(
          action.service.slice(0, dot),
          action.service.slice(dot + 1),
          action.data,
        );
      } else if (action.action === 'javascript') {
        try {
          new Function('data', action.data)(context); // eslint-disable-line @typescript-eslint/no-implied-eval
        } catch (e) {
          console.error('[executeAction] JavaScript error:', e);
          issuesStore.report('action', `JavaScript action failed: ${describeError(e)}`, {
            detail: action.data,
            notify: true,
          });
        }
      } else if (action.action === 'event') {
        void haStore.fireEvent(action.event, action.data);
      } else if (action.action === 'navigate') {
        if (action.page) {
          void router.push({ name: 'dashboard-page', params: { pageId: action.page } });
        } else if (action.url) {
          window.location.href = action.url;
        }
      } else if (action.action === 'screensaver') {
        screensaverStore.active = true;
      } else {
        const type = String((action as { action?: unknown }).action);
        console.warn('[executeAction] Unknown action type:', action);
        issuesStore.report('config', `Unknown action type "${type}"`, {
          level: 'warning',
          notify: true,
        });
      }
    }
  }

  return { executeActions };
}
