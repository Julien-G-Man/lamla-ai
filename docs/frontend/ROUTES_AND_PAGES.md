# Frontend Routes and Pages

Source of truth: `frontend/src/App.jsx`.

## Public

- `/` -> Home
- `/about` -> About
- `/auth/login` -> Login
- `/auth/signup` -> Signup
- `/auth/verify-email` -> VerifyEmail
- `/auth/forgot-password` -> ForgotPassword  *(to build — see `authentication/PASSWORD_RESET.md`)*
- `/auth/reset-password` -> ResetPassword  *(to build — see `authentication/PASSWORD_RESET.md`)*

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

- `/quiz` -> QuizHistory *(authenticated only — redirects to `/auth/login` if not signed in)*
- `/quiz/create` -> CreateQuiz *(public; guests limited to one quiz via `lamla_guest_quiz_used` localStorage flag; accepts `?subject=` query param to pre-fill subject — used by Dashboard weak areas "Practice" button)*
- `/quiz/play` -> Quiz
- `/quiz/results` -> QuizResults

## Flashcards

- `/flashcards` -> FlashcardDecks
- `/flashcards/create` -> FlashcardCreate
- `/flashcards/deck/:id` -> FlashcardDeck
- `/flashcards/study/:id` -> FlashcardStudy
- `/flashcard` -> redirect `/flashcards`

## Donations

- `/donate` -> Donate (full-height split layout — image left, form right; open to all)
- `/donate/thank-you` -> DonateThankyou (verifies payment on load via `?reference=` query param)

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
