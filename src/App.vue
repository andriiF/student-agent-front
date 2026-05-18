<template>
  <div>
    <RouterView />
    <Teleport to="body">
      <div v-if="toastState.visible" class="toast-root" role="status" aria-live="polite">
        <div class="toast toast--success">{{ toastState.message }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { toastState } from '@/composables/toast.js'
</script>
