# Lamla Email System

## Overview
Users can **log in immediately after registration**, but certain features are restricted until email is verified. A dashboard prompt guides users to complete verification.

## Email Provider
**Resend** — chosen for its simple, developer-friendly API and reliable transactional delivery.

## Registration Flow
1. User registers → account created with `is_email_verified = False`
2. Verification email sent
3. User logs in; dashboard shows verification prompt
4. User clicks link → token validated → `is_email_verified = True`
5. Full platform access granted

## Backends

| Environment | Backend |
|---|---|
| Development | SMTP / Console |
| Production | Resend |

## Configuration

**Production:**
```
EMAIL_BACKEND_TYPE=resend
RESEND_API_KEY=your_resend_api_key
DEFAULT_FROM_EMAIL=Lamla <noreply@lamla.ai>
```

**Development:**
```
EMAIL_BACKEND_TYPE=smtp
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Sending Email (Production)
```python
import resend
resend.api_key = settings.RESEND_API_KEY
resend.Emails.send({
    "from": settings.DEFAULT_FROM_EMAIL,
    "to": [to_email],
    "subject": subject,
    "html": html_body,
    "text": text_body,
})
```

## Feature Access

| Status | Access |
|---|---|
| Unverified | Register, log in, dashboard |
| Verified | AI tools, quiz generation, flashcards, API access |

## Future: Background Queue
Replace synchronous sending with **Celery + Redis** for faster responses, retries, and better scalability.