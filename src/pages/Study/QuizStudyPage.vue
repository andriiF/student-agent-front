<template>
  <AppLayout>
    <div class="study-header">
      <div class="study-header-main">
        <RouterLink
          :to="{ name: 'dashboard.topic', params: { topicId } }"
          class="btn-back"
          aria-label="Wróć do listy quizów"
        >←</RouterLink>
        <div>
          <div class="study-title">{{ quiz?.name ?? 'Quiz' }}</div>
          <div v-if="deck?.name" class="study-sub">{{ deck.name }}</div>
        </div>
      </div>
      <div class="study-header-actions">
        <button
          v-if="hasSavedProgress && !finished && !loadLoading"
          type="button"
          class="btn-reset-progress"
          :disabled="resettingProgress"
          @click="startFromBeginning"
        >
          Zacznij od nowa
        </button>
        <span class="mode-badge">Tryb nauki</span>
      </div>
    </div>

    <div v-if="loadError" class="empty-note">{{ loadError }}</div>
    <AppLoader v-else-if="loadLoading" message="Ładowanie pytań…" />

    <div v-else-if="!questions.length" class="empty-panel">
      <p>Ten quiz nie ma jeszcze pytań.</p>
      <RouterLink
        class="btn-link"
        :to="{ name: 'dashboard.topic', params: { topicId } }"
      >
        Wróć do listy quizów
      </RouterLink>
    </div>

    <template v-else-if="finished">
      <div class="quiz-score">
        <div class="score-val">{{ score }}/{{ questions.length }}</div>
        <div class="score-label">poprawnych odpowiedzi</div>
        <div class="score-pct">
          {{ questions.length ? Math.round((score / questions.length) * 100) : 0 }}% skuteczności
        </div>
        <button type="button" class="btn-action" @click="restart">Spróbuj ponownie</button>
        <RouterLink
          class="btn-action btn-action--ghost"
          :to="{ name: 'dashboard.topic', params: { topicId } }"
        >
          Wróć do listy quizów
        </RouterLink>
      </div>
    </template>

    <AppLoader v-else-if="questionLoading" message="Ładowanie pytania…" />

    <div
      v-else-if="questions.length && !finished && !currentQuestionReady"
      class="empty-note"
    >
      Nie udało się wczytać pytania.
    </div>

    <template v-else-if="currentQuestionReady">
      <div class="qp-row">
        <div
          v-for="(_, i) in questions"
          :key="i"
          class="qp-dot"
          :class="{ done: i < currentIndex, cur: i === currentIndex }"
        ></div>
      </div>

      <div class="question-meta">
        Pytanie {{ currentIndex + 1 }} / {{ questions.length }}
      </div>

      <div class="quiz-q">{{ currentQuestion.name }}</div>

      <div class="quiz-opts">
        <button
          v-for="(answer, i) in currentQuestion.answers"
          :key="i"
          type="button"
          class="quiz-opt"
          :class="optionClass(i)"
          :disabled="revealed"
          @click="selectAnswer(i)"
        >
          {{ answer.name }}
        </button>
      </div>

      <div v-if="revealed" class="reveal-panel">
        <div class="reveal-title">
          {{ isCurrentCorrect ? 'Dobrze!' : 'Nie tym razem' }}
        </div>
        <template v-if="explanationBlocks.length">
        <div
          v-for="block in explanationBlocks"
          :key="block.key"
          class="expl-block"
          :class="{ 'expl-block--correct': block.isCorrect }"
        >
          <div class="expl-answer">{{ block.label }}</div>
          <p class="expl-text">{{ block.explanation }}</p>
        </div>
        </template>
      </div>

      <div class="study-actions">
        <button
          v-if="canGoPrev"
          type="button"
          class="btn-action btn-action--ghost"
          @click="goPrev"
        >
          Poprzednie pytanie
        </button>
        <button
          v-if="revealed"
          type="button"
          class="btn-action btn-action--next"
          @click="goNext"
        >
          {{ isLastQuestion ? 'Zakończ test' : 'Następne pytanie' }}
        </button>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDeck } from '@/api/topics.js'
import {
  fetchQuizForStudy,
  isStudyQuestionLoaded,
  loadStudyQuestion
} from '@/api/quizzes.js'
import {
  clearQuizPlayProgress,
  countCorrectFromQuizPlayProgress,
  fetchQuizPlayProgress,
  getResumeQuestionIndexFromProgress,
  isQuizFullyAnsweredInProgress,
  saveQuizPlayAnswer
} from '@/api/quizplay.js'
import AppLayout from '@/layout/AppLayout.vue'
import AppLoader from '@/components/AppLoader.vue'

