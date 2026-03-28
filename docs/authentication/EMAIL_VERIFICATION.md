# Email Verification

## Overview

Email verification tokens are generated on the **Django backend** and delivered by **EmailJS on the frontend**. The backend owns token creation and validation; the browser owns delivery.

---

## Endpoints

### `POST /api/auth/signup/`

Creates the user account and returns a verification token ready for EmailJS.

**Response (201 Created):**
```json
{
  "token": "<auth_token>",
  "user": { "id": 1, "email": "user@example.com", "is_email_verified": false, ... },
  "verification": {
    "uid": "MQ",
    "token": "abc123-xyz"
  }
}
```

The frontend constructs the link and calls EmailJS immediately after signup:
```
{window.location.origin}/auth/verify-email?uid={uid}&token={token}
```

---

### `POST /api/auth/resend-verification/`

**Auth:** Required (Token)

Returns a fresh uid + token. The frontend sends the email via EmailJS.

**Response (200 OK):**
```json
{
  "detail": "Verification data ready.",
  "uid": "MQ",
  "token": "new-abc123-xyz"
}
```

---

### `POST /api/auth/verify-email/`

Validates the token and marks the user verified. No email is sent here.

**Request:**
```json
{ "uid": "MQ", "token": "abc123-xyz" }
```

**Response (200 OK):**
```json
{ "detail": "Email verified successfully.", "user": { ..., "is_email_verified": true } }
```

---

## Flow

```
User signs up
  → POST /api/auth/signup/
  ← 201 { token, user, verification: { uid, token } }
  → Frontend calls emailjs.send('verification_email', { to_email, user_name, verify_link })
  → User receives email, clicks link
  → Frontend reads uid + token from URL
  → POST /api/auth/verify-email/ { uid, token }
  ← 200 { user: { is_email_verified: true } }
```

---

## EmailJS Setup

Templates live in the [EmailJS dashboard](https://dashboard.emailjs.com/).

**Template: `verification_email`**
- To Email: `{{to_email}}`
- Variables used in body: `{{user_name}}`, `{{verify_link}}`

**Template: `welcome_email`** (Google OAuth new users only)
- To Email: `{{to_email}}`
- Variables used in body: `{{user_name}}`

**Required frontend env vars:**
```
REACT_APP_EMAILJS_PUBLIC_KEY=
REACT_APP_EMAILJS_SERVICE_ID=
REACT_APP_EMAILJS_TEMPLATE_VERIFY=
REACT_APP_EMAILJS_TEMPLATE_WELCOME=
```

---

## Frontend Route

- Verification page: `/auth/verify-email`
- Reads `uid` and `token` from URL query params on mount

---

## Operational Notes

- Token generation uses Django's `default_token_generator` — tied to password hash + last login, auto-invalidates on password change.
- EmailJS failures are **non-fatal**: signup still succeeds; user can hit "Resend" to get a fresh link.
- Google OAuth users bypass email verification entirely (`is_email_verified=True` is set automatically). A welcome email is sent instead on first signup (uses `REACT_APP_EMAILJS_TEMPLATE_WELCOME`). Returning Google logins do not trigger any email.
- Rate limiting: 5 requests/hour per IP on `/api/auth/resend-verification/`.
