# Student Agent

Prototyp aplikacji do nauki fiszek i quizów dla studentów.

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz http://localhost:5173

## Budowanie produkcyjne

```bash
npm run build
```

## Struktura projektu

```
src/
  App.vue              # Główny komponent, routing między widokami
  store.js             # Reaktywny stan aplikacji (Vue reactive)
  style.css            # Globalne style i zmienne CSS
  main.js              # Punkt wejścia
  components/
    LoginView.vue      # Logowanie i rejestracja
    HomeView.vue       # Główna – lista zestawów i statystyki
    FlashcardsView.vue # Przeglądanie fiszek z animacją obrotu
    QuizView.vue       # Quiz wielokrotnego wyboru
    AddDeckView.vue    # Tworzenie nowego zestawu fiszek
    ProfileView.vue    # Profil użytkownika i ustawienia
```

## Kolejne kroki

- Podłączyć prawdziwy backend (np. Supabase, Firebase)
- Dodać Vue Router zamiast ręcznego routingu
- Dodać Pinia zamiast prostego reactive store
- Dodać algorytm powtórek (spaced repetition SM-2)
- Dodać widok harmonogramu nauki
