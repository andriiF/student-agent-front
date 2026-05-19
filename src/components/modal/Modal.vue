<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="onClose"
    >
      <div class="modal-dialog">
        <header class="modal-header">
          <h2 :id="titleId" class="modal-title">{{ title }}</h2>
          <button
            type="button"
            class="modal-close"
            aria-label="Zamknij"
            @click="onClose"
          >
            ×
          </button>
        </header>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useId } from 'vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  open: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const titleId = `modal-title-${useId()}`

function onClose() {
  emit('close')
}
</script>
