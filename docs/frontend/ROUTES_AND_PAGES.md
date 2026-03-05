# Frontend Routes and Pages

Source of truth: `frontend/src/App.jsx`.

## Public

- `/` -> Home
- `/about` -> About
- `/auth/login` -> Login
- `/auth/signup` -> Signup
- `/auth/verify-email` -> VerifyEmail

Legacy redirects:

- `/auth` -> `/auth/login`
- `/login` -> `/auth/login`
- `/signup` -> `/auth/signup`
- `/verify-email` -> `/auth/verify-email`

## App Pages

- `/dashboard` -> Dashboard
- `/admin-dashboard` -> AdminDashboard
- `/profile` -> Profile

## Quiz

- `/quiz/create` -> CreateQuiz
- `/quiz/play` -> Quiz
- `/quiz/results` -> QuizResults
- `/quiz` -> redirect `/quiz/create`

## Flashcards

- `/flashcards` -> FlashcardDecks
- `/flashcards/create` -> FlashcardCreate
- `/flashcards/deck/:id` -> FlashcardDeck
- `/flashcards/study/:id` -> FlashcardStudy
- `/flashcard` -> redirect `/flashcards`

## AI Tutor

- `/ai-tutor` -> Chatbot
- `/chatbot` -> redirect `/ai-tutor`

## Fallback

- `*` -> NotFound

## Global Warmup Behavior

`App.jsx` pings Django warmup and FastAPI health on mount and every 10 minutes.
