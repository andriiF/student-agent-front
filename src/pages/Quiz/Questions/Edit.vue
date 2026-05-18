<template>
  <AppLayout>
    <div v-if="loadError" class="empty-state">{{ loadError }}</div>
    <div v-else-if="loadLoading" class="empty-state">Ładowanie…</div>

    <template v-else-if="resolved">
      <div class="page-header">
        <button type="button" class="btn-back" @click="goBack">←</button>
        <div class="pick-title">Edycja pytania</div>
      </div>
      <p class="context">
        Quiz:
        <RouterLink class="context-link" :to="{ name: 'quiz.edit', params: { topic: routeTopic, id: routeQuizId } }">
          <strong>{{ selectedQuiz?.name }}</strong>
        </RouterLink>
        <span class="context-sep">·</span>
        Zestaw:
        <RouterLink class="context-link" :to="{ name: 'topic.edit', params: { id: routeTopic } }">
          <strong>{{ selectedDeck?.name }}</strong>
        </RouterLink>
      </p>

      <form class="edit-wrap" @submit.prevent="submit">
        <div class="form-group">
          <label for="q-text">Pytanie</label>
          <textarea id="q-text" v-model="questionText" rows="2" :disabled="saving"></textarea>
        </div>
        <div class="answers-label-row">
          <span class="answers-label">Odpowiedzi</span>
          <button type="button" class="btn-add-answer" :disabled="saving" @click="addAnswerRow">+ Dodaj odpowiedź
          </button>
        </div>
        <div
            v-for="(row, i) in answerRows"
            :key="row._rowKey"
            class="answer-row"
            :class="{ 'answer-row--inactive': !row.isActive }"
        >
          <div class="answer-row-main">
            <label class="answer-num" :for="`answer-text-${i}`">{{ i + 1 }}.</label>
            <input
                :id="`answer-text-${i}`"
                v-model="row.text"
                class="answer-text"
                type="text"
                :placeholder="`Treść odpowiedzi ${i + 1}`"
                :disabled="saving || !row.isActive"
            />
          </div>
          <div class="answer-row-expl">
            <label class="expl-label" :for="`answer-expl-${i}`">Wyjaśnienie (opcjonalnie)</label>
            <textarea
                :id="`answer-expl-${i}`"
                v-model="row.explanation"
                class="answer-expl"
                rows="2"
                placeholder="Dlaczego ta odpowiedź jest poprawna lub nie"
                :disabled="saving || !row.isActive"
            />
          </div>
          <div class="answer-row-checks">
            <label class="chk" :for="`answer-correct-${i}`">
              <input
                  :id="`answer-correct-${i}`"
                  type="checkbox"
                  v-model="row.isCorrect"
                  :disabled="saving || !row.isActive"
              />
              Poprawna
            </label>
            <label class="chk" :for="`answer-active-${i}`">
              <input
                  :id="`answer-active-${i}`"
                  v-model="row.isActive"
                  type="checkbox"
                  :disabled="saving"
              />
              Aktywna
            </label>
            <button
                type="button"
                class="btn-remove-answer"
                :disabled="saving"
                @click="removeAnswerRow(i)"
            >
              Usuń odpowiedź
            </button>
          </div>
        </div>
        <p v-if="formError" class="err">{{ formError }}</p>
        <div class="actions">
          <button type="submit" class="btn-save" :disabled="saving || !canSubmit">Zapisz pytanie</button>
          <button type="button" class="btn-ghost" :disabled="saving" @click="goBack">Anuluj</button>
        </div>
      </form>
    </template>

    <div v-else class="empty-state">Nie znaleziono quizu lub pytania.</div>
  </AppLayout>
</template>

