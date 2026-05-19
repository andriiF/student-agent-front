<template>
  <div class="loader-wrap" role="status" aria-live="polite" aria-busy="true">
    <div class="loader-spinner" aria-hidden="true"></div>
    <p v-if="message" class="loader-text">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  }
})
</script>
