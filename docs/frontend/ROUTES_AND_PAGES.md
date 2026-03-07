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
- `/admin-dashboard/user/:id` -> AdminUserDetails
- `/admin-dashboard/activity` -> AdminActivity
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

## Materials

- `/materials` -> Materials
- `/materials/upload` -> MaterialUpload

## AI Tutor

- `/ai-tutor` -> Chatbot

Aliases:

- `/ai` -> redirect `/ai-tutor`
- `/chat` -> redirect `/ai-tutor`
- `/chatbot` -> redirect `/ai-tutor`

## Fallback

- `*` -> NotFound

## Global Warmup Behavior

`App.jsx` pings Django warmup and FastAPI health on mount and every 10 minutes.