<script setup>
import {ref, computed, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {fetchQuizForEdit} from '@/api/quizzes.js'
import {fetchQuestion, updateQuestion} from '@/api/questions.js'
import {toastSuccess} from '@/composables/toast.js'
import AppLayout from '@/layout/AppLayout.vue'

const route = useRoute()
const router = useRouter()

const routeTopic = computed(() => String(route.params.topic ?? ''))
const routeQuizId = computed(() => String(route.params.quiz ?? ''))
const routeQuestionId = computed(() => String(route.params.id ?? ''))

const selectedDeck = ref(null)
const selectedQuizIndex = ref(null)
const questionUuid = ref(null)
const loadLoading = ref(false)
const loadError = ref('')
const questionText = ref('')
const saving = ref(false)
const formError = ref('')

const MIN_ANSWER_ROWS = 0

function newAnswerRowKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function newAnswerRow(overrides = {}) {
  return {
    _rowKey: newAnswerRowKey(),
    text: '',
    explanation: '',
    isCorrect: false,
    isActive: true,
    ...overrides
  }
}


const answerRows = ref([])

function correctSetFromQuestion(q) {
  const c = q?.correct
  if (Array.isArray(c)) return new Set(c.filter(i => Number.isInteger(i) && i >= 0))
  const n = Number(c)
  if (Number.isInteger(n) && n >= 0) return new Set([n])
  return new Set([0])
}

function mapQuestionToRows(q) {
  const rawAnswers = Array.isArray(q?.answers) ? q.answers : []
  if (!rawAnswers.length) return [newAnswerRow({isCorrect: true})]


  return rawAnswers.map((a, i) => {
    const text = typeof a === 'string' ? a : String(a?.text ?? a?.name ?? '')
    return newAnswerRow({
      text,
      explanation: a.explanation ?? '',
      isActive: a.is_active,
      isCorrect: a.is_correct
    })
  })
}

const selectedQuiz = computed(() => {
  if (!selectedDeck.value || selectedQuizIndex.value === null) return null
  return selectedDeck.value.quizzes?.[selectedQuizIndex.value] || null
})

const resolved = computed(() =>
    Boolean(selectedDeck.value && selectedQuiz.value && questionUuid.value)
)

const canSubmit = computed(() => {
  const name = questionText.value.trim()
  if (!name || name.length > 255) return false
  const activeAnswers = answerRows.value.filter(r => r.isActive && r.text.trim())
  if (activeAnswers.length === 0) return false
  return activeAnswers.some(r => r.isCorrect)
})

function buildQuestionPayload() {
  const quizId = selectedQuiz.value?.uuid ?? selectedQuiz.value?.id
  if (quizId == null || String(quizId) === '') {
    throw new Error('Brak identyfikatora quizu.')
  }

  const name = questionText.value.trim()
  if (!name) throw new Error('Podaj treść pytania.')
  if (name.length > 255) throw new Error('Pytanie może mieć maksymalnie 255 znaków.')

  const answers = answerRows.value.map(r => ({
    uuid: r.uuid ?? null,
    name: r.text.trim(),
    explanation: (r.explanation ?? '').trim(),
    is_correct: Boolean(r.isCorrect && r.isActive && r.text.trim()),
    is_active: Boolean(r.isActive)
  }))

  return {
    name,
    answers,
    quiz: String(quizId)
  }
}


function addAnswerRow() {
  answerRows.value.push(newAnswerRow())
}

function removeAnswerRow(index) {
  if (answerRows.value.length <= MIN_ANSWER_ROWS) return
  answerRows.value.splice(index, 1)
  const activeWithText = answerRows.value.filter(r => r.isActive && r.text.trim())
  if (!activeWithText.some(r => r.isCorrect)) {
    const first = activeWithText[0] ?? answerRows.value.find(r => r.isActive)
    if (first) first.isCorrect = true
  }
}

async function loadContext() {
  const topic = routeTopic.value
  const quizRef = routeQuizId.value
  const qid = routeQuestionId.value

  if (!topic || !quizRef || !qid) {
    loadError.value = 'Brak parametru topic, quiz lub id pytania w adresie URL.'
    return
  }
  loadLoading.value = true

  try {
    const {deck, quizIndex} = await fetchQuizForEdit(topic, quizRef)
    selectedDeck.value = deck
    selectedQuizIndex.value = quizIndex

    const question = await fetchQuestion(qid)

    questionUuid.value = question.uuid ?? question.id ?? qid
    questionText.value = question.q ?? question.name ?? ''
    answerRows.value = mapQuestionToRows(question)

  } catch (e) {
    loadError.value = e?.message || 'Nie udało się wczytać pytania.'
  } finally {
    loadLoading.value = false
  }
}

watch(
    () => [route.params.topic, route.params.quiz, route.params.id],
    () => {
      formError.value = ''
      loadContext()
    },
    {immediate: true}
)

function goBack() {
  if (routeTopic.value && routeQuizId.value) {
    router.push({name: 'quiz.edit', params: {topic: routeTopic.value, id: routeQuizId.value}})
  } else {
    router.push({name: 'topic'})
  }
}

async function submit() {
  if (!resolved.value || saving.value || !canSubmit.value) return
  formError.value = ''
  saving.value = true
  try {
    const payload = buildQuestionPayload()
    await updateQuestion(questionUuid.value, payload)
    toastSuccess('Zapisano pytanie.')
    goBack()
  } catch (e) {
    if (e?.errors && typeof e.errors === 'object') {
      const msgs = Object.values(e.errors).flat().filter(Boolean)
      formError.value = msgs.length ? msgs.join(' ') : (e?.message || 'Nie udało się zapisać pytania.')
    } else {
      formError.value = e?.message || 'Nie udało się zapisać pytania.'
    }
  } finally {
    saving.value = false
  }
}
</script>
