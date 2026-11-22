<template>
  <q-dialog v-model="dialogOpen" @hide="emit('hide')">
    <q-card class="issues-dialog">
      <div class="issues-dialog__header">
        <div class="issues-dialog__header-text">
          <div class="issues-dialog__title">Issues</div>
          <div class="issues-dialog__subtitle">{{ summary }}</div>
        </div>
        <q-btn
          flat
          round
          dense
          icon="mdi-close"
          color="white"
          aria-label="Close"
          @click="dialogOpen = false"
        />
      </div>

      <div class="issues-dialog__content">
        <div v-if="!issuesStore.issues.length" class="issues-dialog__empty">
          <q-icon name="mdi-check-circle-outline" size="40px" />
          No issues
        </div>
        <div
          v-for="issue in issuesStore.issues"
          :key="issue.key"
          class="issue"
          :class="`issue--${issue.level}`"
        >
          <q-icon :name="SOURCE_ICONS[issue.source]" size="20px" class="issue__icon" />
          <div class="issue__body">
            <div class="issue__message">{{ issue.message }}</div>
            <pre v-if="issue.detail" class="issue__detail">{{ issue.detail }}</pre>
            <div class="issue__meta">
              {{ SOURCE_LABELS[issue.source] }} · {{ timeAgo(issue.time) }}
            </div>
          </div>
        </div>
      </div>

      <q-separator dark />
      <div class="issues-dialog__actions">
        <q-btn
          flat
          no-caps
          color="white"
          icon="mdi-notification-clear-all"
          label="Clear"
          :disable="!issuesStore.issues.length"
          @click="issuesStore.clear()"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMinuteClock } from '../../composables/useMinuteClock';
import { useIssuesStore, type IssueSource } from '../../stores/issues';

const emit = defineEmits<{ hide: [] }>();

const issuesStore = useIssuesStore();
const dialogOpen = ref(true);
const minuteClock = useMinuteClock();

const SOURCE_ICONS: Record<IssueSource, string> = {
  config: 'mdi-file-cog-outline',
  template: 'mdi-code-braces',
  action: 'mdi-gesture-tap',
  homeassistant: 'mdi-home-assistant',
  sendspin: 'mdi-speaker-wireless',
  resource: 'mdi-file-download-outline',
  screensaver: 'mdi-image-multiple-outline',
  events: 'mdi-broadcast',
};

const SOURCE_LABELS: Record<IssueSource, string> = {
  config: 'Config',
  template: 'Template',
  action: 'Action',
  homeassistant: 'Home Assistant',
  sendspin: 'Sendspin',
  resource: 'Resource',
  screensaver: 'Screensaver',
  events: 'Events',
};

const summary = computed(() => {
  const errors = issuesStore.errorCount;
  const warnings = issuesStore.issues.length - errors;
  const parts = [];
  if (errors) parts.push(`${errors} error${errors === 1 ? '' : 's'}`);
  if (warnings) parts.push(`${warnings} warning${warnings === 1 ? '' : 's'}`);
  return parts.join(', ') || 'All clear';
});

function timeAgo(time: number) {
  void minuteClock.value; // refresh every minute
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
</script>

<style lang="scss" scoped>
// Matches DeviceInfoDialog.
.issues-dialog {
  width: min(520px, 95vw);
  background: #1e1e2e;
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 12px 16px 20px;
    background: rgba(255, 255, 255, 0.06);
    min-height: 64px;
    flex-shrink: 0;
  }

  &__header-text {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 500;
  }

  &__subtitle {
    font-size: 0.75rem;
    opacity: 0.65;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }

  &__content {
    max-height: 70vh;
    overflow-y: auto;
    padding: 12px 20px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    opacity: 0.6;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px;
  }
}

.issue {
  display: flex;
  gap: 12px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  &--error .issue__icon {
    color: #ff8a80;
  }

  &--warning .issue__icon {
    color: #ffd54f;
  }

  &__icon {
    margin-top: 1px;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__message {
    font-size: 0.9rem;
    line-height: 1.3;
  }

  &__detail {
    margin: 6px 0 0;
    padding: 6px 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 8em;
    overflow-y: auto;
  }

  &__meta {
    margin-top: 4px;
    font-size: 0.7rem;
    opacity: 0.55;
  }
}
</style>
