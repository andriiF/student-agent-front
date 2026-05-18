<template>
  <div class="login-page">
    <div class="logo">
      <div class="logo-title">Quizz</div>
      <div class="logo-sub">Ucz się mądrzej, nie dłużej</div>
    </div>

    <div class="auth-card">
      <h2 class="auth-title">Zaloguj się</h2>
      <p class="auth-sub">Witaj z powrotem!</p>
      <div class="field">
        <label>E-mail</label>
        <input v-model="email" type="email" placeholder="jan@student.pl" @keyup.enter="submit"/>
        <p v-if="error['email']" v-for="e in error['email']" class="err">{{ e }}</p>
      </div>
      <div class="field">
        <label>Haslo</label>
        <input v-model="password" type="password" placeholder="************" @keyup.enter="submit"/>
        <p v-if="error['password']" v-for="e in error['password']" class="err">{{ e }}</p>
      </div>
      <button class="btn-primary" :disabled="loading" @click="submit">
        {{ loading ? 'Logowanie...' : 'Zaloguj się' }}
      </button>
      <p class="auth-switch">Nie masz konta? <span> <RouterLink to="register">  Zarejestruj się </RouterLink></span></p>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {store} from '@/entities/store.js'

const emit = defineEmits(['logged-in'])

const email = ref('')
const password = ref('')
const error = ref([])
const loading = ref(false)

async function submit() {
  if (loading.value) return
  error.value = []
  loading.value = true

  try {
    await store.login(email.value, password.value)
  } catch (e) {
    error.value = e.errors;
    loading.value = false
    return
  }

  loading.value = false
  emit('logged-in')
}
</script>
