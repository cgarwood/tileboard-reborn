<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 320px">
      <q-card-section>
        <div class="text-h6">Confirm Action</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ message }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey" @click="onDialogCancel" />
        <q-btn flat label="Confirm" color="primary" @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';

defineProps<{ message: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
</script>
