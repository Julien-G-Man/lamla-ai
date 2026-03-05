# Render Deployment Guide (Django + FastAPI)

This project deploys Django and FastAPI as separate Render services.

## Service Layout

- Service 1: Django API (`backend`)
- Service 2: FastAPI worker (`backend/fastapi_service`)
- Frontend runs separately (Vercel)

## Django Service

### Start command

```bash
python run_django.py --port 10000 --no-reload --workers 4
```

(Or Render-managed equivalent using `uvicorn lamla.asgi:application ...`.)

### Required environment

- `SECRET_KEY`
- `DEBUG=False`
- `DATABASE_URL`
- `FASTAPI_BASE_URL=<fastapi-render-url>`
- `FASTAPI_SECRET=<shared-secret>`
- `CORS_ALLOWED_ORIGINS=<frontend-origins>`
- `CSRF_TRUSTED_ORIGINS=<frontend-origins>`

## FastAPI Service

### Start command

```bash
python run.py
```

### Required environment

- `FASTAPI_SECRET=<same-as-django>`
- `FASTAPI_ALLOWED_ORIGINS=<frontend + django origins>`
- provider keys (`AZURE_*`, others as used)

## CORS and Internal Access Rules

- Keep `GET /health` public for wake/probe checks.
- All other FastAPI routes require `X-Internal-Secret`.
- Include both Django and frontend origins in `FASTAPI_ALLOWED_ORIGINS` to prevent cross-origin blocks when needed.

## Verify After Deploy

- Django `GET /health/` returns 200
- FastAPI `GET /health` returns 200
- Django can call FastAPI internal endpoints (quiz/flashcards/chat)
- Frontend login + quiz + flashcards + chat work end-to-end
