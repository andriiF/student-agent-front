import { apiFetch } from '@/api/http.js'

/** answer_id z API: jeden string lub tablica stringów. */
export function normalizeAnswerIds(raw) {
  if (raw == null || raw === '') return []
  if (Array.isArray(raw)) {
    return raw.map((id) => String(id)).filter((id) => id !== '')
  }
  return [String(raw)]
}

function normalizeProgressRow(raw) {
  if (!raw || typeof raw !== 'object') return null
  const questionId = raw.question_id ?? raw.questionId
  if (!questionId) return null
  const answerIds = normalizeAnswerIds(raw.answer_id ?? raw.answerId ?? null)
  const row = {
    question_id: String(questionId),
    answer_id: answerIds.length === 0 ? null : answerIds.length === 1 ? answerIds[0] : answerIds
  }
  if (raw.is_correct !== undefined || raw.isCorrect !== undefined) {
    row.is_correct = Boolean(raw.is_correct ?? raw.isCorrect)
  }
  return row
}

/** Liczba poprawnych odpowiedzi z GET /api/quizplay (pole is_correct). */
export function countCorrectFromQuizPlayProgress(progressAnswers) {
  const rows = Array.isArray(progressAnswers) ? progressAnswers : []
  return rows.filter((r) => r?.is_correct === true).length
}

export function isQuizFullyAnsweredInProgress(progressAnswers, questionCount) {
  if (!questionCount) return false
  const rows = Array.isArray(progressAnswers) ? progressAnswers : []
  const answered = rows.filter((r) => {
    if (!r?.question_id) return false
    return normalizeAnswerIds(r.answer_id).length > 0
  }).length
  return answered >= questionCount
}

export async function fetchQuizPlayProgress(quizUuid) {
  if (quizUuid === undefined || quizUuid === null || quizUuid === '') {
    throw new Error('Brak identyfikatora quizu.')
  }

  const id = encodeURIComponent(String(quizUuid))

  try {
    const { data } = await apiFetch(`/api/quizplay/${id}`)
    const raw = data.answers ?? data.data?.answers ?? []
    const answers = Array.isArray(raw) ? raw.map(normalizeProgressRow).filter(Boolean) : []
    return { answers }
  } catch (e) {
    if (e?.message?.includes('404') || String(e).includes('404')) {
      return { answers: [] }
    }
    throw e
  }
}

export function applyProgressToQuestionStates(questions, progressAnswers) {
  const states = {}
  const list = Array.isArray(questions) ? questions : []
  const rows = Array.isArray(progressAnswers) ? progressAnswers : []

  for (const row of rows) {
    const questionId = row?.question_id
    if (!questionId) continue

    const qIndex = list.findIndex((q) => String(q?.uuid ?? q?.id) === String(questionId))
    if (qIndex < 0) continue

    const question = list[qIndex]
    const answerIds = normalizeAnswerIds(row.answer_id)
    if (!answerIds.length) {
      states[qIndex] = { selectedIndices: [], revealed: false }
      continue
    }

    const selectedIndices = answerIds
      .map((aid) =>
        (question.answers ?? []).findIndex(
          (a) => String(a?.uuid ?? a?.id) === String(aid)
        )
      )
      .filter((i) => i >= 0)

    if (!selectedIndices.length) continue

    const state = {
      selectedIndices,
      revealed: true
    }
    if (typeof row.is_correct === 'boolean') {
      state.isCorrect = row.is_correct
    }
    states[qIndex] = state
  }

  return states
}

export function getResumeQuestionIndex(questions, questionStates) {
  const list = Array.isArray(questions) ? questions : []
  const states = questionStates ?? {}

  for (let i = 0; i < list.length; i++) {
    if (!states[i]?.revealed) return i
  }

  return list.length
}

/** Indeks pierwszego pytania bez zapisanego postępu (tylko po question_id). */
export function getResumeQuestionIndexFromProgress(questions, progressAnswers) {
  const list = Array.isArray(questions) ? questions : []
  const rows = Array.isArray(progressAnswers) ? progressAnswers : []
  const answeredIds = new Set(
    rows
      .filter((r) => r?.question_id)
      .map((r) => String(r.question_id))
  )

  for (let i = 0; i < list.length; i++) {
    const qid = String(list[i]?.uuid ?? list[i]?.id ?? '')
    if (qid && !answeredIds.has(qid)) return i
  }

  return list.length
}

/** Usuwa zapisany postęp quizu — DELETE /api/quizplay/:quiz_id */
export async function clearQuizPlayProgress(quizUuid) {
  if (quizUuid === undefined || quizUuid === null || quizUuid === '') {
    throw new Error('Brak identyfikatora quizu.')
  }

  const id = encodeURIComponent(String(quizUuid))

  try {
    const { data } = await apiFetch(`/api/quizplay/${id}`, { method: 'DELETE' })
    return data
  } catch (e) {
    if (e?.message?.includes('404') || String(e).includes('404')) {
      return null
    }
    throw e
  }
}

export async function saveQuizPlayAnswer(quizUuid, { questionId, answerId }) {
  if (quizUuid === undefined || quizUuid === null || quizUuid === '') {
    throw new Error('Brak identyfikatora quizu.')
  }
  if (!questionId) {
    throw new Error('Brak identyfikatora pytania.')
  }

  const id = encodeURIComponent(String(quizUuid))
  const body = { question_id: String(questionId) }

  if (answerId != null) {
    if (Array.isArray(answerId)) {
      const ids = answerId.map((id) => String(id)).filter((id) => id !== '')
      if (ids.length === 1) body.answer_id = ids[0]
      else if (ids.length > 1) body.answer_id = ids
    } else if (String(answerId) !== '') {
      body.answer_id = String(answerId)
    }
  }

  const { data } = await apiFetch(`/api/quizplay/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  return data
}
