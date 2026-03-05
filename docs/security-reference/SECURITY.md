# Security Reference

## Non-Negotiables

- Never commit secrets (`.env`, API keys, credentials).
- Keep Django and FastAPI `FASTAPI_SECRET` synchronized and private.
- Keep CORS and CSRF allowlists explicit in production.

## CORS / CSRF

Django:

- `CORS_ALLOWED_ORIGINS` for frontend origins.
- `CSRF_TRUSTED_ORIGINS` aligned with same trusted origins.

FastAPI:

- `FASTAPI_ALLOWED_ORIGINS` for browser-origin validation.
- `/health` remains public.
- Other endpoints require `X-Internal-Secret`.

## Auth

- DRF token auth (`Authorization: Token <token>`)
- Rotate/revoke tokens on sensitive operations (logout/password changes)

## Production Baselines

- HTTPS only.
- `SECURE_SSL_REDIRECT=True`
- secure cookies enabled (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`)
- HSTS enabled.

## Incident Handling

If a secret leaks:

1. Rotate it immediately.
2. Redeploy all affected services.
3. Audit recent logs and access patterns.
4. Remove leaked value from history where possible.
