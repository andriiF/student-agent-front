<template>
  <div>
    <LoginPage v-if="route.name === 'login'" @logged-in="handleLogin" />

    <AppLayout
      v-else
      :tabs="mainTabs"
      :current-tab="currentTab"
      :initials="randomProfileLetter"
      @select-tab="handleTabSelect"
      @open-profile="router.push({ name: 'profile' })"
    >
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          @go="handleGo"
          @run-quiz="startQuizFromDashboard"
          @logged-out="handleLogout"
        />
      </RouterView>
    </AppLayout>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import AppLayout from './layout/AppLayout.vue'
import LoginPage from './pages/LoginPage.vue'

const route = useRoute()
const router = useRouter()

const mainTabs = [
  {id: 'dashboard', label: 'Główna'},
  {id: 'quiz', label: 'Zestawy'},
]

const randomProfileLetter = ref(
  String.fromCharCode(65 + Math.floor(Math.random() * 26))
)

const currentTab = computed(() => {
  if (route.name === 'quiz-play' || route.name === 'quiz-play-by-id' || route.name === 'quiz-edit' || route.name === 'quiz-edit-by-id' || route.name === 'set-edit' || route.name === 'question-edit') return 'quiz'
  return 'dashboard'
})

function startQuizFromDashboard(payload) {
  router.push({
    name: 'quiz-play-by-id',
    params: { id: payload.deckIndex, quizId: payload.quizIndex }
  })
}

function handleLogin() {
  router.push({ name: 'dashboard' })
}

function handleTabSelect(tabId) {
  if (tabId === 'quiz') {
    router.push({ name: 'quiz-edit' })
    return
  }
  router.push({ name: tabId })
}

function handleGo(target) {
  const routeByTarget = {
    home: 'dashboard',
    add: 'create',
    quiz: 'quiz-edit',
    sets: 'quiz-edit',
    profile: 'profile'
  }
  const routeName = routeByTarget[target]
  if (routeName) router.push({ name: routeName })
}

function handleLogout() {
  router.push({ name: 'login' })
}
</script>
