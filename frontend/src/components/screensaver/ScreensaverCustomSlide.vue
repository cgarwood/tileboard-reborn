<template>
  <!-- Markup comes from the dashboard config; useCustomSlide escapes interpolated entity values -->
  <div
    v-if="content.html"
    class="custom-slide custom-slide--html"
    :class="slideClass"
    v-html="content.html"
  />
  <div v-else class="custom-slide custom-slide--card" :class="slideClass">
    <q-icon v-if="content.icon" :name="content.icon" class="custom-slide__watermark" />
    <div v-if="content.header" class="custom-slide__header">{{ content.header }}</div>
    <q-icon v-if="content.icon" :name="content.icon" class="custom-slide__icon" />
    <div v-if="content.title" class="custom-slide__title">{{ content.title }}</div>
    <!-- prettier-ignore -->
    <div v-if="content.text" class="custom-slide__text" :class="textSizeClass">{{ content.text }}</div>
    <div v-if="content.footer" class="custom-slide__footer">{{ content.footer }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue';
import type { CustomSlideContent } from '../../composables/useCustomSlide';

const props = defineProps<{
  content: CustomSlideContent;
  css?: string | undefined;
  slideClass?: string | undefined;
}>();

const textSizeClass = computed(() => {
  const length = props.content.text?.length ?? 0;
  if (length > 280) return 'custom-slide__text--long';
  if (length > 120) return 'custom-slide__text--medium';
  return null;
});

// Config CSS is global (scoped styles can't reach it), so it lives only while the slide is mounted
let styleEl: HTMLStyleElement | null = null;

watch(
  () => props.css,
  (css) => {
    if (!css) {
      styleEl?.remove();
      styleEl = null;
      return;
    }
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.dataset.screensaverCustomSlide = '';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  },
  { immediate: true },
);

onUnmounted(() => styleEl?.remove());
</script>

<style lang="scss" scoped>
.custom-slide {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, rgba(10, 22, 40, 0.72) 0%, rgba(22, 32, 50, 0.72) 100%),
    var(--slide-bg, none) center / cover no-repeat;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  user-select: none;
  overflow: hidden;

  &--card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px 10vw 30vh;
    text-align: center;
  }

  &--html {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 40px 30vh;
  }

  &__watermark {
    position: absolute;
    bottom: -180px;
    left: -180px;
    font-size: 980px;
    opacity: 0.06;
  }

  &__header {
    font-size: 1.4rem;
    font-weight: 300;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.55;
  }

  &__icon {
    font-size: 5rem;
    opacity: 0.9;
  }

  &__title {
    font-size: 2rem;
    font-weight: 500;
  }

  &__text {
    max-width: 1100px;
    font-size: 3rem;
    font-weight: 300;
    line-height: 1.3;
    white-space: pre-line;

    &--medium {
      font-size: 2.25rem;
    }

    &--long {
      font-size: 1.6rem;
    }
  }

  &__footer {
    font-size: 1.1rem;
    opacity: 0.6;
    letter-spacing: 0.05em;
  }
}
</style>
