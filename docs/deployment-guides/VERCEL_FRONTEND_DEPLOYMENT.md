# Vercel Frontend Deployment

## Build

From `frontend/`:

```bash
npm install
npm run build
```

## Required Environment Variables

- `REACT_APP_DJANGO_API_URL=https://<django-host>/api`
- `REACT_APP_FASTAPI_URL=https://<fastapi-host>`

Use full URLs including protocol.

## Runtime Expectations

- App pings Django `/warmup/` and FastAPI `/health` on load and every 10 minutes.
- Only `/health` on FastAPI should be publicly callable from browser for wakeup checks.

## Common Failures

### Missing protocol

Error: URL missing `http://` or `https://`

Fix: update env vars with absolute URLs.

### CORS failures

Fix:

- Add frontend URL to Django `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`
- Add frontend + Django URLs to FastAPI `FASTAPI_ALLOWED_ORIGINS`

### Build failure for missing CSS import

Ensure filename casing matches import exactly (for Linux CI).
