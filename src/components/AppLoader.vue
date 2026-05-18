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

<style scoped>
.loader-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 2.5rem 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--purple-light);
  border-top-color: var(--purple);
  border-radius: 50%;
  animation: loader-spin 0.75s linear infinite;
}

.loader-text {
  font-size: 14px;
  color: var(--text-secondary);
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
