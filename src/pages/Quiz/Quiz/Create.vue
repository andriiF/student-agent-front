<template>
  <AppLayout>
    <div class="page-header">
      <div class="pick-title">Nowy quiz</div>
      <div class="header-actions">
        <RouterLink v-if="topicId" :to="{ name: 'topic.edit', params: { id: topicId } }" class="btn-ghost">← Wróć</RouterLink>
        <RouterLink v-else :to="{ name: 'topic' }" class="btn-ghost">← Wróć</RouterLink>
      </div>
    </div>

    <div v-if="!topicId" class="empty-state">Brak parametru <code>topic</code> w ścieżce URL — oczekiwany adres: <code>/topic/[id-zestawu]/quiz/create</code>.</div>

    <div v-else-if="loadError" class="empty-state">{{ loadError }}</div>
    <div v-else-if="loadLoading" class="empty-state">Ładowanie zestawu…</div>

    <form v-else class="pick-wrap" @submit.prevent="submit">
      <p class="context">Zestaw: <strong>{{ deck?.name ?? '—' }}</strong></p>
      <div class="form-group">
        <label for="quiz-name">Nazwa quizu</label>
        <input
          id="quiz-name"
          v-model="quizName"
          type="text"
          placeholder="np. Powtórka przed sprawdzianem"
          :disabled="saving"
          @keyup.enter="submit"
        />
        <p v-for="e in fieldErrors.name" :key="e" class="err">{{ e }}</p>
      </div>
      <p v-if="formError" class="err">{{ formError }}</p>
      <div class="actions">
        <button type="submit" class="btn-save" :disabled="saving || !quizName.trim()">
          {{ saving ? 'Tworzenie…' : 'Utwórz quiz' }}
        </button>
      </div>
    </form>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDeck } from '@/api/topics.js'
import { createQuizForTopic } from '@/api/quizzes.js'
import { toastSuccess } from '@/composables/toast.js'
import AppLayout from '@/layout/AppLayout.vue'

const route = useRoute()
const router = useRouter()

const topicId = computed(() => {
  const p = route.params.topic
  if (typeof p === 'string' && p.length > 0) return p
  if (Array.isArray(p) && p.length > 0 && typeof p[0] === 'string') return p[0]
  return ''
})

const deck = ref(null)

const quizName = ref('')
const loadLoading = ref(false)
const loadError = ref('')
const saving = ref(false)
const formError = ref('')
const validationErrors = ref({})

const fieldErrors = computed(() => ({
  name: validationErrors.value.name || validationErrors.value.title || []
}))

async function load() {
  if (!topicId.value) return
  loadError.value = ''
  loadLoading.value = true
  try {
    deck.value = await fetchDeck(topicId.value)
  } catch (e) {
    loadError.value = e?.message || 'Nie udało się wczytać zestawu.'
  } finally {
    loadLoading.value = false
  }
}

watch(
  () => route.params.topic,
  () => {
    quizName.value = ''
    formError.value = ''
    if (topicId.value) load()
  },
  { immediate: true }
)

async function submit() {
  if (!topicId.value || saving.value || !quizName.value.trim()) return
  formError.value = ''
  validationErrors.value = {}
  saving.value = true
  try {
    await createQuizForTopic(topicId.value, quizName.value)
    const d = await fetchDeck(topicId.value)
    deck.value = d
    toastSuccess('Utworzono quiz.')
    const qLen = Math.max(0, (d?.quizzes?.length ?? 1) - 1)
    const deckKey = String(d?.uuid ?? d?.id ?? topicId.value)
    await router.replace({ name: 'quiz.edit', params: { topic: topicId.value, id: `${deckKey}-${qLen}` } })
  } catch (e) {
    if (e?.errors && typeof e.errors === 'object') {
      validationErrors.value = e.errors
    }
    formError.value = e?.message || 'Nie udało się utworzyć quizu.'
  } finally {
    saving.value = false
  }
}
</script>
