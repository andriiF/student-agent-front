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

    <div class="answers-list">
      <div
        v-for="(_, aIndex) in question.answers"
        :key="`a-${aIndex}`"
        class="answer-block"
      >
        <div class="form-group">
          <label>Odpowiedź {{ aIndex + 1 }}</label>
          <input v-model="question.answers[aIndex]" type="text" />
        </div>
        <div class="form-group">
          <label>Wyjaśnienie (opcjonalnie)</label>
          <textarea v-model="question.answerExplanations[aIndex]" rows="2"></textarea>
        </div>
        <label class="chk">
          <input
            type="checkbox"
            :checked="isCorrectIndex(aIndex)"
            @change="toggleCorrect(aIndex, $event)"
          />
          Poprawna
        </label>
      </div>
    </div>

    <button class="btn-save" @click="goBack">Zapisz i wróć</button>
  </div>

  <div v-else class="empty-state">
    Nie znaleziono pytania do edycji.
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDecks } from '@/api/topics.js'

const route = useRoute()
const router = useRouter()

function parseIndex(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

const decks = ref([])

const deckIndex = computed(() => parseIndex(route.query.deck))
const quizIndex = computed(() => parseIndex(route.query.quiz))
const questionIndex = computed(() => parseIndex(route.query.question))

const deck = computed(() => {
  if (deckIndex.value === null) return null
  return decks.value[deckIndex.value] || null
})

const quiz = computed(() => {
  if (!deck.value || quizIndex.value === null) return null
  return deck.value.quizzes?.[quizIndex.value] || null
})

const question = computed(() => {
  if (!quiz.value || questionIndex.value === null) return null
  return quiz.value.questions?.[questionIndex.value] || null
})

function ensureQuestionShape(q) {
  if (!q || typeof q !== 'object') return
  if (!Array.isArray(q.answers)) q.answers = ['', '', '', '']
  if (!Array.isArray(q.correct)) {
    const n = Number(q.correct)
    q.correct = Number.isInteger(n) && n >= 0 ? [n] : [0]
  }
  if (!Array.isArray(q.answerExplanations)) {
    q.answerExplanations = q.answers.map(() => '')
  }
  while (q.answerExplanations.length < q.answers.length) {
    q.answerExplanations.push('')
  }
  if (q.answerExplanations.length > q.answers.length) {
    q.answerExplanations.length = q.answers.length
  }
}

watch(
  question,
  (q) => {
    if (q) ensureQuestionShape(q)
  },
  { immediate: true }
)

function isCorrectIndex(aIndex) {
  const q = question.value
  if (!q) return false
  const c = q.correct
  if (Array.isArray(c)) return c.includes(aIndex)
  const n = Number(c)
  return Number.isInteger(n) && n === aIndex
}

function toggleCorrect(aIndex, ev) {
  const q = question.value
  if (!q) return
  let arr = Array.isArray(q.correct) ? [...q.correct] : [Number(q.correct) || 0]
  arr = arr.filter(i => Number.isInteger(i) && i >= 0)
  if (ev.target.checked) {
    if (!arr.includes(aIndex)) arr.push(aIndex)
  } else {
    arr = arr.filter(i => i !== aIndex)
  }
  arr = [...new Set(arr)].sort((a, b) => a - b)
  if (arr.length === 0) {
    const fallback = q.answers.findIndex(t => String(t ?? '').trim())
    arr = fallback >= 0 ? [fallback] : [0]
    ev.target.checked = true
  }
  q.correct = arr
}

function goBack() {
  const quizEditId = route.query.quizEditId
  if (typeof quizEditId === 'string' && quizEditId.length > 0) {
    if (deckIndex.value === null) {
      router.push({ name: 'topic' })
      return
    }
    const dBack = decks.value[deckIndex.value]
    const topic = dBack ? String(dBack.uuid ?? dBack.id ?? deckIndex.value) : String(deckIndex.value)
    router.push({ name: 'quiz.edit', params: { topic, id: quizEditId } })
    return
  }

  if (deckIndex.value === null) {
    router.push({ name: 'topic' })
    return
  }
  const d = decks.value[deckIndex.value]
  const deckParam = d ? String(d.uuid ?? d.id ?? deckIndex.value) : String(deckIndex.value)
  const query = {}
  if (quizIndex.value !== null) query.quiz = String(quizIndex.value)
  router.push({ name: 'set-edit', params: { id: deckParam }, query })
}

onMounted(async () => {
  try {
    decks.value = await fetchDecks()
  } catch {
    /* ignore */
  }
})
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
.answers-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 0.5rem; }
.answer-block { padding: 10px 12px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: var(--bg-secondary); }
.chk { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); cursor: pointer; user-select: none; margin-top: 4px; }
.chk input { width: auto; margin: 0; cursor: pointer; }
.btn-save { margin-top: 6px; padding: 10px 16px; border-radius: var(--radius-md); border: none; background: var(--purple); color: #fff; font-size: 14px; }
.empty-state { font-size: 13px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-md); padding: 12px; }
</style>
