<template>
  <AppLayout>
    <div class="stats-grid">
      <div class="stat">
        <div class="stat-label">Nauka dzisiaj</div>
        <div class="stat-value">{{ todayCount }}</div>
        <div class="stat-sub">quizów</div>
      </div>
      <div class="stat">
        <div class="stat-label">Seria dni</div>
        <div class="stat-value">7</div>
        <div class="stat-sub">z rzędu</div>
      </div>
      <div class="stat">
        <div class="stat-label">Wynik quizów</div>
        <div class="stat-value">78%</div>
        <div class="stat-sub">średnia</div>
      </div>
    </div>

    <div class="deck-header">
      <span class="deck-title">Twoje zestawy</span>
    </div>

    <div v-if="loadError" class="empty-note">{{ loadError }}</div>
    <div v-else-if="loadLoading" class="empty-note">Ładowanie zestawów…</div>

    <div v-else class="decks-grid">
      <button
        v-for="(deck, i) in decks"
        :key="deck.uuid ?? deck.id ?? `deck-${i}`"
        type="button"
        class="deck-cube"
        @click="openDeck(deck)"
      >
        <div class="cube-top">
          <div class="deck-icon" :style="{ background: deck.color }">{{ deck.icon }}</div>
        </div>
        <div class="deck-info">
          <div class="deck-name">{{ deck.name }}</div>
          <div class="deck-meta">{{ (deck.quizzes || []).length }} quizów</div>
        </div>
        <div class="deck-progress">
          <div class="pct">{{ deck.pct || 0 }}%</div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (deck.pct || 0) + '%', background: deck.fillColor }"
            ></div>
          </div>
        </div>
      </button>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchDecks } from '@/api/topics.js'
import {
  applyProgressToDecks,
  buildProgressMap,
  fetchUserProgressSafe
} from '@/api/progress.js'
import AppLayout from '@/layout/AppLayout.vue'

const router = useRouter()
const todayCount = ref(0)
const decks = ref([])
const loadLoading = ref(true)
const loadError = ref('')

function openDeck(deck) {
  const topicId = deck?.uuid ?? deck?.id
  if (!topicId) return
  router.push({ name: 'dashboard.topic', params: { topicId: String(topicId) } })
}

onMounted(async () => {
  loadError.value = ''
  loadLoading.value = true
  try {
    const [decksData, progressData] = await Promise.all([
      fetchDecks(),
      fetchUserProgressSafe()
    ])
    const progressMap = buildProgressMap(progressData)
    decks.value = applyProgressToDecks(decksData, progressMap)
  } catch (e) {
    loadError.value = e?.message || 'Nie udało się pobrać zestawów.'
  } finally {
    loadLoading.value = false
  }
})
</script>

