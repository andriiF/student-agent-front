<template>
  <div>
    <div class="add-header">
      <button class="btn-back" @click="$emit('go', 'home')">←</button>
      <span class="add-title">Nowy zestaw</span>
    </div>

    <div class="form-group">
      <label>Nazwa zestawu</label>
      <input v-model="deckName" type="text" placeholder="np. Matura 2026" />
    </div>

    <div class="save-row">
      <button class="btn-save" :disabled="!deckName.trim() || saving" @click="save">Utwórz zestaw</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createDeck } from '@/api/topics.js'

const emit = defineEmits(['go'])

const deckName = ref('')
const saving = ref(false)

async function save() {
  if (!deckName.value.trim() || saving.value) return
  saving.value = true
  try {
    await createDeck(deckName.value.trim())
    emit('go', 'topic')
  } catch {
    /* błąd sieci */
  } finally {
    saving.value = false
  }
}
</script>
