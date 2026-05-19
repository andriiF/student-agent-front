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

