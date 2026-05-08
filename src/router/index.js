import { createRouter, createWebHistory } from 'vue-router'
import { store } from '../entities/store.js'
import LoginPage from '@/pages/LoginPage.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/pages/HomePage.vue') },
  { path: '/quiz/:id/edit', name: 'quiz-edit-by-id', component: () => import('@/pages/Quiz/SetsPage.vue') },
  { path: '/quiz/:id/:quizId', name: 'quiz-play-by-id', component: () => import('@/pages/Quiz/QuizPage.vue') },
  { path: '/sets/play', name: 'quiz-play', component: () => import('@/pages/Quiz/QuizPage.vue') },
  { path: '/sets', name: 'quiz-edit', component: () => import('@/pages/Quiz/SetsPage.vue') },
  { path: '/sets/:id/edit', name: 'set-edit', component: () => import('@/pages/Quiz/SetsPage.vue') },
  { path: '/sets/question', name: 'question-edit', component: () => import('@/pages/Quiz/QuestionAnswersPage.vue') },
  { path: '/sets/create', name: 'create', component: () => import('@/pages/AddDeckPage.vue') },
  { path: '/profile', name: 'profile', component: () => import('@/pages/ProfilePage.vue') },
  { path: '/', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const isLoggedIn = Boolean(store.token || store.user)

  if (!isLoggedIn && to.name !== 'login') {
    return { name: 'login' }
  }

  if (isLoggedIn && to.name === 'login') {
    return { name: 'dashboard' }
  }

  return true
})

export default router
