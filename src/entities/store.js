import { reactive } from 'vue'
import router from '@/router/index.js'

const AUTH_TOKEN_KEY = 'studyflow_auth_token'
const AUTH_USER_KEY = 'studyflow_auth_user'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

let tokenExpiryTimerId = null

function clearTokenExpiryTimer() {
  if (tokenExpiryTimerId != null) {
    clearTimeout(tokenExpiryTimerId)
    tokenExpiryTimerId = null
  }
}

function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getJwtExp(token) {
  const exp = parseJwtPayload(token)?.exp
  return typeof exp === 'number' ? exp : null
}

export function isAccessTokenExpired(token) {
  const exp = getJwtExp(token)
  if (exp == null) return false
  return Date.now() >= exp * 1000
}

function scheduleTokenExpiryRedirect() {
  clearTokenExpiryTimer()
  const token = store.token
  if (!token) return
  const exp = getJwtExp(token)
  if (exp == null) return
  const ms = Math.max(0, exp * 1000 - Date.now())
  tokenExpiryTimerId = setTimeout(() => {
    tokenExpiryTimerId = null
    if (store.token && isAccessTokenExpired(store.token)) {
      store.clearAuth()
      router.replace({ name: 'login' })
    }
  }, ms)
}

export const store = reactive({
  user: null,
  token: null,

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (data.errors) {
      const error = new Error('Request failed')
      error.errors = data.errors
      throw error
    }

    if (!data?.token) {
      throw new Error('Brak tokenu JWT w odpowiedzi backendu.')
    }

    this.token = data.token
    this.user = data.user || { email }
    localStorage.setItem(AUTH_TOKEN_KEY, this.token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user))
    scheduleTokenExpiryRedirect()

    router.push({ name: 'dashboard' })
  },

  async register(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (data.errors) {
      const error = new Error('Request failed')
      error.errors = data.errors
      throw error
    }

    if (!data?.token) {
      throw new Error('Brak tokenu JWT w odpowiedzi backendu.')
    }

    this.token = data.token
    this.user = data.user || { email }
    localStorage.setItem(AUTH_TOKEN_KEY, this.token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user))
    scheduleTokenExpiryRedirect()

    router.push({ name: 'dashboard' })
  },

  clearAuth() {
    clearTokenExpiryTimer()
    this.user = null
    this.token = null
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  },

  initAuth() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const userRaw = localStorage.getItem(AUTH_USER_KEY)
    if (!token) return

    if (isAccessTokenExpired(token)) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      return
    }

    this.token = token
    if (userRaw) {
      try {
        this.user = JSON.parse(userRaw)
      } catch {
        this.user = null
      }
    }
    scheduleTokenExpiryRedirect()
  },

  logout() {
    this.clearAuth()
    router.push({ name: 'login' })
  }
})
