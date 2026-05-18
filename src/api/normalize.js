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

export function answerDisplayName(answer) {
  if (typeof answer === 'string') return answer
  return String(answer?.name ?? answer?.text ?? '')
}

export function normalizeAnswer(raw) {
  if (typeof raw === 'string') {
    return {
      uuid: null,
      name: raw,
      explanation: '',
      is_correct: false,
      is_active: true
    }
  }
  if (!raw || typeof raw !== 'object') {
    return {
      uuid: null,
      name: '',
      explanation: '',
      is_correct: false,
      is_active: true
    }
  }

  const isActive =
    raw.is_active === undefined && raw.isActive === undefined
      ? true
      : Boolean(raw.is_active ?? raw.isActive)

  return {
    uuid: raw.uuid ?? raw.id ?? null,
    name: String(raw.name ?? raw.text ?? ''),
    explanation: String(raw.explanation ?? ''),
    is_correct: Boolean(raw.is_correct ?? raw.isCorrect ?? false),
    is_active: isActive
  }
}

export function normalizeQuestion(raw) {
  if (!raw || typeof raw !== 'object') return null

  const allAnswers = Array.isArray(raw.answers)
    ? raw.answers.map(normalizeAnswer)
    : []
  const answers = allAnswers.filter(
    (a) => a.is_active && answerDisplayName(a).trim()
  )
  const correctIndices = answers
    .map((a, i) => (a.is_correct ? i : -1))
    .filter((i) => i >= 0)

  return {
    uuid: raw.uuid ?? raw.id,
    name: raw.name ?? raw.q ?? '',
    answers,
    correctIndices: correctIndices.length ? correctIndices : normalizeCorrectIndices(raw.correct)
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
    questions,
    questions_count: raw.questions_count
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

/** Wiersz formularza edycji pytania → payload API */
export function answerRowToPayload(row) {
  const name = String(row?.name ?? row?.text ?? '').trim()
  return {
    uuid: row?.uuid ?? null,
    name,
    explanation: String(row?.explanation ?? '').trim(),
    is_correct: Boolean(row?.is_correct && row?.is_active && name),
    is_active: Boolean(row?.is_active)
  }
}

/** API / znormalizowane pytanie → wiersze formularza (wszystkie odpowiedzi, także nieaktywne) */
export function mapQuestionToAnswerRows(question) {
  const rawAnswers = Array.isArray(question?.answers) ? question.answers : []
  if (!rawAnswers.length) {
    return [{ name: '', explanation: '', is_correct: true, is_active: true }]
  }

  return rawAnswers.map((a) => {
    if (typeof a === 'string') {
      return { name: a, explanation: '', is_correct: false, is_active: true }
    }
    const normalized = normalizeAnswer(a)
    return {
      uuid: normalized.uuid,
      name: normalized.name,
      explanation: normalized.explanation,
      is_correct: normalized.is_correct,
      is_active: normalized.is_active
    }
  })
}
