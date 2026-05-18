import { apiFetch } from '@/api/http.js'
import { normalizeQuiz } from '@/api/normalize.js'
import { fetchDeck } from '@/api/topics.js'

export async function fetchQuizRow(quizId) {
  if (quizId === undefined || quizId === null || quizId === '') {
    throw new Error('Brak identyfikatora quizu.')
  }
  const id = encodeURIComponent(String(quizId))
  const { data } = await apiFetch(`/api/quiz/${id}`)
  const raw = data.quiz ?? data.data ?? data
  const quiz = normalizeQuiz(typeof raw === 'object' && raw !== null ? raw : null)
  if (!quiz) throw new Error('Nieprawidłowa odpowiedź serwera.')
  return quiz
}

export async function createQuizForTopic(deckUuid, quizName) {
  const trimmed = (quizName || '').trim()
  if (!trimmed) throw new Error('Podaj nazwę quizu.')

  const { data } = await apiFetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: trimmed, topic_id: deckUuid })
  })

  const raw = data.quiz ?? data.data ?? data
  let quiz = normalizeQuiz(typeof raw === 'object' && raw !== null ? raw : null)
  if (!quiz) {
    quiz = { uuid: undefined, id: undefined, name: trimmed, questions: [] }
  }
  return quiz
}

export async function updateQuiz(quizUuid, payload) {
  if (quizUuid === undefined || quizUuid === null || quizUuid === '') {
    throw new Error('Brak identyfikatora quizu.')
  }
  const id = encodeURIComponent(String(quizUuid))
  await apiFetch(`/api/quiz/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: payload?.name })
  })
}

export function resolveQuizEditSlot(deck, routeQuizId, deckListIndex = '') {
  const idStr = String(routeQuizId ?? '')
  const deckKey = String(deck?.uuid ?? deck?.id ?? deckListIndex ?? '')
  const quizzes = Array.isArray(deck?.quizzes) ? deck.quizzes : []

  const byList = quizzes.findIndex(q => String(q.uuid ?? q.id) === idStr)
  if (byList >= 0) {
    const qu = quizzes[byList]?.uuid ?? quizzes[byList]?.id
    const apiQuizId = qu != null && String(qu) !== '' ? String(qu) : null
    return { quizIndex: byList, apiQuizId }
  }

  const compoundPrefix = `${deckKey}-`
  if (idStr.startsWith(compoundPrefix)) {
    const qi = Number(idStr.slice(compoundPrefix.length))
    if (Number.isInteger(qi) && qi >= 0 && qi < quizzes.length) {
      const qu = quizzes[qi]?.uuid ?? quizzes[qi]?.id
      const apiQuizId = qu != null && String(qu) !== '' ? String(qu) : null
      return { quizIndex: qi, apiQuizId }
    }
  }

  return { quizIndex: -1, apiQuizId: idStr }
}

/** Ładuje zestaw + pełny quiz z API; zwraca deck z uzupełnionym quizem. */
export async function fetchQuizForEdit(topicUuid, routeQuizId) {
  const topicStr = String(topicUuid ?? '')
  const idStr = String(routeQuizId ?? '')
  if (!topicStr || !idStr) {
    throw new Error('Brak parametrów topic lub id.')
  }

  const deck = await fetchDeck(topicStr)
  if (!Array.isArray(deck.quizzes)) deck.quizzes = []

  const slot = resolveQuizEditSlot(deck, idStr, deck.uuid ?? deck.id)

  if (slot.quizIndex >= 0) {
    if (slot.apiQuizId) {
      const row = await fetchQuizRow(slot.apiQuizId)
      deck.quizzes[slot.quizIndex] = { ...deck.quizzes[slot.quizIndex], ...row }
    }
    return {
      deck,
      quizIndex: slot.quizIndex,
      quiz: deck.quizzes[slot.quizIndex]
    }
  }

  try {
    const row = await fetchQuizRow(idStr)
    let quizIdx = deck.quizzes.findIndex(q => String(q.uuid ?? q.id) === String(row.uuid ?? row.id))
    if (quizIdx >= 0) {
      deck.quizzes[quizIdx] = { ...deck.quizzes[quizIdx], ...row }
    } else {
      deck.quizzes.push(row)
      quizIdx = deck.quizzes.length - 1
    }
    return { deck, quizIndex: quizIdx, quiz: deck.quizzes[quizIdx] }
  } catch {
    throw new Error('Nie znaleziono quizu.')
  }
}
