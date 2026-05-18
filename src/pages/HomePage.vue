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

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1.5rem; }
.stat { background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 500; }
.stat-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.deck-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.deck-title { font-size: 16px; font-weight: 500; }
.decks-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.deck-cube { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; cursor: pointer; min-height: 210px; display: flex; flex-direction: column; gap: 12px; transition: border-color 0.15s, transform 0.15s; text-align: left; width: 100%; }
.deck-cube:hover { border-color: var(--border-hover); transform: translateY(-1px); }
.cube-top { display: flex; align-items: center; gap: 10px; }
.deck-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.deck-info { flex: 1; min-width: 0; }
.deck-name { font-weight: 500; font-size: 15px; }
.deck-meta { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.deck-progress { margin-top: auto; }
.pct { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
.progress-bar { height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-top: 6px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 2px; }
.empty-note { margin-top: 12px; font-size: 13px; color: var(--text-secondary); }

@media (max-width: 760px) {
  .stats-grid { grid-template-columns: 1fr; }
  .decks-grid { grid-template-columns: 1fr; }
}
</style>
