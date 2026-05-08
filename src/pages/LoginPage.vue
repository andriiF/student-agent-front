<template>
  <div class="login-page">
    <div class="logo">
      <div class="logo-title">Quizz</div>
      <div class="logo-sub">Ucz się mądrzej, nie dłużej</div>
    </div>

    <div class="auth-card">
      <template v-if="mode === 'login'">
        <h2 class="auth-title">Zaloguj się</h2>
        <p class="auth-sub">Witaj z powrotem!</p>
        <div class="field">
          <label>E-mail</label>
          <input v-model="email" type="email" placeholder="jan@student.pl" @keyup.enter="submit" />
        </div>
        <div class="field">
          <label>Haslo</label>
          <input v-model="password" type="password" placeholder="........" @keyup.enter="submit" />
        </div>
        <p v-if="error" class="err">{{ error }}</p>
        <button class="btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Logowanie...' : 'Zaloguj się' }}
        </button>
        <p class="auth-switch">Nie masz konta? <span @click="mode = 'register'">Zarejestruj się</span></p>
      </template>

      <template v-else>
        <h2 class="auth-title">Nowe konto</h2>
        <p class="auth-sub">Dołącz do tysięcy studentów</p>
        <div class="field">
          <label>Imię i nazwisko</label>
          <input v-model="name" type="text" placeholder="Jan Kowalski" />
        </div>
        <div class="field">
          <label>E-mail</label>
          <input v-model="email" type="email" placeholder="jan@student.pl" />
        </div>
        <div class="field">
          <label>Haslo</label>
          <input v-model="password" type="password" placeholder="min. 6 znakow" @keyup.enter="submit" />
        </div>
        <p v-if="error" class="err">{{ error }}</p>
        <button class="btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Tworzenie konta...' : 'Utwórz konto' }}
        </button>
        <p class="auth-switch">Masz już konto? <span @click="mode = 'login'">Zaloguj się</span></p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { store } from '../entities/store.js'

const emit = defineEmits(['logged-in'])

const mode = ref('login')
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (loading.value) return
  error.value = ''
  loading.value = true
  if (mode.value === 'login') {
    if (!email.value || !password.value) {
      error.value = 'Wypełnij oba pola.'
      loading.value = false
      return
    }
    try {
      await store.login(email.value, password.value)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Wystąpił błąd logowania.'
      loading.value = false
      return
    }
  } else {
    if (!name.value || !email.value || password.value.length < 6) {
      error.value = password.value.length < 6 && password.value ? 'Haslo za krótkie.' : 'Wypełnij wszystkie pola.'
      loading.value = false
      return
    }
    try {
      await store.register(name.value, email.value, password.value)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Wystąpił błąd rejestracji.'
      loading.value = false
      return
    }
  }
  loading.value = false
  emit('logged-in')
}
</script>

<style scoped>
.login-page { display: flex; flex-direction: column; align-items: center; padding: 3rem 1rem; min-height: 100vh; }
.logo { text-align: center; margin-bottom: 2rem; }
.logo-title { font-size: 26px; font-weight: 600; color: var(--text-primary); }
.logo-sub { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
.auth-card { width: 100%; max-width: 360px; background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; }
.auth-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
.auth-sub { font-size: 14px; color: var(--text-secondary); margin-bottom: 1.5rem; }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.field input { width: 100%; padding: 8px 12px; border-radius: var(--radius-md); border: 0.5px solid var(--border-hover); background: var(--bg-primary); color: var(--text-primary); font-size: 14px; }
.btn-primary { width: 100%; padding: 10px; border-radius: var(--radius-md); border: none; background: var(--purple); color: #fff; font-size: 15px; font-weight: 500; margin-top: 4px; transition: background 0.15s; }
.btn-primary:hover { background: var(--purple-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: default; }
.auth-switch { text-align: center; margin-top: 1rem; font-size: 13px; color: var(--text-secondary); }
.auth-switch span { color: var(--purple-dark); cursor: pointer; font-weight: 500; }
.auth-switch span:hover { text-decoration: underline; }
.err { font-size: 13px; color: var(--danger); margin-bottom: 8px; }
</style>
