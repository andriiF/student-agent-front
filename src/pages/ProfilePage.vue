<template>
  <AppLayout>
    <div class="profile-card">
      <div class="avatar">{{ initials }}</div>
      <div>
        <div class="prof-name">{{ store.user?.name }}</div>
        <div class="prof-email">{{ store.user?.email }}</div>
        <div class="prof-since">Konto od: kwiecień 2026</div>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stat"><div class="stat-label">Zestawy</div><div class="stat-value">{{ decks.length }}</div></div>
      <div class="stat"><div class="stat-label">Quizy</div><div class="stat-value">{{ totalQuizzes }}</div></div>
      <div class="stat"><div class="stat-label">Pytania</div><div class="stat-value">{{ totalQuestions }}</div></div>
    </div>

    <button class="btn-logout" @click="logout">Wyloguj się</button>
  </AppLayout>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { store } from '@/entities/store.js'
import { fetchDecks } from '@/api/topics.js'
import AppLayout from '@/layout/AppLayout.vue'

const emit = defineEmits(['logged-out'])
const decks = ref([])

const initials = computed(() =>
  (store.user?.name || 'JK').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)

const totalQuizzes = computed(() =>
  decks.value.reduce((sum, deck) => sum + (deck.quizzes?.length || 0), 0)
)

const totalQuestions = computed(() =>
  decks.value.reduce(
    (sum, deck) => sum + (deck.quizzes || []).reduce((qSum, quiz) => qSum + (quiz.questions?.length || 0), 0),
    0
  )
)

onMounted(async () => {
  try {
    decks.value = await fetchDecks()
  } catch {
    /* ignore */
  }
})

function logout() {
  store.logout()
  emit('logged-out')
}
</script>

