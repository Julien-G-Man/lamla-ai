# Quick Reference

## Critical Environment Variables

Django (`backend/.env`):

- `SECRET_KEY`
- `DEBUG`
- `FASTAPI_BASE_URL`
- `FASTAPI_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `ADMIN_EMAIL`

FastAPI (`backend/fastapi_service/.env` or process env):

- `FASTAPI_SECRET`
- `FASTAPI_ALLOWED_ORIGINS`
- provider keys (`AZURE_*`, etc)

Frontend (`frontend/.env`):

- `REACT_APP_DJANGO_API_URL`
- `REACT_APP_FASTAPI_URL`

## High-Use APIs

Auth:

- `POST /api/auth/signup/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

Quiz:

- `POST /api/quiz/ajax-extract-text/`
- `POST /api/quiz/generate/`
- `POST /api/quiz/submit/`
- `GET /api/quiz/history/`

Flashcards:

- `POST /api/flashcards/ajax-extract-text/`
- `POST /api/flashcards/generate/`
- `POST /api/flashcards/save/`
- `GET /api/flashcards/decks/`
- `POST /api/flashcards/review/`

Chat:

- `POST /api/chat/`
- `POST /api/chat/stream/`
- `POST /api/chat/file/`

Dashboard:

- `GET /api/dashboard/stats/`
- `POST /api/dashboard/contact/`
- `POST /api/dashboard/newsletter/`

## Important Behavior

- FastAPI `/health` is public for wake/probe.
- Other FastAPI routes require `X-Internal-Secret`.
- React warmup pings run every 10 minutes.
