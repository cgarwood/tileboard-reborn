<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="pin-dialog">
      <q-card-section>
        <div class="text-h6">PIN Required</div>
        <div class="text-body2 q-mt-xs text-grey-6">{{ message }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="pin-display" :class="{ 'pin-display--error': pinError }">
          <span v-for="i in MAX_DIGITS" :key="i" class="pin-dot">
            {{ entered.length >= i ? '•' : '' }}
          </span>
        </div>
        <div v-if="pinError" class="text-negative text-caption text-center q-mt-xs">
          Incorrect PIN
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="pin-keypad">
          <q-btn
            v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
            :key="n"
            flat
            :label="String(n)"
            class="pin-key"
            @click="pressDigit(String(n))"
          />
          <div class="pin-key-empty" />
          <q-btn flat label="0" class="pin-key" @click="pressDigit('0')" />
          <q-btn flat icon="backspace" class="pin-key" @click="pressBackspace" />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none">
        <q-btn flat label="Cancel" color="grey" @click="onDialogCancel" />
        <q-btn flat label="Submit" color="primary" :disable="!entered.length" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';

const props = defineProps<{ message: string; validate: (pin: string) => boolean }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const MAX_DIGITS = 8;
const entered = ref('');
const pinError = ref(false);

function pressDigit(d: string) {
  if (entered.value.length < MAX_DIGITS) entered.value += d;
}

function pressBackspace() {
  entered.value = entered.value.slice(0, -1);
}

function onSubmit() {
  if (!entered.value.length) return;
  if (props.validate(entered.value)) {
    onDialogOK();
  } else {
    pinError.value = true;
    entered.value = '';
    setTimeout(() => {
      pinError.value = false;
    }, 1000);
  }
}
</script>

<style lang="scss" scoped>
.pin-dialog {
  width: 280px;
}

.pin-display {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.15);
  min-height: 48px;
  align-items: center;

  &--error {
    border-color: var(--q-negative);
    animation: pin-shake 0.4s ease;
  }
}

.pin-dot {
  font-size: 1.6rem;
  line-height: 1;
  width: 18px;
  text-align: center;
  color: var(--q-primary);
}

.pin-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.pin-key {
  font-size: 1.3rem;
  height: 56px;
  border-radius: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}

.pin-key-empty {
  height: 56px;
}

@keyframes pin-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}
</style>
