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

      <p v-if="isMultiSelect && !revealed" class="multi-hint">
        Zaznacz wszystkie poprawne odpowiedzi, potem potwierdź wybór.
      </p>

      <div class="quiz-opts">
        <button
          v-for="(answer, i) in currentQuestion.answers"
          :key="i"
          type="button"
          class="quiz-opt"
          :class="optionClass(i)"
          :disabled="revealed"
          @click="onAnswerClick(i)"
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
          v-if="isMultiSelect && !revealed && selectedIndices.length"
          type="button"
          class="btn-action"
          @click="confirmMultiAnswer"
        >
          Sprawdź odpowiedź
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
  normalizeAnswerIds,
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
const selectedIndices = ref([])
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
    const indices = getStateSelectedIndices(state)
    if (!q || !indices.length) return false
    return isQuestionAnswerCorrect(q, indices)
  }).length
})

const correctIndexSet = computed(() => {
  const indices = currentQuestion.value?.correctIndices ?? []
  return new Set(indices)
})

const isMultiSelect = computed(() => allowsMultipleAnswers(currentQuestion.value))

const isCurrentCorrect = computed(() => {
  if (!selectedIndices.value.length) return false
  return isQuestionAnswerCorrect(currentQuestion.value, selectedIndices.value)
})

const explanationBlocks = computed(() => {
  const q = currentQuestion.value
  if (!q || !selectedIndices.value.length) return []

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

  for (const i of selectedIndices.value) {
    if (!correctIndexSet.value.has(i)) {
      addBlock(i, true)
    }
  }

  return blocks
})

function allowsMultipleAnswers(question) {
  return (question?.correctIndices ?? []).length > 1
}

function setsEqual(a, b) {
  const left = [...a].sort((x, y) => x - y)
  const right = [...b].sort((x, y) => x - y)
  if (left.length !== right.length) return false
  return left.every((val, i) => val === right[i])
}

function isQuestionAnswerCorrect(question, indices) {
  const correct = question?.correctIndices ?? []
  const selected = Array.isArray(indices) ? indices : []
  return setsEqual(selected, correct)
}

function getStateSelectedIndices(state) {
  if (Array.isArray(state?.selectedIndices) && state.selectedIndices.length) {
    return [...state.selectedIndices]
  }
  if (state?.selectedIndex != null) return [state.selectedIndex]
  return []
}

function answerIdsFromIndices(question, indices) {
  return indices
    .map((i) => question?.answers?.[i])
    .map((a) => a?.uuid ?? a?.id ?? null)
    .filter((id) => id != null && String(id) !== '')
    .map(String)
}

function toAnswerIdPayload(answerIds) {
  if (!answerIds.length) return null
  if (answerIds.length === 1) return answerIds[0]
  return answerIds
}

function optionClass(index) {
  const isSelected = selectedIndices.value.includes(index)
  if (!revealed.value) {
    return { selected: isSelected && isMultiSelect.value }
  }
  const isCorrect = correctIndexSet.value.has(index)
  return {
    correct: isCorrect,
    wrong: isSelected && !isCorrect,
    picked: isSelected
  }
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
  if (!revealed.value || !selectedIndices.value.length) return
  const q = currentQuestion.value
  questionStates.value[currentIndex.value] = {
    selectedIndices: [...selectedIndices.value],
    revealed: true,
    isCorrect: isQuestionAnswerCorrect(q, selectedIndices.value)
  }
}

function syncStateFromProgress(index) {
  const q = questions.value[index]
  if (!q || !isStudyQuestionLoaded(q)) return

  const qid = String(q.uuid ?? q.id ?? '')
  const row = quizProgress.value.find((r) => String(r.question_id) === qid)
  const answerIds = normalizeAnswerIds(row?.answer_id)
  if (!answerIds.length) return

  const selected = answerIds
    .map((aid) =>
      q.answers.findIndex((a) => String(a.uuid ?? a.id) === String(aid))
    )
    .filter((i) => i >= 0)

  if (!selected.length) return

  const state = {
    selectedIndices: selected,
    revealed: true
  }
  if (typeof row.is_correct === 'boolean') {
    state.isCorrect = row.is_correct
  } else {
    state.isCorrect = isQuestionAnswerCorrect(q, selected)
  }
  questionStates.value[index] = state
}

function loadQuestionState(index) {
  syncStateFromProgress(index)
  const state = questionStates.value[index]
  selectedIndices.value = getStateSelectedIndices(state)
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

function onAnswerClick(index) {
  if (revealed.value || !currentQuestion.value) return
  if (isMultiSelect.value) {
    toggleAnswerSelection(index)
    return
  }
  submitAnswer([index])
}

function toggleAnswerSelection(index) {
  const set = new Set(selectedIndices.value)
  if (set.has(index)) set.delete(index)
  else set.add(index)
  selectedIndices.value = [...set].sort((a, b) => a - b)
}

function confirmMultiAnswer() {
  if (revealed.value || !isMultiSelect.value || !selectedIndices.value.length) return
  submitAnswer([...selectedIndices.value])
}

async function submitAnswer(indices) {
  if (revealed.value || !currentQuestion.value || !indices.length) return

  const question = currentQuestion.value
  const questionId = question.uuid ?? question.id
  const answerIds = answerIdsFromIndices(question, indices)
  const answerIdPayload = toAnswerIdPayload(answerIds)
  const correct = isQuestionAnswerCorrect(question, indices)

  selectedIndices.value = [...indices]
  revealed.value = true
  questionStates.value[currentIndex.value] = {
    selectedIndices: [...indices],
    revealed: true,
    isCorrect: correct
  }
  upsertQuizProgressRow(questionId, answerIdPayload, correct)

  if (!quizId.value || !questionId) return

  try {
    await saveQuizPlayAnswer(quizId.value, {
      questionId,
      answerId: answerIdPayload
    })
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
  selectedIndices.value = []
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
    if (!normalizeAnswerIds(row?.answer_id).length) continue

    if (isStudyQuestionLoaded(q)) {
      syncStateFromProgress(i)
      continue
    }

    questionStates.value[i] = {
      selectedIndices: [],
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

