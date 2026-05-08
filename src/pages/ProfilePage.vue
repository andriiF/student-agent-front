<template>
  <div>
    <div class="profile-card">
      <div class="avatar">{{ initials }}</div>
      <div>
        <div class="prof-name">{{ store.user?.name }}</div>
        <div class="prof-email">{{ store.user?.email }}</div>
        <div class="prof-since">Konto od: kwiecień 2026</div>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stat"><div class="stat-label">Zestawy</div><div class="stat-value">{{ store.decks.length }}</div></div>
      <div class="stat"><div class="stat-label">Quizy</div><div class="stat-value">{{ totalQuizzes }}</div></div>
      <div class="stat"><div class="stat-label">Pytania</div><div class="stat-value">{{ totalQuestions }}</div></div>
    </div>

    <button class="btn-logout" @click="logout">Wyloguj się</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../entities/store.js'

const emit = defineEmits(['logged-out'])

const initials = computed(() =>
  (store.user?.name || 'JK').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)

const totalQuizzes = computed(() =>
  store.decks.reduce((sum, deck) => sum + (deck.quizzes?.length || 0), 0)
)

const totalQuestions = computed(() =>
  store.decks.reduce(
    (sum, deck) => sum + (deck.quizzes || []).reduce((qSum, quiz) => qSum + (quiz.questions?.length || 0), 0),
    0
  )
)

function logout() {
  store.logout()
  emit('logged-out')
}
</script>

<style scoped>
.profile-card { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 16px; }
.avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--purple-light); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 500; color: var(--purple-text); flex-shrink: 0; }
.prof-name { font-size: 18px; font-weight: 500; }
.prof-email { font-size: 14px; color: var(--text-secondary); margin-top: 2px; }
.prof-since { font-size: 13px; color: var(--text-secondary); margin-top: 6px; }
.profile-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1.5rem; }
.stat { background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1rem; }
.stat-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 500; }
.btn-logout { width: 100%; padding: 10px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: transparent; font-size: 14px; color: var(--danger); }
.btn-logout:hover { background: var(--danger-light); }
</style>
