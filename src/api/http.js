import router from '@/router/index.js'
import { store } from '@/entities/store.js'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Brak VITE_API_BASE_URL.')
  }
  if (!store.token) {
    throw new Error('Brak tokenu — zaloguj się ponownie.')
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${store.token}`,
    ...options.headers
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  })

  const data = await response.json().catch(() => ({}))

  if (response.status === 401) {
    store.clearAuth()
    router.replace({ name: 'login' })
    throw new Error('Sesja wygasła — zaloguj się ponownie.')
  }

  if (data?.errors) {
    const err = new Error('Request failed')
    err.errors = data.errors
    throw err
  }

  if (!response.ok) {
    const msg = data?.message || data?.error || `HTTP ${response.status}`
    throw new Error(msg)
  }

  return { response, data }
}
