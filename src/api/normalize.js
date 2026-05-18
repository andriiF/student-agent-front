export function normalizeCorrectIndices(value) {
  if (Array.isArray(value)) {
    const out = [...new Set(value.filter(i => Number.isInteger(i) && i >= 0))].sort((a, b) => a - b)
    return out.length ? out : [0]
  }
  if (value === undefined || value === null) return [0]
  const n = Number(value)
  if (Number.isInteger(n) && n >= 0) return [n]
  return [0]
}

export function normalizeQuestion(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    uuid: raw.uuid,
    name: raw.name ?? '',
    answers:raw.answers
  }
}

export function normalizeQuiz(raw) {
  if (!raw || typeof raw !== 'object') return null
  const questions = Array.isArray(raw.questions)
    ? raw.questions.map(normalizeQuestion).filter(Boolean)
    : []
  const id = raw.uuid ?? raw.id ?? raw._id
  return {
    uuid: id,
    id,
    name: raw.name ?? raw.title ?? 'Quiz',
    questions
  }
}

export function normalizeDeck(raw) {
  if (!raw || typeof raw !== 'object') return null
  const quizzes = Array.isArray(raw.quizzes) ? raw.quizzes.map(normalizeQuiz).filter(Boolean) : []
  const id = raw.uuid ?? raw.id ?? raw._id
  return {
    uuid: id,
    id,
    name: raw.name ?? raw.title ?? 'Zestaw',
    icon: raw.icon ?? '📚',
    color: raw.color ?? '#F1EFE8',
    fillColor: raw.fillColor ?? '#888780',
    pct: raw.pct ?? 0,
    cards: Array.isArray(raw.cards) ? raw.cards : [],
    quizzes
  }
}
