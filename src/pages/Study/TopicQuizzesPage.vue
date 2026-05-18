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

<style scoped>
.deck-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.deck-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.deck-title {
  font-size: 16px;
  font-weight: 500;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  padding: 2px 4px;
  line-height: 1;
  text-decoration: none;
}

.decks-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.deck-cube {
  background: var(--bg-primary);
  border: 0.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  min-height: 210px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
}

.deck-cube:hover {
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.cube-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.deck-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.deck-info {
  flex: 1;
  min-width: 0;
}

.deck-name {
  font-weight: 500;
  font-size: 15px;
}

.deck-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.deck-progress {
  margin-top: auto;
}

.pct {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.progress-bar {
  height: 4px;
  background: var(--bg-secondary);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
}

.empty-note {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 760px) {
  .decks-grid {
    grid-template-columns: 1fr;
  }
}
</style>
