<template>
  <div>
    <div v-if="!selectedDeck" class="pick-wrap">
      <div class="pick-title">Wybierz zestaw</div>
      <button
        v-for="(deck, i) in decks"
        :key="`deck-${i}`"
        class="pick-item"
        @click="selectDeck(i)"
      >
        <span>{{ deck.name }}</span>
        <span class="pick-meta">{{ (deck.quizzes || []).length }} quizów</span>
      </button>
    </div>

    <div v-else-if="!selectedQuiz" class="pick-wrap">
      <div class="pick-head">
        <button class="btn-back" @click="selectedDeckIndex = null">←</button>
        <div class="pick-title">{{ selectedDeck.name }}</div>
      </div>
      <button
        v-for="(quiz, i) in selectedDeck.quizzes || []"
        :key="`quiz-${i}`"
        class="pick-item"
        @click="selectQuiz(i)"
      >
        <span>{{ quiz.name }}</span>
        <span class="pick-meta">{{ (quiz.questions || []).length }} pytań</span>
      </button>
      <div v-if="(selectedDeck.quizzes || []).length === 0" class="empty-state">
        Ten zestaw nie ma jeszcze quizów. Dodaj quiz w widoku tworzenia zestawu.
      </div>
    </div>

    <template v-else-if="mode === 'play'">
      <div class="qp-row">
        <div
          v-for="(_, i) in questions"
          :key="i"
          class="qp-dot"
          :class="{ done: i < idx, cur: i === idx }"
        ></div>
      </div>

      <div v-if="idx >= questions.length" class="quiz-score">
        <div class="score-val">{{ score }}/{{ questions.length }}</div>
        <div class="score-label">poprawnych odpowiedzi</div>
        <div class="score-pct">{{ Math.round(score / questions.length * 100) }}% skuteczności</div>
        <button class="btn-restart" @click="restart">Spróbuj ponownie</button>
        <button class="btn-restart" @click="selectedQuizIndex = null">Wybierz inny quiz</button>
        <button class="btn-restart" @click="goToEdit">Przejdź do edycji</button>
      </div>

      <template v-else>
        <div class="quiz-q">{{ questions[idx].q }}</div>
        <div class="quiz-opts">
          <button
            v-for="(opt, i) in questions[idx].answers"
            :key="i"
            class="quiz-opt"
            :class="{
              correct: answered && correctIndexSet(questions[idx]).has(i),
              wrong: answered && i === selected && !correctIndexSet(questions[idx]).has(i)
            }"
            @click="answer(i)"
          >{{ opt }}</button>
        </div>
      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDecks } from '@/api/topics.js'

const route = useRoute()
const router = useRouter()
const idx = ref(0)
const score = ref(0)
const answered = ref(false)
const selected = ref(null)
const decks = ref([])
const selectedDeckIndex = ref(null)
const selectedQuizIndex = ref(null)
const mode = ref('play')

const selectedDeck = computed(() => {
  if (selectedDeckIndex.value === null) return null
  return decks.value[selectedDeckIndex.value]
})

const selectedQuiz = computed(() => {
  if (!selectedDeck.value || selectedQuizIndex.value === null) return null
  return selectedDeck.value.quizzes?.[selectedQuizIndex.value] || null
})

const questions = computed(() => selectedQuiz.value?.questions || [])

function correctIndexSet(question) {
  if (!question) return new Set()
  const c = question.correct
  if (Array.isArray(c)) return new Set(c.filter(i => Number.isInteger(i) && i >= 0))
  const n = Number(c)
  if (Number.isInteger(n) && n >= 0) return new Set([n])
  return new Set([0])
}

function parseIndex(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

watch(
  () => route.fullPath,
  () => {
    mode.value = 'play'
    selectedDeckIndex.value = parseIndex(route.params.id) ?? parseIndex(route.query.deck)
    selectedQuizIndex.value = parseIndex(route.params.quizId) ?? parseIndex(route.query.quiz)
  },
  { immediate: true }
)

function selectDeck(i) {
  selectedDeckIndex.value = i
  selectedQuizIndex.value = null
  router.replace({ name: route.name, query: { deck: i } })
}

function selectQuiz(i) {
  selectedQuizIndex.value = i
  if (selectedDeckIndex.value !== null) {
    router.replace({ name: 'quiz-play-by-id', params: { id: selectedDeckIndex.value, quizId: i } })
  } else {
    router.replace({ name: route.name, query: { quiz: i } })
  }
  restart()
}

function answer(i) {
  if (!questions.value.length) return
  if (answered.value) return
  answered.value = true
  selected.value = i
  if (correctIndexSet(questions.value[idx.value]).has(i)) score.value++
  setTimeout(() => { idx.value++; answered.value = false; selected.value = null }, 900)
}

function restart() {
  idx.value = 0; score.value = 0; answered.value = false; selected.value = null
}

function goToEdit() {
  const d = selectedDeck.value
  if (!d || selectedQuizIndex.value === null) {
    router.push({ name: 'topic' })
    return
  }
  const deckKey = String(d.uuid ?? d.id ?? selectedDeckIndex.value)
  router.push({ name: 'quiz.edit', params: { topic: deckKey, id: `${deckKey}-${selectedQuizIndex.value}` } })
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
.pick-wrap { display: flex; flex-direction: column; gap: 10px; }
.pick-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.pick-title { font-size: 16px; font-weight: 500; margin-bottom: 6px; }
.pick-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: var(--radius-md); border: 0.5px solid var(--border); background: var(--bg-primary); font-size: 14px; text-align: left; }
.pick-item:hover { border-color: var(--border-hover); background: var(--bg-secondary); }
.pick-meta { font-size: 12px; color: var(--text-secondary); }
.empty-state { font-size: 13px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-md); padding: 12px; }
.btn-back { background: transparent; border: none; font-size: 20px; color: var(--text-secondary); padding: 4px; line-height: 1; }
.qp-row { display: flex; gap: 6px; margin-bottom: 1.5rem; }
.qp-dot { flex: 1; height: 4px; border-radius: 2px; background: var(--bg-secondary); }
.qp-dot.done { background: var(--purple); }
.qp-dot.cur { background: #AFA9EC; }
.quiz-q { font-size: 16px; font-weight: 500; margin-bottom: 1.5rem; line-height: 1.5; }
.quiz-opts { display: flex; flex-direction: column; gap: 10px; }
.quiz-opt { padding: 12px 16px; border-radius: var(--radius-md); border: 0.5px solid var(--border); background: var(--bg-primary); font-size: 15px; text-align: left; transition: all 0.15s; }
.quiz-opt:hover:not(.correct):not(.wrong) { border-color: var(--border-hover); background: var(--bg-secondary); }
.quiz-opt.correct { border-color: var(--success); background: var(--success-light); color: #0F6E56; }
.quiz-opt.wrong { border-color: var(--danger); background: var(--danger-light); color: #A32D2D; }
.quiz-score { text-align: center; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-lg); }
.score-val { font-size: 48px; font-weight: 500; }
.score-label { font-size: 16px; color: var(--text-secondary); margin-top: 4px; }
.score-pct { font-size: 13px; color: var(--text-secondary); margin-top: 8px; }
.btn-restart { margin-top: 1.5rem; padding: 10px 24px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: transparent; font-size: 14px; }
.btn-restart:hover { background: var(--bg-primary); }
</style>