const route = useRoute()

const deck = ref(null)
const quiz = ref(null)
const loadLoading = ref(true)
const questionLoading = ref(false)
const resettingProgress = ref(false)
const loadError = ref('')
const quizProgress = ref([])

const currentIndex = ref(0)
const selectedIndex = ref(null)
const revealed = ref(false)
const questionStates = ref({})
const finished = ref(false)

const topicId = computed(() => String(route.params.topicId ?? ''))
const quizId = computed(() => String(route.params.quizId ?? ''))

const questions = computed(() => quiz.value?.questions ?? [])

const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)

const currentQuestionReady = computed(() => isStudyQuestionLoaded(currentQuestion.value))

const isLastQuestion = computed(() => currentIndex.value >= questions.value.length - 1)

const canGoPrev = computed(() => currentIndex.value > 0)

const hasSavedProgress = computed(() => {
  if (quizProgress.value.length > 0) return true
  return Object.keys(questionStates.value).some((key) => questionStates.value[key]?.revealed)
})

const score = computed(() => {
  const total = questions.value.length
  const progress = quizProgress.value

  if (isQuizFullyAnsweredInProgress(progress, total)) {
    return countCorrectFromQuizPlayProgress(progress)
  }

  return Object.entries(questionStates.value).filter(([index, state]) => {
    if (!state?.revealed) return false
    if (typeof state.isCorrect === 'boolean') return state.isCorrect
    const q = questions.value[Number(index)]
    if (!q || state.selectedIndex == null) return false
    return (q.correctIndices ?? []).includes(state.selectedIndex)
  }).length
})

const correctIndexSet = computed(() => {
  const indices = currentQuestion.value?.correctIndices ?? []
  return new Set(indices)
})

const isCurrentCorrect = computed(() => {
  if (selectedIndex.value === null) return false
  return correctIndexSet.value.has(selectedIndex.value)
})

const explanationBlocks = computed(() => {
  const q = currentQuestion.value
  if (!q || selectedIndex.value === null) return []

  const blocks = []
  const seen = new Set()

  const addBlock = (index, force = false) => {
    if (seen.has(index) && !force) return
    seen.add(index)
    const answer = q.answers[index]
    if (!answer) return
    const explanation = String(answer.explanation ?? '').trim()
    if (!explanation) return

    blocks.push({
      key: `a-${index}`,
      label: answer.name,
      explanation,
      isCorrect: correctIndexSet.value.has(index)
    })
  }

  for (const i of correctIndexSet.value) {
    addBlock(i)
  }

  if (!correctIndexSet.value.has(selectedIndex.value)) {
    addBlock(selectedIndex.value, true)
  }

  return blocks
})

function optionClass(index) {
  if (!revealed.value) return {}
  const isCorrect = correctIndexSet.value.has(index)
  const isSelected = index === selectedIndex.value
  return {
    correct: isCorrect,
    wrong: isSelected && !isCorrect
  }
}

function isAnswerCorrect(question, answerIndex) {
  if (!question || answerIndex == null) return false
  return (question.correctIndices ?? []).includes(answerIndex)
}

function upsertQuizProgressRow(questionId, answerId, isCorrect) {
  if (!questionId) return
  const qid = String(questionId)
  const rest = quizProgress.value.filter((r) => String(r.question_id) !== qid)
  quizProgress.value = [
    ...rest,
    {
      question_id: qid,
      answer_id: answerId != null ? String(answerId) : null,
      is_correct: Boolean(isCorrect)
    }
  ]
}

function saveCurrentQuestionState() {
  if (!revealed.value || selectedIndex.value === null) return
  const q = currentQuestion.value
  questionStates.value[currentIndex.value] = {
    selectedIndex: selectedIndex.value,
    revealed: true,
    isCorrect: isAnswerCorrect(q, selectedIndex.value)
  }
}

