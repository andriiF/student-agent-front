<template>
  <div>
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
      <template v-if="selectedDeckIndex === null">
        <span class="deck-title">Twoje zestawy</span>
      </template>
      <template v-else>
        <div class="deck-title-wrap">
          <button class="btn-back" @click="selectedDeckIndex = null">←</button>
          <span class="deck-title">Quizy: {{ selectedDeck.name }}</span>
        </div>
      </template>
    </div>

    <div class="decks-grid">
      <div
        v-for="(item, i) in gridItems"
        :key="i"
        class="deck-cube"
        @click="onCubeClick(i)"
      >
        <div class="cube-top">
          <div class="deck-icon" :style="{ background: item.color }">{{ item.icon }}</div>
        </div>
        <div class="deck-info">
          <div class="deck-name">{{ item.name }}</div>
          <div class="deck-meta">{{ item.meta }}</div>
        </div>
        <div class="deck-progress">
          <div class="pct">{{ item.pct }}%</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: item.pct + '%', background: item.fillColor }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedDeckIndex !== null && gridItems.length === 0" class="empty-note">
      Ten zestaw nie ma jeszcze quizów.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '../entities/store.js'

const emit = defineEmits(['run-quiz'])

const todayCount = ref(0)
const selectedDeckIndex = ref(null)

const selectedDeck = computed(() => {
  if (selectedDeckIndex.value === null) return null
  return store.decks[selectedDeckIndex.value]
})

const gridItems = computed(() => {
  if (selectedDeckIndex.value === null) {
    return store.decks.map(deck => ({
      name: deck.name,
      icon: deck.icon,
      color: deck.color,
      fillColor: deck.fillColor,
      pct: deck.pct || 0,
      meta: `${(deck.quizzes || []).length} quizów`
    }))
  }

  return (selectedDeck.value?.quizzes || []).map(quiz => ({
    name: quiz.name,
    icon: '❓',
    color: selectedDeck.value.color,
    fillColor: selectedDeck.value.fillColor,
    pct: 0,
    meta: `${quiz.questions.length} pytań`
  }))
})

function onCubeClick(i) {
  if (selectedDeckIndex.value === null) {
    selectedDeckIndex.value = i
    return
  }

  emit('run-quiz', {
    deckIndex: selectedDeckIndex.value,
    quizIndex: i
  })
}
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1.5rem; }
.stat { background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 500; }
.stat-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.deck-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.deck-title-wrap { display: flex; align-items: center; gap: 8px; }
.deck-title { font-size: 16px; font-weight: 500; }
.btn-back { background: transparent; border: none; font-size: 20px; color: var(--text-secondary); padding: 2px 4px; line-height: 1; }
.decks-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.deck-cube { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; cursor: pointer; min-height: 210px; display: flex; flex-direction: column; gap: 12px; transition: border-color 0.15s, transform 0.15s; }
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
