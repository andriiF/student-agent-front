<template>
  <div>
    <div class="page-header">
      <div class="pick-title">Zestawy i quizy</div>
      <div class="header-actions">
        <button class="btn-sec" @click="showNewSetForm = !showNewSetForm">+ Add new set</button>
        <button class="btn-sec" :disabled="!selectedDeck" @click="showNewQuizForm = !showNewQuizForm">+ Add new quiz</button>
      </div>
    </div>

    <div v-if="showNewSetForm" class="new-quiz-box">
      <div class="form-group">
        <label>Nazwa zestawu</label>
        <input v-model="newSetName" type="text" placeholder="np. Matura 2026" />
      </div>
      <div class="new-quiz-actions">
        <button class="btn-sec" @click="createSet" :disabled="!newSetName.trim()">Utwórz zestaw</button>
        <button class="btn-ghost" @click="cancelNewSet">Anuluj</button>
      </div>
    </div>

    <div v-if="showNewQuizForm" class="new-quiz-box">
      <div class="form-group">
        <label>Nazwa quizu</label>
        <input v-model="newQuizName" type="text" placeholder="np. Quiz powtórkowy" />
      </div>
      <div class="new-quiz-actions">
        <button class="btn-sec" @click="createQuiz" :disabled="!newQuizName.trim()">Utwórz quiz</button>
        <button class="btn-ghost" @click="cancelNewQuiz">Anuluj</button>
      </div>
    </div>

    <div v-if="!selectedDeck" class="pick-wrap">
      <div class="pick-title">Wybierz zestaw</div>
      <button
        v-for="(deck, i) in store.decks"
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
        <button class="btn-back" @click="goToSetsList">←</button>
        <div class="pick-title">{{ selectedDeck.name }}</div>
      </div>
      <div class="form-group">
        <label>Nazwa zestawu</label>
        <input v-model="selectedDeck.name" type="text" />
      </div>
      <button
        v-for="(quiz, i) in selectedDeck.quizzes || []"
        :key="`quiz-${i}`"
        class="pick-item"
        @click="selectQuiz(i)"
      >
        <span>{{ quiz.name }}</span>
        <span class="pick-meta">{{ quiz.questions.length }} pytań</span>
      </button>
      <div v-if="(selectedDeck.quizzes || []).length === 0" class="empty-state">
        Ten zestaw nie ma jeszcze quizów.
      </div>
    </div>

    <template v-else>
      <div class="edit-wrap">
        <div class="edit-head">
          <div class="pick-title">Edycja: {{ selectedQuiz.name }}</div>
        </div>

        <div class="form-group">
          <label>Nazwa zestawu</label>
          <input v-model="selectedDeck.name" type="text" />
        </div>

        <div class="form-group">
          <label>Nazwa quizu</label>
          <input v-model="selectedQuiz.name" type="text" />
        </div>

        <div class="divider"></div>
        <div class="section-title">Dodaj pytanie</div>

        <div class="form-group">
          <label>Pytanie</label>
          <textarea v-model="newQuestionText" rows="2"></textarea>
        </div>
        <div class="answers-grid">
          <div class="form-group answer-item" v-for="(_, i) in newQuestionAnswers" :key="`new-a-${i}`">
            <label>Odpowiedź {{ i + 1 }}</label>
            <input v-model="newQuestionAnswers[i]" type="text" />
          </div>
        </div>
        <div class="form-group">
          <label>Poprawna odpowiedź</label>
          <select v-model.number="newQuestionCorrect">
            <option :value="0">Odpowiedź 1</option>
            <option :value="1">Odpowiedź 2</option>
            <option :value="2">Odpowiedź 3</option>
            <option :value="3">Odpowiedź 4</option>
          </select>
        </div>
        <button class="btn-restart" @click="addQuestion">+ Dodaj pytanie</button>

        <div class="divider"></div>
        <div class="section-title">Pytania w quizie</div>
        <div v-for="(question, qIndex) in questions" :key="`q-${qIndex}`" class="question-card">
          <div class="question-row">
            <div class="question-index">#{{ qIndex + 1 }}</div>
            <div class="question-actions">
              <button class="btn-edit" @click="openQuestionEditor(qIndex)">Edytuj odpowiedzi</button>
              <button class="btn-del" @click="removeQuestion(qIndex)">Usuń</button>
            </div>
          </div>
          <div class="form-group">
            <label>Treść pytania</label>
            <textarea v-model="question.q" rows="2"></textarea>
          </div>
          <div class="question-summary">
            Odpowiedzi i poprawna odpowiedź edytujesz na osobnej stronie.
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { store } from '@/entities/store.js'

