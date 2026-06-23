<template>
  <q-dialog v-model="open" @before-hide="stopStream" @hide="emit('hide')">
    <q-card class="camera-dialog">
      <img ref="imgRef" :src="activeSrc" class="camera-dialog__img" alt="" />
      <div class="camera-dialog__bar">
        <span class="camera-dialog__title">{{ title }}</span>
        <q-btn flat round dense icon="close" color="white" v-close-popup />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  streamUrl: string;
  title: string;
}>();

const emit = defineEmits<{ hide: [] }>();

// Replacing src with a valid data URI forces Chrome to cancel the in-flight
// MJPEG request. Setting src="" is treated as the current page URL and does
// not terminate the stream connection.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const open = ref(true);
const activeSrc = ref(props.streamUrl);
const imgRef = ref<HTMLImageElement | null>(null);

function stopStream() {
  // Direct DOM write first so the browser cancels the request immediately,
  // before Vue's next tick flushes the reactive update.
  if (imgRef.value) imgRef.value.src = BLANK;
  activeSrc.value = BLANK;
}
</script>

<style lang="scss" scoped>
.camera-dialog {
  width: 90vw;
  max-width: 1200px;
  background: #000;
  position: relative;
  overflow: hidden;
}

.camera-dialog__img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
}

.camera-dialog__bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 8px 8px 8px 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent);
  color: white;
  pointer-events: none;

  .q-btn {
    pointer-events: all;
  }
}

.camera-dialog__title {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
}
</style>