function syncStateFromProgress(index) {
  const q = questions.value[index]
  if (!q || !isStudyQuestionLoaded(q)) return

  const qid = String(q.uuid ?? q.id ?? '')
  const row = quizProgress.value.find((r) => String(r.question_id) === qid)
  if (!row?.answer_id) return

  const aIndex = q.answers.findIndex(
    (a) => String(a.uuid ?? a.id) === String(row.answer_id)
  )
  if (aIndex < 0) return

  const state = {
    selectedIndex: aIndex,
    revealed: true
  }
  if (typeof row.is_correct === 'boolean') {
    state.isCorrect = row.is_correct
  } else {
    state.isCorrect = isAnswerCorrect(q, aIndex)
  }
  questionStates.value[index] = state
}

function loadQuestionState(index) {
  syncStateFromProgress(index)
  const state = questionStates.value[index]
  selectedIndex.value = state?.selectedIndex ?? null
  revealed.value = Boolean(state?.revealed)
}

async function ensureQuestionLoaded(index) {
  const list = quiz.value?.questions
  if (!Array.isArray(list) || index < 0 || index >= list.length) return false

  if (isStudyQuestionLoaded(list[index])) {
    return true
  }

  questionLoading.value = true
  try {
    const full = await loadStudyQuestion(list[index])
    if (!full || !isStudyQuestionLoaded(full)) return false

    list[index] = full
    quiz.value = { ...quiz.value, questions: [...list] }
    syncStateFromProgress(index)
    return true
  } catch {
    return false
  } finally {
    questionLoading.value = false
  }
}

async function selectAnswer(index) {
  if (revealed.value || !currentQuestion.value) return

  const question = currentQuestion.value
  const answer = question.answers[index]
  const questionId = question.uuid ?? question.id
  const answerId = answer?.uuid ?? answer?.id ?? null

  const correct = isAnswerCorrect(question, index)

  selectedIndex.value = index
  revealed.value = true
  questionStates.value[currentIndex.value] = {
    selectedIndex: index,
    revealed: true,
    isCorrect: correct
  }
  upsertQuizProgressRow(questionId, answerId, correct)

  if (!quizId.value || !questionId) return

  try {
    await saveQuizPlayAnswer(quizId.value, { questionId, answerId })
  } catch {
    /* postęp zapisany lokalnie; błąd API nie blokuje trybu nauki */
  }
}

async function goNext() {
  if (!revealed.value) return

  saveCurrentQuestionState()

  if (isLastQuestion.value) {
    finished.value = true
    return
  }

  const nextIndex = currentIndex.value + 1
  const ok = await ensureQuestionLoaded(nextIndex)
  if (!ok) {
    loadError.value = 'Nie udało się wczytać następnego pytania.'
    return
  }

  currentIndex.value = nextIndex
  loadQuestionState(nextIndex)
}

async function goPrev() {
  if (!canGoPrev.value) return

  saveCurrentQuestionState()

  const prevIndex = currentIndex.value - 1
  const ok = await ensureQuestionLoaded(prevIndex)
  if (!ok) {
    loadError.value = 'Nie udało się wczytać poprzedniego pytania.'
    return
  }

  currentIndex.value = prevIndex
  loadQuestionState(prevIndex)
}

function resetSession() {
  currentIndex.value = 0
  selectedIndex.value = null
  revealed.value = false
  questionStates.value = {}
  quizProgress.value = []
  finished.value = false
}

async function startFromBeginning() {
  if (!quizId.value || resettingProgress.value) return

  loadError.value = ''
  resettingProgress.value = true
  try {
    await clearQuizPlayProgress(quizId.value)
  } catch {
    /* lokalny reset i tak */
  } finally {
    resettingProgress.value = false
  }

  resetSession()
  const ok = await ensureQuestionLoaded(0)
  if (ok) {
    loadQuestionState(0)
  } else {
    loadError.value = 'Nie udało się wczytać pytania.'
  }
}

async function restart() {
  await startFromBeginning()
}

function restoreSessionFromProgress(questionsList, progress) {
  quizProgress.value = progress?.answers ?? []

  const resumeAt = getResumeQuestionIndexFromProgress(questionsList, quizProgress.value)
  if (resumeAt >= questionsList.length) {
    finished.value = true
    currentIndex.value = Math.max(0, questionsList.length - 1)
    return resumeAt
  }

  currentIndex.value = resumeAt
  return resumeAt
}