defineEmits(['go'])

const route = useRoute()
const router = useRouter()
const selectedDeckIndex = ref(null)
const selectedQuizIndex = ref(null)
const newQuestionText = ref('')
const newQuestionAnswers = ref(['', '', '', ''])
const newQuestionCorrect = ref(0)
const showNewSetForm = ref(false)
const newSetName = ref('')
const showNewQuizForm = ref(false)
const newQuizName = ref('')

const selectedDeck = computed(() => {
  if (selectedDeckIndex.value === null) return null
  return store.decks[selectedDeckIndex.value]
})

const selectedQuiz = computed(() => {
  if (!selectedDeck.value || selectedQuizIndex.value === null) return null
  return selectedDeck.value.quizzes?.[selectedQuizIndex.value] || null
})

const questions = computed(() => selectedQuiz.value?.questions || [])

function parseIndex(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

watch(
  () => route.fullPath,
  () => {
    const rawId = route.params.id
    const compoundId = typeof rawId === 'string' ? rawId.split('-').map(v => Number(v)) : []
    if (route.name === 'quiz-edit-by-id' && compoundId.length === 2 && Number.isInteger(compoundId[0]) && Number.isInteger(compoundId[1])) {
      selectedDeckIndex.value = compoundId[0]
      selectedQuizIndex.value = compoundId[1]
      return
    }

    selectedDeckIndex.value = parseIndex(route.params.id) ?? parseIndex(route.query.deck)
    selectedQuizIndex.value = parseIndex(route.query.quiz)
  },
  { immediate: true }
)

function selectDeck(i) {
  selectedDeckIndex.value = i
  selectedQuizIndex.value = null
  router.replace({ name: 'set-edit', params: { id: i } })
}

function selectQuiz(i) {
  selectedQuizIndex.value = i
  router.replace({ name: 'quiz-edit-by-id', params: { id: `${selectedDeckIndex.value}-${i}` } })
}

function goToSetsList() {
  selectedDeckIndex.value = null
  selectedQuizIndex.value = null
  showNewSetForm.value = false
  newSetName.value = ''
  showNewQuizForm.value = false
  newQuizName.value = ''
  router.replace({ name: 'quiz-edit' })
}

function addQuestion() {
  if (!selectedQuiz.value) return
  if (!newQuestionText.value.trim()) return
  if (newQuestionAnswers.value.some(a => !a.trim())) return

  selectedQuiz.value.questions.push({
    q: newQuestionText.value.trim(),
    answers: newQuestionAnswers.value.map(a => a.trim()),
    correct: newQuestionCorrect.value
  })

  newQuestionText.value = ''
  newQuestionAnswers.value = ['', '', '', '']
  newQuestionCorrect.value = 0
}

function removeQuestion(index) {
  if (!selectedQuiz.value) return
  selectedQuiz.value.questions.splice(index, 1)
}

function openQuestionEditor(questionIndex) {
  router.push({
    name: 'question-edit',
    query: {
      deck: selectedDeckIndex.value,
      quiz: selectedQuizIndex.value,
      quizEditId: `${selectedDeckIndex.value}-${selectedQuizIndex.value}`,
      question: questionIndex
    }
  })
}

function createQuiz() {
  if (!selectedDeck.value) return
  if (!newQuizName.value.trim()) return

  selectedDeck.value.quizzes.push({
    name: newQuizName.value.trim(),
    questions: []
  })

  selectedQuizIndex.value = selectedDeck.value.quizzes.length - 1
  router.replace({ name: 'set-edit', params: { id: selectedDeckIndex.value }, query: { quiz: selectedQuizIndex.value } })

  newQuizName.value = ''
  showNewQuizForm.value = false
}

function cancelNewQuiz() {
  newQuizName.value = ''
  showNewQuizForm.value = false
}

function createSet() {
  if (!newSetName.value.trim()) return
  store.decks.push({
    name: newSetName.value.trim(),
    icon: '📚',
    color: '#F1EFE8',
    fillColor: '#888780',
    pct: 0,
    cards: [],
    quizzes: []
  })
  const newIndex = store.decks.length - 1
  selectedDeckIndex.value = newIndex
  selectedQuizIndex.value = null
  newSetName.value = ''
  showNewSetForm.value = false
  router.replace({ name: 'set-edit', params: { id: newIndex } })
}

function cancelNewSet() {
  newSetName.value = ''
  showNewSetForm.value = false
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-sec { padding: 7px 14px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: transparent; font-size: 13px; }
.btn-sec:hover { background: var(--bg-secondary); }
.btn-sec:disabled { opacity: 0.5; cursor: default; }
.new-quiz-box { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-md); padding: 12px; margin-bottom: 1rem; }
.new-quiz-actions { display: flex; gap: 8px; }
.btn-ghost { padding: 7px 14px; border-radius: var(--radius-md); border: 0.5px solid var(--border); background: transparent; font-size: 13px; color: var(--text-secondary); }
.pick-wrap { display: flex; flex-direction: column; gap: 10px; }
.pick-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.pick-title { font-size: 16px; font-weight: 500; margin-bottom: 6px; }
.pick-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: var(--radius-md); border: 0.5px solid var(--border); background: var(--bg-primary); font-size: 14px; text-align: left; }
.pick-item:hover { border-color: var(--border-hover); background: var(--bg-secondary); }
.pick-meta { font-size: 12px; color: var(--text-secondary); }
.empty-state { font-size: 13px; color: var(--text-secondary); background: var(--bg-secondary); border-radius: var(--radius-md); padding: 12px; }
.btn-back { background: transparent; border: none; font-size: 20px; color: var(--text-secondary); padding: 4px; line-height: 1; }
.btn-restart { margin-top: 1rem; padding: 10px 24px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: transparent; font-size: 14px; }
.btn-restart:hover { background: var(--bg-primary); }
.edit-wrap { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; }
.edit-head { margin-bottom: 0.5rem; }
.divider { height: 0.5px; background: var(--border); margin: 1rem 0; }
.section-title { font-size: 14px; font-weight: 500; margin-bottom: 0.75rem; }
.form-group { margin-bottom: 0.8rem; }
.form-group label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: var(--bg-primary); color: var(--text-primary); font-size: 14px; }
.answers-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.answer-item { margin-bottom: 0.2rem; }
.question-card { border: 0.5px solid var(--border); border-radius: var(--radius-md); padding: 12px; margin-bottom: 10px; background: var(--bg-secondary); }
.question-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.question-index { font-size: 12px; color: var(--text-secondary); }
.question-actions { display: flex; align-items: center; gap: 8px; }
.btn-edit { background: transparent; border: 0.5px solid var(--border-hover); border-radius: var(--radius-md); padding: 4px 8px; font-size: 12px; color: var(--text-primary); }
.btn-del { background: transparent; border: 0.5px solid var(--border-hover); border-radius: var(--radius-md); padding: 4px 8px; font-size: 12px; color: var(--danger); }
.question-summary { font-size: 12px; color: var(--text-secondary); }

@media (max-width: 640px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .answers-grid { grid-template-columns: 1fr; }
}
</style>
