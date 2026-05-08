import { reactive } from 'vue'

const AUTH_TOKEN_KEY = 'studyflow_auth_token'
const AUTH_USER_KEY = 'studyflow_auth_user'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const store = reactive({
  user: null,
  token: null,
  decks: [
    {
      name: 'Anatomia człowieka',
      subject: 'Biologia',
      icon: '🧬',
      color: '#EEEDFE',
      fillColor: '#7F77DD',
      pct: 65,
      cards: [],
      quizzes: [
        {
          name: 'Podstawy biologii',
          questions: [
            { q: 'Ile chromosomów ma człowiek?', answers: ['23', '46', '48', '22'], correct: 1 },
            { q: 'Który organ wytwarza insulinę?', answers: ['Wątroba', 'Nerka', 'Trzustka', 'Śledziona'], correct: 2 },
          ]
        }
      ]
    },
    {
      name: 'Matematyka – całki',
      subject: 'Matematyka',
      icon: '∫',
      color: '#E1F5EE',
      fillColor: '#1D9E75',
      pct: 40,
      cards: [],
      quizzes: [
        {
          name: 'Quiz całek',
          questions: [
            { q: 'Całka z x to?', answers: ['x + C', 'x²/2 + C', '2x + C', 'ln x + C'], correct: 1 },
          ]
        }
      ]
    },
    {
      name: 'Prawo cywilne',
      subject: 'Prawo',
      icon: '⚖',
      color: '#FAEEDA',
      fillColor: '#BA7517',
      pct: 82,
      cards: [],
      quizzes: []
    }
  ],

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error('Nieprawidłowy e-mail lub hasło.')
    }

    const data = await response.json()
    if (!data?.token) {
      throw new Error('Brak tokenu JWT w odpowiedzi backendu.')
    }

    this.token = data.token
    this.user = data.user || { email }
    localStorage.setItem(AUTH_TOKEN_KEY, this.token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user))
  },

  async register(name, email, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    })

    if (!response.ok) {
      throw new Error('Nie udało się utworzyć konta.')
    }

    const data = await response.json()
    if (!data?.token) {
      throw new Error('Brak tokenu JWT w odpowiedzi backendu.')
    }

    this.token = data.token
    this.user = data.user || { name, email }
    localStorage.setItem(AUTH_TOKEN_KEY, this.token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user))
  },

  initAuth() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const userRaw = localStorage.getItem(AUTH_USER_KEY)
    if (!token) return

    this.token = token
    if (userRaw) {
      try {
        this.user = JSON.parse(userRaw)
      } catch {
        this.user = null
      }
    }
  },

  logout() {
    this.user = null
    this.token = null
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  },

  addDeck(deck) {
    this.decks.push({
      ...deck,
      cards: [],
      quizzes: deck.quizzes || []
    })
  }
})
