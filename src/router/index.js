import {createRouter, createWebHistory} from 'vue-router'
import {store, isAccessTokenExpired} from '@/entities/store.js'
import LoginPage from '@/pages/Auth/LoginPage.vue'
import RegisterPage from "@/pages/Auth/RegisterPage.vue";

const routes = [
    {path: '/login', name: 'login', component: LoginPage},
    {path: '/register', name: 'register', component: RegisterPage},
    {path: '/dashboard', name: 'dashboard', component: () => import('@/pages/HomePage.vue')},
    {path: '/quizz/topic/:topicId', name: 'dashboard.topic', component: () => import('@/pages/Study/TopicQuizzesPage.vue')},
    {path: '/quizz/topic/:topicId/quiz/:quizId', name: 'study.quiz', component: () => import('@/pages/Study/QuizStudyPage.vue')},
    {path: '/topic', name: 'topic', component: () => import('@/pages/Quiz/Sets/Index.vue')},
    {path: '/topic/new', name: 'topic.create', component: () => import('@/pages/Quiz/Sets/Create.vue')},
    {path: '/topic/:id/edit', name: 'topic.edit', component: () => import('@/pages/Quiz/Sets/Edit.vue')},
    {path: '/topic/:topic/quiz/create', name: 'quiz.create', component: () => import('@/pages/Quiz/Quiz/Create.vue')},
    {path: '/topic/:topic/quiz/:id/edit', name: 'quiz.edit', component: () => import('@/pages/Quiz/Quiz/Edit.vue')},

    {path: '/topic/:topic/quiz/:id/questions/create', name: 'question.create', component: () => import('@/pages/Quiz/Questions/Create.vue')},
    {path: '/topic/:topic/quiz/:quiz/questions/:id/edit', name: 'question.edit', component: () => import('@/pages/Quiz/Questions/Edit.vue')},


    {path: '/sets/play', name: 'quiz-play', component: () => import('@/pages/Quiz/QuizPage.vue')},
    {path: '/sets/:id/edit', name: 'set-edit', component: () => import('@/pages/Quiz/SetsPage.vue')},
    {path: '/sets/question', name: 'question-edit', component: () => import('@/pages/Quiz/QuestionAnswersPage.vue')},
    {path: '/sets/create', name: 'create', component: () => import('@/pages/AddDeckPage.vue')},
    {path: '/profile', name: 'profile', component: () => import('@/pages/ProfilePage.vue')},
    {path: '/', redirect: '/login'}
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to) => {
    const notAuthPages = ['login', 'register']

    if (store.token && isAccessTokenExpired(store.token)) {
        store.clearAuth()
        if (notAuthPages.includes(to.name)) return true
        return {name: 'login'}
    }

    const isLoggedIn = Boolean(store.token || store.user)

    if (!isLoggedIn && notAuthPages.indexOf(to.name) < 0) {
        return {name: 'login'}
    }

    if (isLoggedIn && to.name === 'login') {
        return {name: 'dashboard'}
    }

    return true
})

export default router