function applyAllProgressToQuestionStates(questionsList) {
  for (let i = 0; i < questionsList.length; i++) {
    const q = questionsList[i]
    const qid = String(q?.uuid ?? q?.id ?? '')
    const row = quizProgress.value.find((r) => String(r.question_id) === qid)
    if (!row?.answer_id) continue

    if (isStudyQuestionLoaded(q)) {
      syncStateFromProgress(i)
      continue
    }

    questionStates.value[i] = {
      selectedIndex: null,
      revealed: true,
      isCorrect: row.is_correct === true
    }
  }
}

async function loadQuiz() {
  const topic = topicId.value
  const qid = quizId.value

  if (!topic || !qid) {
    loadError.value = 'Brak identyfikatora zestawu lub quizu.'
    loadLoading.value = false
    return
  }

  loadLoading.value = true
  loadError.value = ''
  resetSession()

  try {
    const [deckRow, quizRow, progress] = await Promise.all([
      fetchDeck(topic),
      fetchQuizForStudy(qid),
      fetchQuizPlayProgress(qid)
    ])
    deck.value = deckRow
    quiz.value = quizRow

    const questionsList = quizRow?.questions ?? []
    if (!questionsList.length) return

    const resumeAt = restoreSessionFromProgress(questionsList, progress)
    if (finished.value) {
      applyAllProgressToQuestionStates(questionsList)
      return
    }

    const ok = await ensureQuestionLoaded(resumeAt)
    if (!ok) {
      loadError.value = 'Nie udało się wczytać pytania.'
      return
    }
    loadQuestionState(resumeAt)
  } catch (e) {
    deck.value = null
    quiz.value = null
    loadError.value = e?.message || 'Nie udało się wczytać testu.'
  } finally {
    loadLoading.value = false
  }
}

watch([topicId, quizId], loadQuiz, { immediate: true })
</script>

<style scoped>
.study-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 1.25rem;
}

.study-header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.btn-reset-progress {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 0.5px solid var(--border-hover);
  background: transparent;
  font-size: 12px;
  color: var(--text-secondary);
}

.btn-reset-progress:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-reset-progress:disabled {
  opacity: 0.5;
  cursor: default;
}

.study-header-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.study-title {
  font-size: 16px;
  font-weight: 500;
}

.study-sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.mode-badge {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--purple-text);
  background: var(--purple-light);
  border-radius: 999px;
  padding: 4px 10px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  padding: 2px 4px;
  line-height: 1;
  text-decoration: none;
}

.qp-row {
  display: flex;
  gap: 6px;
  margin-bottom: 1rem;
}

.qp-dot {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-secondary);
}

.qp-dot.done {
  background: var(--purple);
}

.qp-dot.cur {
  background: #afa9ec;
}

.question-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.quiz-q {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.quiz-opts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-opt {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 0.5px solid var(--border);
  background: var(--bg-primary);
  font-size: 15px;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}

.quiz-opt:hover:not(:disabled):not(.correct):not(.wrong) {
  border-color: var(--border-hover);
  background: var(--bg-secondary);
}

.quiz-opt.correct {
  border-color: var(--success);
  background: var(--success-light);
  color: #0f6e56;
}

.quiz-opt.wrong {
  border-color: var(--danger);
  background: var(--danger-light);
  color: #a32d2d;
}

.reveal-panel {
  margin-top: 1.25rem;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 0.5px solid var(--border);
}

.reveal-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
}

.expl-block {
  padding: 10px 0;
  border-top: 0.5px solid var(--border);
}

.expl-block:first-of-type {
  border-top: none;
  padding-top: 0;
}

.expl-answer {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.expl-block--correct .expl-answer {
  color: #0f6e56;
}

.expl-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
}

.study-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 1.25rem;
}

.study-actions .btn-action--next {
  margin-left: auto;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--purple);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.btn-action:hover {
  background: var(--purple-dark);
}

.btn-action--ghost {
  background: transparent;
  color: var(--text-primary);
  border: 0.5px solid var(--border-hover);
}

.btn-action--ghost:hover {
  background: var(--bg-primary);
}

.quiz-score {
  text-align: center;
  padding: 2rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.quiz-score .btn-action--ghost {
  margin-left: 8px;
}

.score-val {
  font-size: 48px;
  font-weight: 500;
}

.score-label {
  font-size: 16px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.score-pct {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
  margin-bottom: 1rem;
}

.empty-note {
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-panel {
  padding: 1.5rem;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  font-size: 14px;
}

.btn-link {
  display: inline-block;
  margin-top: 12px;
  color: var(--purple-text);
  font-size: 14px;
}
</style>
