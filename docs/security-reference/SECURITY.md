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

### Authentication Backend

- **Dual-mode login:** Custom `EmailOrUsernameBackend` accepts either email or username.
- **DRF token auth:** All requests use `Authorization: Token <token>` (not session-based).
- **Token rotation:** Tokens are invalidated and regenerated on **every login**:
  - Old tokens for the user are immediately deleted.
  - New token is issued on successful login.
  - This prevents token reuse attacks if credentials are compromised.

### Token Security

- **Stateless tokens:** Tokens don't expire automatically; invalidation is the primary control.
- **Logout:** Explicitly invalidates the user's current token.
- **Password change:** Does NOT invalidate tokens (user remains logged in; optional to logout first).
- **Sensitive operations:** Contact/newsletter endpoints are public; no token required.

### Rate Limiting (Brute Force Protection)

The following endpoints are rate-limited to **5 requests per hour per IP address**:

- `POST /api/auth/signup/`
- `POST /api/auth/login/`
- `POST /api/auth/verify-email/`
- `POST /api/auth/resend-verification/`

**Configuration:**
```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'auth': '5/hour',
    }
}
```

**Response on limit exceeded:** HTTP 429 Too Many Requests with `Retry-After` header.

### Admin Authorization

The `IsAdminUser` permission class enforces admin-only endpoints:

```python
class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'is_admin', False)
        )
```

**Admin endpoints:**
- Dashboard stats, usage trends, activity feed
- User management (list, detail, delete)
- System settings (get, update)

**Non-admin users:** Receive HTTP 403 Forbidden.

## Input Validation & Sanitization

### Request Validation (DRF Serializers)

All user input is validated via Django REST Framework serializers with strict bounds:

**Accounts:**
- `email`: required, valid format, unique, max 254 characters
- `username`: required, 1–50 characters, alphanumeric with underscores/hyphens, unique
- `password`: required, min 8 characters, must include uppercase, lowercase, digit, special character
- `first_name`, `last_name`: optional, max 100 characters each

**Dashboard:**
- Contact form `title`: 5–180 characters
- Contact form `name`: 2–120 characters
- Contact form `message`: 10–5,000 characters
- Newsletter `email`: valid format, max 254 characters

**Flashcards:**
- `subject`: required, 1–255 characters
- `text`: required, 30–50,000 characters
- `question`: required, 1–2,000 characters
- `answer`: required, 1–4,000 characters
- `num_cards`: integer, 1–25

### XSS Prevention

Contact form and newsletter serializers reject inputs containing:
- `<` or `>` (HTML tags)
- `script` (common XSS vector)

**Error response (400):**
```json
{
  "message": ["Input contains disallowed HTML content."]
}
```

### File Upload Validation

Profile image uploads are validated for:
- **MIME type:** JPEG, PNG, WebP, GIF only (user-provided content-type checked)
- **File size:** Max 5 MB
- **Planned:** Real content validation via `python-magic` library (checks actual file content, not just headers)

### SQL Injection Protection

- **Django ORM:** All database queries use parameterized ORM methods (no raw SQL with user input).
- **Aggregation queries:** Use Django's `Count`, `Avg`, `Sum`, `Coalesce`, etc. (all parameterized).

---

## Error Handling & Information Disclosure

### Generic Error Messages

API responses avoid verbose error details that could expose:
- Internal paths or file structures
- Stack traces or exception details
- Database schema information
- Valid vs. invalid usernames/emails (helps prevent enumeration)

**Example error responses:**
```json
{"detail": "Invalid credentials."}
{"detail": "User not found."}
{"error": "Invalid request data"}
```

### Logging

- Errors are logged server-side with full context (exception traces, user IDs, timestamps).
- Logs are **never** exposed to API clients.
- Sensitive data (passwords, tokens) is **never** logged (print statements removed).

**Audit logging:**
- Admin delete operations are logged: `logger.warning("Admin %s deleted user %s", admin_email, user_email)`

---

## Password Security

### Complexity Requirements

All passwords must meet these requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

**Validation:**
```python
def validate_password_complexity(password):
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain an uppercase letter.")
    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain a lowercase letter.")
    if not re.search(r'\d', password):
        raise ValidationError("Password must contain a digit.")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain a special character.")
```

### Password Storage

- Passwords are hashed using Django's default hasher (PBKDF2 with SHA256).
- Passwords are **never** stored in plaintext.
- Old passwords are not stored after password change.

---

## Audit Trail & Monitoring

### Admin Actions

Admin delete operations are audited in server logs:
```python
logger.warning("AUDIT: Admin %s deleted user %s (%s) at %s", 
               request.user.email, target.id, target.email, timezone.now())
```

These logs can be monitored for:
- Unusual bulk deletions
- Off-hours admin activity
- Admin account misuse

### Planned Enhancements

- Persistent `AuditLog` model for admin actions (create, update, delete)
- Dashboard view for audit log inspection
- Automated alerts for unusual patterns

---

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
