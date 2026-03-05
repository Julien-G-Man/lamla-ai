# Deployment Checklist

Use this before every production deploy.

## Environment

- Django and FastAPI have matching `FASTAPI_SECRET`.
- Django `FASTAPI_BASE_URL` points to live FastAPI service.
- Frontend `REACT_APP_DJANGO_API_URL` and `REACT_APP_FASTAPI_URL` are valid absolute URLs.
- All URLs include `http://` or `https://`.

## Allowed Origins

- Django `CORS_ALLOWED_ORIGINS` includes production frontend URL(s).
- Django `CSRF_TRUSTED_ORIGINS` includes same trusted web origins.
- FastAPI `FASTAPI_ALLOWED_ORIGINS` includes:
  - frontend origin(s)
  - Django origin(s) (`localhost:8000` and deployed Django host)

## Health and Wake

- `GET /health/` works on Django service.
- `GET /health` works on FastAPI service.
- Frontend warmup runs at load and every 10 minutes.

## Smoke Tests

- Login/signup flow succeeds.
- Quiz generation works.
- Flashcard extraction + generation + save + study review works.
- Chat message and file chat work.
- Dashboard stats and home contact/newsletter endpoints work.

## Error Handling

- 5xx responses do not break frontend state.
- Flashcards show fallback cards when provider is down.
