<template>
  <AppLayout>
    <div v-if="loadError" class="empty-state">{{ loadError }}</div>
    <div v-else-if="loadLoading" class="empty-state">Ładowanie quizu…</div>

    <div v-else-if="!resolved" class="empty-state">Nie znaleziono quizu.</div>

    <template v-else>
      <div class="edit-wrap">
        <div class="edit-head">
          <button type="button" class="btn-back" @click="goBack">←</button>
          <div class="pick-title">Edycja: {{ selectedQuiz.name }}</div>
        </div>

        <div class="form-group">
          <label>Nazwa zestawu</label>
          <p>{{ selectedDeck.name }}</p>
        </div>

        <div class="form-group">
          <label>Nazwa quizu</label>
          <input v-model="selectedQuiz.name" type="text"/>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-save" :disabled="saveLoading" @click="saveQuiz">
            {{ saveLoading ? 'Zapisywanie…' : 'Zapisz' }}
          </button>
          <p v-if="saveError" class="err">{{ saveError }}</p>
        </div>

        <div class="divider"></div>
        <div class="section-title">Pytania</div>
        <div class="add-question-row">
          <RouterLink
              class="btn-add-question"
              :to="{ name: 'question.create', params: { topic: routeTopic, id: routeQuizId } }"
          >
            + Dodaj pytanie
          </RouterLink>
        </div>
        <p v-if="questions.length === 0" class="questions-empty">Brak pytań — dodaj pierwsze przyciskiem powyżej.</p>

        <RouterLink
            v-for="(question, qIndex) in questions"
            :key="question._localKey ?? question.uuid ?? question.id ?? qIndex"
            class="pick-item mb-3"
            :to="{
              name: 'question.edit',
              params: {
                topic: routeTopic,
                quiz: routeQuizId,
                id: String(question.uuid ?? question.id ?? qIndex)
              }
            }"
        >
          <div>{{ question.q || question.name || 'Pytanie ' + (qIndex + 1) }}</div>
        </RouterLink>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { fetchQuizForEdit, updateQuiz } from '@/api/quizzes.js'
import {toastSuccess} from '@/composables/toast.js'
import AppLayout from '@/layout/AppLayout.vue'

const route = useRoute()
const router = useRouter()

const selectedDeck = ref(null)
const selectedQuizIndex = ref(null)
const selectedQuiz = ref(null)
const loadLoading = ref(false)
const loadError = ref('')
const saveLoading = ref(false)
const saveError = ref('')

const routeTopic = computed(() => String(route.params.topic ?? ''))
const routeQuizId = computed(() => String(route.params.id ?? ''))

const questions = computed(() => selectedQuiz.value?.questions || [])

const resolved = computed(() => Boolean(selectedDeck.value && selectedQuiz.value))

function newQuestionLocalKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function createEmptyQuestion() {
  return {
    _localKey: newQuestionLocalKey(),
    q: '',
    answers: ['', ''],
    correct: [0],
    answerExplanations: ['', ''],
    answersActive: [true, true]
  }
}

function assignQuestionLocalKeys(quiz) {
  const list = quiz?.questions
  if (!Array.isArray(list)) return
  for (const q of list) {
    if (q && typeof q._localKey !== 'string') {
      q._localKey = newQuestionLocalKey()
    }
  }
}

function addQuestion() {
  const qz = selectedQuiz.value
  if (!qz) return
  if (!Array.isArray(qz.questions)) {
    qz.questions = []
  }
  qz.questions.push(createEmptyQuestion())
}

