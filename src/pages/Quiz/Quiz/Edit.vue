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

