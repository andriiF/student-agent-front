<template>
  <AppLayout>
    <div class="deck-header">
      <div class="deck-title-wrap">
        <RouterLink :to="{ name: 'dashboard' }" class="btn-back" aria-label="Wróć do zestawów">←</RouterLink>
        <span class="deck-title">{{ deck?.name ?? 'Quizy' }}</span>
      </div>
    </div>

    <div v-if="loadError" class="empty-note">{{ loadError }}</div>
    <div v-else-if="loadLoading" class="empty-note">Ładowanie quizów…</div>

    <div v-else-if="quizzes.length === 0" class="empty-note">
      Ten zestaw nie ma jeszcze quizów.
    </div>

    <div v-else class="decks-grid">
      <RouterLink
        v-for="(quiz, i) in quizzes"
        :key="quiz.uuid ?? quiz.id ?? `quiz-${i}`"
        class="deck-cube"
        :to="quizLink(quiz)"
      >
        <div class="cube-top">
          <div
            class="deck-icon"
            :style="{ background: deck?.color ?? '#F1EFE8' }"
          >❓</div>
        </div>
        <div class="deck-info">
          <div class="deck-name">{{ quiz.name }}</div>
          <div class="deck-meta">{{ questionCount(quiz) }} pytań</div>
        </div>
        <div class="deck-progress">
          <div class="pct">{{ quizProgress(quiz) }}%</div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{
                width: quizProgress(quiz) + '%',
                background: deck?.fillColor ?? '#888780'
              }"
            ></div>
          </div>
        </div>
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDeck } from '@/api/topics.js'
import {
  applyProgressToDeck,
  buildProgressMap,
  fetchUserProgressSafe,
  getQuizProgress
} from '@/api/progress.js'
import AppLayout from '@/layout/AppLayout.vue'

const route = useRoute()

const deck = ref(null)
const progressMap = ref(new Map())
const loadLoading = ref(true)
const loadError = ref('')

const topicId = computed(() => String(route.params.topicId ?? ''))
const quizzes = computed(() => deck.value?.quizzes ?? [])

function quizProgress(quiz) {
  return getQuizProgress(quiz, progressMap.value)
}

function questionCount(quiz) {
  const n = quiz?.questions_count
  if (n != null && Number(n) >= 0) return Number(n)
  return (quiz?.questions || []).length
}

function quizLink(quiz) {
  const id = quiz?.uuid ?? quiz?.id
  if (!id || !topicId.value) return { name: 'dashboard.topic', params: { topicId: topicId.value } }
  return {
    name: 'study.quiz',
    params: { topicId: topicId.value, quizId: String(id) }
  }
}

async function loadDeck() {
  const id = topicId.value
  if (!id) {
    loadError.value = 'Brak identyfikatora zestawu.'
    loadLoading.value = false
    return
  }

  loadLoading.value = true
  loadError.value = ''
  try {
    const [deckRow, progressData] = await Promise.all([
      fetchDeck(id),
      fetchUserProgressSafe()
    ])
    progressMap.value = buildProgressMap(progressData)
    deck.value = applyProgressToDeck(deckRow, progressMap.value)
  } catch (e) {
    deck.value = null
    loadError.value = e?.message || 'Nie udało się pobrać zestawu.'
  } finally {
    loadLoading.value = false
  }
}

watch(topicId, loadDeck, { immediate: true })

watch(
  () => route.fullPath,
  () => {
    if (route.name === 'dashboard.topic' && topicId.value) {
      loadDeck()
    }
  }
)
</script>

