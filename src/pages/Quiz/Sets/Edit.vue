<template>
  <AppLayout>
    <div class="page-header">
      <div class="pick-title">Edycja zestawu</div>
      <div class="header-actions">
        <RouterLink :to="{ name: 'topic' }" class="btn-ghost">← Wróć</RouterLink>
      </div>
    </div>

    <div v-if="loadError" class="empty-state">{{ loadError }}</div>
    <div v-else-if="loadLoading" class="empty-state">Ładowanie…</div>

    <template v-else>
      <form class="pick-wrap" @submit.prevent="saveName">
        <div class="form-group">
          <label for="deck-name">Nazwa zestawu</label>
          <input
              id="deck-name"
              v-model="name"
              type="text"
              autocomplete="off"
              placeholder="np. Matura 2026"
              :disabled="saveLoading"
          />
          <p v-for="e in fieldErrors.name" :key="e" class="err">{{ e }}</p>
        </div>
        <p v-if="formError" class="err">{{ formError }}</p>
        <div class="new-quiz-actions">
          <button type="submit" class="btn-save" :disabled="saveLoading || !name.trim()">
            {{ saveLoading ? 'Zapisywanie…' : 'Zapisz nazwę' }}
          </button>
        </div>
      </form>

      <div class="section">
        <div class="section-title">Quizy</div>
        <div class="header-actions section-actions">
          <RouterLink class="btn-sec-link" :to="{ name: 'quiz.create', params: { topic: topicId } }">+ Dodaj quiz
          </RouterLink>
        </div>
        <div v-if="quizzes.length === 0" class="empty-state">Brak quizów w tym zestawie.</div>
        <div v-else class="quiz-list">
          <RouterLink
              v-for="(quiz, i) in quizzes"
              :key="quiz.uuid ?? quiz.id ?? `q-${i}`"
              class="pick-item"
              :to="{ name: 'quiz.edit', params: { topic: topicId, id:quiz.uuid } }"
          >
            <span>{{ quiz.name }}</span>
            <span class="pick-meta">{{ (quiz.questions || []).length }} pytań</span>
          </RouterLink>
        </div>
      </div>
    </template>
  </AppLayout>
</template>

<script setup>
import {ref, computed, watch} from 'vue'
import {useRoute} from 'vue-router'
import { fetchDeck, updateTopic } from '@/api/topics.js'
import {toastSuccess} from '@/composables/toast.js'
import AppLayout from '@/layout/AppLayout.vue'

const route = useRoute()
const deck = ref(null)
const name = ref('')
const loadLoading = ref(true)
const loadError = ref('')
const saveLoading = ref(false)
const formError = ref('')
const validationErrors = ref({})

const topicId = computed(() => String(route.params.id ?? ''))

const quizzes = computed(() => deck.value?.quizzes ?? [])

const deckKey = computed(() => {
  const d = deck.value
  if (!d) return topicId.value
  return String(d.uuid ?? d.id ?? topicId.value)
})

const fieldErrors = computed(() => ({
  name: validationErrors.value.name || []
}))

async function load() {
  const id = topicId.value
  if (!id) {
    loadError.value = 'Brak identyfikatora zestawu w adresie URL.'
    loadLoading.value = false
    return
  }
  loadError.value = ''
  loadLoading.value = true
  try {
    const d = await fetchDeck(id)
    deck.value = d
    name.value = d?.name ?? ''
  } catch (e) {
    loadError.value = e?.message || 'Nie udało się wczytać zestawu.'
  } finally {
    loadLoading.value = false
  }
}

watch(
    () => route.params.id,
    () => {
      load()
    },
    {immediate: true}
)

async function saveName() {
  if (saveLoading.value || !name.value.trim()) return
  const id = topicId.value
  formError.value = ''
  validationErrors.value = {}
  saveLoading.value = true
  try {
    const updated = await updateTopic(id, { name: name.value })
    deck.value = updated
    name.value = updated?.name ?? name.value
    toastSuccess('Zapisano nazwę zestawu.')
  } catch (e) {
    if (e?.errors && typeof e.errors === 'object') {
      validationErrors.value = e.errors
    }
    formError.value = e?.message || 'Nie udało się zapisać.'
  } finally {
    saveLoading.value = false
  }
}
</script>

<style scoped>

</style>
