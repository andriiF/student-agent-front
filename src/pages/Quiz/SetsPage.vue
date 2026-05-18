<template>
  <AppLayout>
    <div class="page-header">
      <div class="pick-title">Zestawy i quizy</div>
      <div class="header-actions">
        <button class="btn-sec" @click="showNewSetForm = !showNewSetForm">+ Add new set</button>
        <button type="button" class="btn-sec" :disabled="!selectedDeck" @click="goCreateQuiz">+ Add new quiz</button>
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

    <div v-else class="pick-wrap">
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
        <span class="pick-meta">{{ (quiz.questions || []).length }} pytań</span>
      </button>
      <div v-if="(selectedDeck.quizzes || []).length === 0" class="empty-state">
        Ten zestaw nie ma jeszcze quizów.
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDecks, createDeck } from '@/api/topics.js'
import { toastSuccess } from '@/composables/toast.js'
import AppLayout from "@/layout/AppLayout.vue";

defineEmits(['go'])

const route = useRoute()
const router = useRouter()
const decks = ref([])
const selectedDeckIndex = ref(null)
const selectedQuizIndex = ref(null)
const showNewSetForm = ref(false)
const newSetName = ref('')

const selectedDeck = computed(() => {
  if (selectedDeckIndex.value === null) return null
  return decks.value[selectedDeckIndex.value]
})

function parseIndex(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

function resolveDeckIndex(key) {
  if (key === undefined || key === null || key === '') return null
  const asNum = parseIndex(key)
  if (asNum !== null) return asNum
  const i = decks.value.findIndex(d => String(d.uuid ?? d.id) === String(key))
  return i >= 0 ? i : null
}

watch(
  () => route.fullPath,
  () => {
    const rawId = route.params.id
    const deckIdx =
      resolveDeckIndex(rawId) ?? parseIndex(route.query.deck) ?? resolveDeckIndex(route.query.deck)
    selectedDeckIndex.value = deckIdx
    const qIdx = parseIndex(route.query.quiz)
    if (route.name === 'set-edit' && deckIdx !== null && qIdx !== null) {
      const d = decks.value[deckIdx]
      if (d) {
        const deckKey = String(d.uuid ?? d.id ?? deckIdx)
        router.replace({ name: 'quiz.edit', params: { topic: deckKey, id: `${deckKey}-${qIdx}` } })
      }
      return
    }
    selectedQuizIndex.value = null
  },
  { immediate: true }
)

function selectDeck(i) {
  selectedDeckIndex.value = i
  selectedQuizIndex.value = null
  const d = decks.value[i]
  const param =
    d?.uuid != null && d.uuid !== ''
      ? String(d.uuid)
      : d?.id != null && d.id !== ''
        ? String(d.id)
        : String(i)
  router.replace({ name: 'set-edit', params: { id: param } })
}

function selectQuiz(i) {
  const d = selectedDeck.value
  const deckKey = d ? String(d.uuid ?? d.id ?? selectedDeckIndex.value) : String(selectedDeckIndex.value)
  router.replace({ name: 'quiz.edit', params: { topic: deckKey, id: `${deckKey}-${i}` } })
}

function goToSetsList() {
  selectedDeckIndex.value = null
  selectedQuizIndex.value = null
  showNewSetForm.value = false
  newSetName.value = ''
  router.replace({ name: 'topic' })
}

function goCreateQuiz() {
  const d = selectedDeck.value
  const topic = d?.uuid ?? d?.id
  if (topic == null || String(topic) === '') return
  router.push({ name: 'quiz.create', params: { topic: String(topic) } })
}

async function createSet() {
  if (!newSetName.value.trim()) return
  try {
    const deck = await createDeck(newSetName.value.trim())
    decks.value.push(deck)
    toastSuccess('Utworzono zestaw.')
    newSetName.value = ''
    showNewSetForm.value = false
    const id = deck?.uuid ?? deck?.id
    const param = id != null && String(id) !== '' ? String(id) : String(decks.value.length - 1)
    await router.replace({ name: 'set-edit', params: { id: param } })
  } catch {
    /* store / network error */
  }
}

function cancelNewSet() {
  newSetName.value = ''
  showNewSetForm.value = false
}

onMounted(async () => {
  try {
    decks.value = await fetchDecks()
  } catch {
    /* ignore — lista może być pusta */
  }
})
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
