import { apiFetch } from '@/api/http.js'

function normalizeProgressRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const quizId = raw.quiz_id ?? raw.quizId
  if (!quizId) return null
  const progress = Number(raw.progress)
  return {
    quiz_id: String(quizId),
    progress: Number.isFinite(progress)
      ? Math.min(100, Math.max(0, Math.round(progress)))
      : 0
  }
}

/** GET /api/auth/getProgress → [{ quiz_id, progress }] */
export async function fetchUserProgress() {
  const { data } = await apiFetch('/api/auth/getProgress')
  const list = Array.isArray(data) ? data : data?.data ?? data?.progress ?? []
  return Array.isArray(list) ? list.map(normalizeProgressRow).filter(Boolean) : []
}

/** Postęp opcjonalny — błąd API nie blokuje listy zestawów/quizów. */
export async function fetchUserProgressSafe() {
  try {
    return await fetchUserProgress()
  } catch {
    return []
  }
}

export function buildProgressMap(progressList) {
  const map = new Map()
  for (const row of progressList ?? []) {
    if (row?.quiz_id != null) {
      map.set(String(row.quiz_id), row.progress ?? 0)
    }
  }
  return map
}

export function getQuizProgress(quiz, progressMap) {
  const id = String(quiz?.uuid ?? quiz?.id ?? '')
  if (id && progressMap?.has(id)) {
    return progressMap.get(id)
  }
  const fallback = Number(quiz?.progress ?? quiz?.pct ?? 0)
  return Number.isFinite(fallback)
    ? Math.min(100, Math.max(0, Math.round(fallback)))
    : 0
}

export function applyProgressToDeck(deck, progressMap) {
  if (!deck) return deck

  const quizzes = (deck.quizzes ?? []).map((q) => {
    const pct = getQuizProgress(q, progressMap)
    return { ...q, progress: pct, pct }
  })

  let deckPct = Number(deck.pct ?? deck.progress ?? 0) || 0
  if (quizzes.length) {
    deckPct = Math.round(
      quizzes.reduce((sum, q) => sum + (q.progress ?? 0), 0) / quizzes.length
    )
  }

  return { ...deck, quizzes, pct: deckPct, progress: deckPct }
}

export function applyProgressToDecks(decks, progressMap) {
  return (decks ?? []).map((deck) => applyProgressToDeck(deck, progressMap))
}
