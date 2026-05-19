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
          <div class="quiz-list-toolbar">
            <label class="quiz-select-all chk">
              <input
                ref="selectAllInput"
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
              />
              Zaznacz wszystkie
            </label>
            <button
              v-if="someSelected"
              type="button"
              class="btn-share"
              @click="shareSelected"
            >
              Udostępnij
            </button>
          </div>
          <div
            v-for="(quiz, i) in quizzes"
            :key="quiz.uuid ?? quiz.id ?? `q-${i}`"
            class="pick-item pick-item--with-check"
          >
            <label class="quiz-check chk" @click.stop>
              <input
                type="checkbox"
                :checked="isQuizSelected(quiz)"
                @change="toggleQuiz(quiz)"
              />
            </label>
            <RouterLink
              class="pick-item-link"
              :to="{ name: 'quiz.edit', params: { topic: topicId, id: quiz.uuid ?? quiz.id } }"
            >
              <span>{{ quiz.name }}</span>
              <span class="pick-meta">{{ (quiz.questions || []).length }} pytań</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>

  <Modal
    title="Udostępnij quizy"
    :open="shareModalOpen"
    @close="closeShareModal"
  >
    <form class="share-form" @submit.prevent="submitShare">
      <div class="form-group">
        <label for="share-email">Adres e-mail</label>
        <input
          id="share-email"
          v-model="shareEmail"
          type="email"
          autocomplete="email"
          placeholder="np. jan@example.com"
          :disabled="shareLoading"
        />
        <p v-if="shareError" class="err">{{ shareError }}</p>
      </div>
      <div class="modal-actions">
        <button
          type="button"
          class="btn-modal-cancel"
          :disabled="shareLoading"
          @click="closeShareModal"
        >
          Anuluj
        </button>
        <button
          type="submit"
          class="btn-save"
          :disabled="shareLoading || !shareEmail.trim()"
        >
          {{ shareLoading ? 'Wysyłanie…' : 'Udostępnij' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDeck, updateTopic } from '@/api/topics.js'
import { toastSuccess } from '@/composables/toast.js'
import AppLayout from '@/layout/AppLayout.vue'
import Modal from '@/components/modal/Modal.vue'

const route = useRoute()
const deck = ref(null)
const name = ref('')
const loadLoading = ref(true)
const loadError = ref('')
const saveLoading = ref(false)
const formError = ref('')
const validationErrors = ref({})
const selectedQuizIds = ref(new Set())
const selectAllInput = ref(null)
const shareModalOpen = ref(false)
const shareEmail = ref('')
const shareError = ref('')
const shareLoading = ref(false)

const topicId = computed(() => String(route.params.id ?? ''))

const quizzes = computed(() => deck.value?.quizzes ?? [])

const fieldErrors = computed(() => ({
  name: validationErrors.value.name || []
}))

const allSelected = computed(() => {
  const list = quizzes.value
  if (!list.length) return false
  return list.every((q) => isQuizSelected(q))
})

const someSelected = computed(() => quizzes.value.some((q) => isQuizSelected(q)))

function quizKey(quiz) {
  return String(quiz?.uuid ?? quiz?.id ?? '')
}

function isQuizSelected(quiz) {
  const id = quizKey(quiz)
  return Boolean(id) && selectedQuizIds.value.has(id)
}

function toggleQuiz(quiz) {
  const id = quizKey(quiz)
  if (!id) return
  const next = new Set(selectedQuizIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedQuizIds.value = next
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedQuizIds.value = new Set()
    return
  }
  selectedQuizIds.value = new Set(
    quizzes.value.map((q) => quizKey(q)).filter(Boolean)
  )
}

function shareSelected() {
  shareError.value = ''
  shareEmail.value = ''
  shareModalOpen.value = true
}

function closeShareModal() {
  if (shareLoading.value) return
  shareModalOpen.value = false
  shareEmail.value = ''
  shareError.value = ''
}

async function submitShare() {
  const email = shareEmail.value.trim()
  if (!email) {
    shareError.value = 'Podaj adres e-mail.'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    shareError.value = 'Podaj poprawny adres e-mail.'
    return
  }

  shareLoading.value = true
  shareError.value = ''
  try {
    // TODO: API udostępniania — quiz_ids: [...selectedQuizIds.value]
    closeShareModal()
    toastSuccess('Udostępniono quizy.')
  } catch (e) {
    shareError.value = e?.message || 'Nie udało się udostępnić quizów.'
  } finally {
    shareLoading.value = false
  }
}

function syncSelectAllIndeterminate() {
  const el = selectAllInput.value
  if (!el) return
  el.indeterminate = someSelected.value && !allSelected.value
}

watch([allSelected, someSelected], syncSelectAllIndeterminate)

async function load() {
  const id = topicId.value
  if (!id) {
    loadError.value = 'Brak identyfikatora zestawu w adresie URL.'
    loadLoading.value = false
    return
  }
  loadError.value = ''
  loadLoading.value = true
  selectedQuizIds.value = new Set()
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
  { immediate: true }
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

