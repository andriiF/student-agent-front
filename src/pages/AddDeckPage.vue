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
      <button class="btn-save" :disabled="!deckName.trim()" @click="save">Utwórz zestaw</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { store } from '../entities/store.js'

const emit = defineEmits(['go'])

const deckName = ref('')

const subjectMeta = {
  Biologia:    { icon: '🧬', color: '#EEEDFE', fillColor: '#7F77DD' },
  Matematyka:  { icon: '∫',  color: '#E1F5EE', fillColor: '#1D9E75' },
  Chemia:      { icon: '⚗', color: '#FBEAF0', fillColor: '#D4537E' },
  Fizyka:      { icon: '⚛', color: '#E6F1FB', fillColor: '#378ADD' },
  Historia:    { icon: '📜', color: '#FAEEDA', fillColor: '#BA7517' },
  Prawo:       { icon: '⚖', color: '#FAEEDA', fillColor: '#BA7517' },
  Inne:        { icon: '📚', color: '#F1EFE8', fillColor: '#888780' },
}

function save() {
  const meta = subjectMeta['Inne']
  store.addDeck({
    name: deckName.value.trim() || 'Nowy zestaw',
    ...meta,
    pct: 0,
    cards: [],
    quizzes: []
  })
  emit('go', 'sets')
}
</script>

<style scoped>
.add-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
.btn-back { background: transparent; border: none; font-size: 20px; color: var(--text-secondary); padding: 4px; line-height: 1; }
.add-title { font-size: 18px; font-weight: 500; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.form-group input { width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: var(--bg-primary); color: var(--text-primary); font-size: 14px; }
.save-row { display: flex; align-items: center; gap: 12px; }
.btn-save { padding: 10px 24px; border-radius: var(--radius-md); border: none; background: var(--purple); color: #fff; font-size: 14px; font-weight: 500; transition: background 0.15s; }
.btn-save:hover:not(:disabled) { background: var(--purple-dark); }
.btn-save:disabled { opacity: 0.4; cursor: default; }
</style>
