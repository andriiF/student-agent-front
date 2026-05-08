<template>
  <div v-if="question && quiz && deck" class="edit-wrap">
    <div class="pick-head">
      <button class="btn-back" @click="goBack">←</button>
      <div class="pick-title">Edycja odpowiedzi</div>
    </div>

    <div class="context-row">
      <div class="context-item"><strong>Zestaw:</strong> {{ deck.name }}</div>
      <div class="context-item"><strong>Quiz:</strong> {{ quiz.name }}</div>
    </div>

    <div class="form-group">
      <label>Treść pytania</label>
      <textarea v-model="question.q" rows="2"></textarea>
    </div>

    <div class="answers-grid">
      <div class="form-group answer-item" v-for="(answer, aIndex) in question.answers" :key="`a-${aIndex}`">
        <label>Odpowiedź {{ aIndex + 1 }}</label>
        <input v-model="question.answers[aIndex]" type="text" />
      </div>
    </div>

    <div class="form-group">
      <label>Poprawna odpowiedź</label>
      <select v-model.number="question.correct">
        <option :value="0">Odpowiedź 1</option>
        <option :value="1">Odpowiedź 2</option>
        <option :value="2">Odpowiedź 3</option>
        <option :value="3">Odpowiedź 4</option>
      </select>
    </div>

    <button class="btn-save" @click="goBack">Zapisz i wróć</button>
  </div>

  <div v-else class="empty-state">
    Nie znaleziono pytania do edycji.
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { store } from '@/entities/store.js'

const route = useRoute()
const router = useRouter()

function parseIndex(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

const deckIndex = computed(() => parseIndex(route.query.deck))
const quizIndex = computed(() => parseIndex(route.query.quiz))
const questionIndex = computed(() => parseIndex(route.query.question))

const deck = computed(() => {
  if (deckIndex.value === null) return null
  return store.decks[deckIndex.value] || null
})

const quiz = computed(() => {
  if (!deck.value || quizIndex.value === null) return null
  return deck.value.quizzes?.[quizIndex.value] || null
})

const question = computed(() => {
  if (!quiz.value || questionIndex.value === null) return null
  return quiz.value.questions?.[questionIndex.value] || null
})

function goBack() {
  const quizEditId = route.query.quizEditId
  if (typeof quizEditId === 'string' && quizEditId.length > 0) {
    router.push({ name: 'quiz-edit-by-id', params: { id: quizEditId } })
    return
  }

  if (deckIndex.value === null) {
    router.push({ name: 'quiz-edit' })
    return
  }
  const query = {}
  if (quizIndex.value !== null) query.quiz = quizIndex.value
  router.push({ name: 'set-edit', params: { id: deckIndex.value }, query })
}
</script>

<style scoped>
.edit-wrap { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; }
.pick-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.pick-title { font-size: 16px; font-weight: 500; }
.btn-back { background: transparent; border: none; font-size: 20px; color: var(--text-secondary); padding: 4px; line-height: 1; }
.context-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.context-item { font-size: 13px; color: var(--text-secondary); }
.form-group { margin-bottom: 0.8rem; }
.form-group label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: var(--bg-primary); color: var(--text-primary); font-size: 14px; }
.answers-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.btn-save { margin-top: 6px; padding: 10px 16px; border-radius: var(--radius-md); border: none; background: var(--purple); color: #fff; font-size: 14px; }
.empty-state { font-size: 13px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-md); padding: 12px; }

@media (max-width: 640px) {
  .answers-grid { grid-template-columns: 1fr; }
}
</style>
