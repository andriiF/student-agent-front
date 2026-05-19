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

