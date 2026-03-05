# Flashcards Feature

## Frontend Pages

- `/flashcards` -> `FlashcardDecks.jsx`
- `/flashcards/create` -> `FlashcardCreate.jsx`
- `/flashcards/deck/:id` -> `FlashcardDeck.jsx`
- `/flashcards/study/:id` -> `FlashcardStudy.jsx`

Styles live in `src/pages/Flashcards/Flashcards.css`.

## Django Endpoints

From `backend/apps/flashcards/urls.py`:

- `POST /api/flashcards/ajax-extract-text/`
- `POST /api/flashcards/generate/`
- `GET /api/flashcards/decks/`
- `GET /api/flashcards/decks/:id/`
- `GET /api/flashcards/deck/:id/` (alias)
- `POST /api/flashcards/decks/save/`
- `POST /api/flashcards/save/` (alias)
- `POST /api/flashcards/review/`
- `POST /api/flashcards/explain/`

## FastAPI Endpoints (Internal)

- `POST /flashcards/generate`
- `POST /flashcards/explain`

## Models

- `Deck` (owner, title, subject, created_at)
- `Flashcard` (question, answer + SM-2 fields: repetition, interval, ease_factor, next_review)

## Fallback Behavior

If AI providers fail or return invalid shape:

- FastAPI returns deterministic fallback cards and `fallback_used: true`.
- Frontend also has client-side fallback card generation on request failure.

This ensures user flow does not hard-fail.

## Review Mapping (Study Mode)

- Again -> quality 0
- Hard -> quality 3
- Good -> quality 4
- Easy -> quality 5

Posted to `/api/flashcards/review/`.
