# Flashcards Feature Setup

This page defines the intended flashcards page architecture and flow.

## Recommended Client Structure

`src/pages/Flashcards/`

- `FlashcardDecks.jsx`
- `FlashcardCreate.jsx`
- `FlashcardDeck.jsx`
- `FlashcardStudy.jsx`
- `Flashcards.css`

## Routes

- `/flashcards` -> deck list
- `/flashcards/create` -> create/generate flow
- `/flashcards/deck/:id` -> deck detail
- `/flashcards/study/:id` -> study session

## UX Rules

- Create page uses CreateQuiz-like upload/text experience.
- Drag-drop upload supported.
- File extraction happens immediately after upload.
- Upload and extracted text are part of one flow (tab transition).
- Deck list should expose due-card counts to support daily habit loops.
- Non-blocking errors: keep main UI usable and log details in dev tools.

## API Usage

- extract: `POST /api/flashcards/ajax-extract-text/`
- generate: `POST /api/flashcards/generate/`
- save: `POST /api/flashcards/save/`
- decks: `GET /api/flashcards/decks/`
- deck detail: `GET /api/flashcards/deck/:id/`
- review: `POST /api/flashcards/review/`