async function loadQuizFromApi() {
  const topic = routeTopic.value
  const quizRef = routeQuizId.value
  loadError.value = ''
  selectedQuiz.value = null
  if (!topic || !quizRef) {
    selectedDeck.value = null
    selectedQuizIndex.value = null
    loadError.value = 'Brak parametru topic lub id w adresie URL.'
    return
  }
  loadLoading.value = true
  try {
    const { deck, quizIndex, quiz } = await fetchQuizForEdit(topic, quizRef)

    selectedDeck.value = deck
    selectedQuizIndex.value = quizIndex
    selectedQuiz.value = quiz ?? null
    await nextTick()
    if (selectedQuiz.value) assignQuestionLocalKeys(selectedQuiz.value)
  } catch (e) {
    selectedDeck.value = null
    selectedQuizIndex.value = null
    selectedQuiz.value = null
    loadError.value = e?.message || 'Nie udało się wczytać quizu.'
  } finally {
    loadLoading.value = false
  }
}

watch(
    () => [route.params.topic, route.params.id],
    () => {
      saveError.value = ''
      loadQuizFromApi()
    },
    {immediate: true}
)

function goBack() {
  const topic = routeTopic.value
  if (topic) {
    router.push({name: 'topic.edit', params: {id: topic}})
  } else {
    router.push({name: 'topic'})
  }
}

async function saveQuiz() {
  const qz = selectedQuiz.value
  if (!qz) return
  const quuid = qz.uuid ?? qz.id
  saveError.value = ''
  saveLoading.value = true
  try {
    if (quuid != null && String(quuid) !== '') {
      await updateQuiz(String(quuid), {
        name: qz.name,
      })
      toastSuccess('Zapisano quiz.')
    } else {
      toastSuccess('Zapisano lokalnie (brak UUID quizu w API).')
    }
  } catch (e) {
    saveError.value = e?.message || 'Nie udało się zapisać.'
  } finally {
    saveLoading.value = false
  }
}

function removeQuestion(index) {
  const qz = selectedQuiz.value
  if (!qz) return
  qz.questions.splice(index, 1)
}

function openQuestionEditor(questionIndex) {
  const d = selectedDeck.value
  const deckKey = d ? String(d.uuid ?? d.id ?? '') : ''
  router.push({
    name: 'question-edit',
    query: {
      deck: deckKey,
      quiz: String(selectedQuizIndex.value),
      quizEditId: `${deckKey}-${selectedQuizIndex.value}`,
      question: String(questionIndex)
    }
  })
}
</script>

<style scoped>
.empty-state {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
}

.edit-wrap {
  background: var(--bg-primary);
  border: 0.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
}

.edit-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.75rem;
}

.btn-back {
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  padding: 4px;
  line-height: 1;
  cursor: pointer;
}

.pick-title {
  font-size: 16px;
  font-weight: 500;
}

.form-actions {
  margin-bottom: 1rem;
}

.btn-save {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--purple);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: default;
}

.err {
  font-size: 13px;
  color: var(--danger, #c00);
  margin: 8px 0 0;
}

.divider {
  height: 0.5px;
  background: var(--border);
  margin: 1rem 0;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.add-question-row {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.btn-add-question {
  display: inline-block;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: 0.5px solid var(--border-hover);
  background: var(--bg-secondary);
  font-size: 14px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
}

button.btn-add-question:hover {
  border-color: var(--border);
}

.btn-add-question--link {
  background: transparent;
  font-size: 13px;
  color: var(--purple, #6b5dd3);
  border-color: transparent;
  padding: 8px 12px;
}

.btn-add-question--link:hover {
  text-decoration: underline;
  border-color: transparent;
}

.questions-empty {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px;
}

.form-group {
  margin-bottom: 0.8rem;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 0.5px solid var(--border-hover);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
}

.question-card {
  border: 0.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 10px;
  background: var(--bg-secondary);
}

.question-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-index {
  font-size: 12px;
  color: var(--text-secondary);
}

.question-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-edit {
  background: transparent;
  border: 0.5px solid var(--border-hover);
  border-radius: var(--radius-md);
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
}

.btn-del {
  background: transparent;
  border: 0.5px solid var(--border-hover);
  border-radius: var(--radius-md);
  padding: 4px 8px;
  font-size: 12px;
  color: var(--danger);
  cursor: pointer;
}

.question-summary {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
