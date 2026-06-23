<template>
  <div class="screensaver-image-slide" :style="{ backgroundImage: `url(${slide.url})` }" />
</template>

<script setup lang="ts">
import type { ImageSlide } from '../../types/screensaver';

defineProps<{ slide: ImageSlide }>();
</script>

<style lang="scss" scoped>
.screensaver-image-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
</style>
