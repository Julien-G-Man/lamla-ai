# Frontend Integration

## API Clients

- `frontend/src/services/api.js` -> general Django API client
- `frontend/src/services/auth.js` -> auth-specific client

Both attach `Authorization: Token <token>` when token exists in localStorage.

## Required Frontend Environment Variables

- `REACT_APP_DJANGO_API_URL` (example: `http://localhost:8000/api`)
- `REACT_APP_FASTAPI_URL` (example: `http://localhost:8001`)

If missing, app boot fails by design.

## Warmup Endpoints

Derived in `services/api.js`:

- `DJANGO_WARMUP_ENDPOINT = {DJANGO_ROOT}/warmup/`
- `FASTAPI_HEALTH_ENDPOINT = {FASTAPI_URL}/health`

## Contract: Auth

- Login: `POST /auth/login/`
- Signup: `POST /auth/signup/`
- Me: `GET /auth/me/`
- Logout: `POST /auth/logout/`
- Verify email: `POST /auth/verify-email/`

## Contract: Quiz

- Extract text: `POST /quiz/ajax-extract-text/`
- Generate: `POST /quiz/generate/`
- Submit: `POST /quiz/submit/`
- Download: `POST /quiz/download/`
- History: `GET /quiz/history/`

## Contract: Flashcards

- Extract text: `POST /flashcards/ajax-extract-text/`
- Generate: `POST /flashcards/generate/`
- Save deck: `POST /flashcards/save/` (alias of `/flashcards/decks/save/`)
- List decks: `GET /flashcards/decks/`
- Deck cards: `GET /flashcards/deck/:id/` or `/flashcards/decks/:id/`
- Review: `POST /flashcards/review/`
- Explain: `POST /flashcards/explain/`

## Contract: Chatbot

- Message: `POST /chat/`
- File message: `POST /chat/file/`
- Stream: `POST /chat/stream/`
- History: `GET /chat/history/`
- Clear history: `DELETE /chat/history/clear/`

## Error Handling Expectations

- 4xx: frontend should show non-breaking state and keep page usable.
- 5xx from AI-backed paths should degrade gracefully where fallback exists.
- Flashcards generation already falls back to deterministic cards in both FastAPI and React.
