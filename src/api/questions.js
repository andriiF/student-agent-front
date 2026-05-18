import { apiFetch } from '@/api/http.js'
import { normalizeQuestion } from '@/api/normalize.js'

export async function createQuestion(requestData) {
  await apiFetch('/api/question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  })
}

export async function updateQuestion(questionId, requestData) {
  if (questionId === undefined || questionId === null || questionId === '') {
    throw new Error('Brak identyfikatora pytania.')
  }
  const id = encodeURIComponent(String(questionId))
  await apiFetch(`/api/question/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  })
}

export async function fetchQuestion(questionId) {
  if (questionId === undefined || questionId === null || questionId === '') {
    throw new Error('Brak identyfikatora pytania.')
  }
  const id = encodeURIComponent(String(questionId))
  const { data } = await apiFetch(`/api/question/${id}`)
  const raw = data.question ?? data.data ?? data
  const q = normalizeQuestion(typeof raw === 'object' && raw !== null ? raw : null)
  if (!q) throw new Error('Nieprawidłowa odpowiedź serwera.')
  return q
}
