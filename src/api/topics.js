import { apiFetch } from '@/api/http.js'
import { normalizeDeck } from '@/api/normalize.js'

export async function fetchDecks() {
  const { data } = await apiFetch('/api/topic')
  const list = Array.isArray(data) ? data : data.decks ?? data.data ?? []
  return list.map(normalizeDeck).filter(Boolean)
}

export async function fetchDeck(uuid) {
  if (uuid === undefined || uuid === null || uuid === '') {
    throw new Error('Brak identyfikatora zestawu.')
  }
  const id = encodeURIComponent(String(uuid))
  try {
    const { data } = await apiFetch(`/api/topic/${id}`)
    const raw = data.topic ?? data.deck ?? data.data ?? data
    const deck = normalizeDeck(typeof raw === 'object' && raw !== null ? raw : null)
    if (!deck) throw new Error('Nieprawidłowa odpowiedź serwera.')
    return deck
  } catch (e) {
    if (e?.message?.includes('404') || String(e).includes('404')) {
      const decks = await fetchDecks()
      const local = decks.find(d => String(d.uuid ?? d.id) === String(uuid))
      if (local) return local
      throw new Error('Nie znaleziono zestawu.')
    }
    throw e
  }
}

export async function createDeck(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('Podaj nazwę zestawu.')

  const { data } = await apiFetch('/api/topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: trimmed })
  })

  const raw = data.deck ?? data.data ?? data
  const rawObj = typeof raw === 'object' && raw !== null ? raw : null
  let deck = normalizeDeck(rawObj)
  if (!deck) {
    const deckId = rawObj ? (rawObj.uuid ?? rawObj.id ?? rawObj._id) : undefined
    deck = {
      uuid: deckId,
      id: deckId,
      name: trimmed,
      icon: '📚',
      color: '#F1EFE8',
      fillColor: '#888780',
      pct: 0,
      cards: [],
      quizzes: []
    }
  } else {
    deck.name = rawObj?.name ?? rawObj?.title ?? trimmed
  }
  return deck
}

export async function updateTopic(uuid, payload) {
  const name = (payload?.name ?? '').trim()
  if (!name) throw new Error('Podaj nazwę zestawu.')

  const id = encodeURIComponent(String(uuid))
  const { data } = await apiFetch(`/api/topic/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })

  const raw = data.topic ?? data.deck ?? data.data ?? null
  const updated = raw && typeof raw === 'object' ? normalizeDeck(raw) : null
  if (updated) return updated

  return normalizeDeck({ uuid, name, quizzes: [] })
}
