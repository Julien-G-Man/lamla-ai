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
- `STORAGE_BACKEND` (`local` or `cloudinary`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (if Cloudinary is enabled)

FastAPI (`backend/fastapi_service/.env` or process env):

- `FASTAPI_SECRET`
- `FASTAPI_ALLOWED_ORIGINS`
- provider keys (`AZURE_*`, `DEEPSEEK_*`, etc)

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
- `GET /api/chat/history/`
- `POST /api/chat/history/clear/`

Materials:

- `GET /api/materials/`
- `GET /api/materials/mine/`
- `POST /api/materials/upload/`
- `POST /api/materials/:id/download/`
- `POST /api/materials/:id/extract/`
- `DELETE /api/materials/:id/delete/`

Dashboard/Admin:

- `GET /api/dashboard/stats/`
- `POST /api/dashboard/contact/`
- `POST /api/dashboard/newsletter/`
- `GET /api/dashboard/admin/stats/`
- `GET /api/dashboard/admin/usage-trends/`
- `GET /api/dashboard/admin/activity/`
- `GET /api/dashboard/admin/users/`
- `DELETE /api/dashboard/admin/users/:id/`
- `GET /api/dashboard/admin/settings/`
- `PUT /api/dashboard/admin/settings/`

## Important Behavior

- FastAPI `/health` is public for probes.
- Non-health FastAPI routes require `X-Internal-Secret` from Django.
- React warmup pings run on load and every 10 minutes.
- Materials extraction/download can use Cloudinary signed URL fallback when raw asset URLs are restricted.
