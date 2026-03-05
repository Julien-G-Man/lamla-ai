# Architecture

## Stack

- Frontend: React (`frontend/src`)
- API gateway + persistence: Django (`backend/apps/*`)
- Async AI worker: FastAPI (`backend/fastapi_service/*`)

## Core Pattern

1. React sends requests to Django (`/api/...`).
2. Django performs auth, validation, and database work.
3. For AI work, Django proxies to FastAPI with `X-Internal-Secret`.
4. FastAPI calls AI provider(s) and returns normalized output.
5. Django returns response to React.

## Why This Split

- Django owns business logic, auth token checks, and models.
- FastAPI stays stateless and focused on async AI provider calls.
- Internal shared-secret protection keeps worker endpoints private by default.

## Service Communication

- Django -> FastAPI base URL: `FASTAPI_BASE_URL`
- Internal auth header: `X-Internal-Secret`
- Shared value: `FASTAPI_SECRET` in both services

## Public vs Internal FastAPI Endpoints

- Public: `GET /health`
- Internal-only: `/chatbot/*`, `/quiz/*`, `/flashcards/*`
  - require valid `X-Internal-Secret`
  - browser-origin requests must be in `FASTAPI_ALLOWED_ORIGINS`

## Warmup Model

React wakes both services:

- Django: `GET {DJANGO_ROOT}/warmup/`
- FastAPI: `GET {FASTAPI_URL}/health`

Executed on page load and every 10 minutes (`App.jsx`).

## Main Django Route Mounts

From `backend/lamla/urls.py`:

- `/api/` + `apps.accounts.urls`
- `/api/` + `apps.chatbot.urls`
- `/api/` + `apps.quiz.urls`
- `/api/` + `apps.flashcards.urls`
- `/api/` + `apps.dashboard.urls`

Also:

- `/health/`
- `/warmup/`

## Data Ownership

- Quiz history: `apps.quiz.models.QuizSession`
- Flashcards: `apps.flashcards.models.Deck`, `Flashcard`
- Chat: `apps.chatbot.models.ChatSession`, `ChatMessage`
- Users/auth: `apps.accounts.models.User`
