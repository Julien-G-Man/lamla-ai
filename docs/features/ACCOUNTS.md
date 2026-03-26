# Accounts & Authentication

## Overview

The Accounts system provides user registration, authentication, email verification, profile management, and password management. It supports flexible login via email or username and implements security hardening including rate limiting, token rotation, and input validation.

## Authentication Methods

### Dual-Mode Login (Email or Username)

Users can authenticate using either their email address or username via the custom `EmailOrUsernameBackend`:

- If the identifier contains `@`, it's treated as an email lookup.
- Otherwise, it's treated as a username lookup (case-insensitive).
- Password is validated via Django's user model.

This is registered in `settings.py`:

```python
AUTHENTICATION_BACKENDS = [
    'apps.accounts.backend.EmailOrUsernameBackend',
    'django.contrib.auth.backends.ModelBackend',
]
```

### Token Authentication

All authenticated requests use DRF token authentication:

```
Authorization: Token <user_token>
```

When a user logs in:
1. Any existing tokens for that user are invalidated (deleted).
2. A new token is created and returned.

This ensures only the most recent login session is active, preventing token reuse attacks.

## Endpoints

### Registration & Login

#### `POST /api/auth/signup/`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `email`: required, unique, valid format
- `username`: required, 1–50 characters, unique, alphanumeric with underscores/hyphens
- `password`: required, minimum 8 characters, must include uppercase, lowercase, digit, and special character

**Response (201 Created):**
```json
{
  "token": "abc123defg456...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "is_email_verified": false
  },
  "verification": {
    "uid": "MQ",
    "token": "abc123-xyz"
  }
}
```

The frontend uses `verification.uid` and `verification.token` to send the verification email via EmailJS.

**Security:**
- Rate-limited to 5 requests per hour per IP address.
- Password complexity is enforced.
- Verification email is sent by EmailJS on the frontend (non-fatal if delivery fails).

---

#### `POST /api/auth/login/`

Authenticate a user and return a token.

**Request:**
```json
{
  "identifier": "user@example.com",
  "password": "SecurePass123!"
}
```

Or with username:
```json
{
  "identifier": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "abc123defg456...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "is_email_verified": true
  }
}
```

**Security:**
- Rate-limited to 5 requests per hour per IP address.
- Old tokens are invalidated on each login (token rotation).

---

### Email Verification

#### `POST /api/auth/verify-email/`

Verify user email with a token sent in verification email.

**Request:**
```json
{
  "token": "email_verification_token_from_email"
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully."
}
```

**Security:**
- Rate-limited to 5 requests per hour per IP address.

---

#### `POST /api/auth/resend-verification/`

Resend the verification email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Verification email sent."
}
```

**Security:**
- Rate-limited to 5 requests per hour per IP address.

---

### Profile Management

#### `GET /api/auth/me/`

Retrieve the authenticated user's profile.

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "profile_image": "https://cdn.example.com/images/user_1.jpg",
  "is_email_verified": true,
  "created_at": "2025-01-15T10:20:30Z"
}
```

**Security:**
- Requires authentication (valid token).

---

#### `PUT /api/auth/profile/`

Update user profile information.

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "username": "john_doe_updated"
}
```

**Validation Rules:**
- `username`: optional, 1–50 characters, unique, alphanumeric with underscores/hyphens
- `first_name`, `last_name`: optional, max 100 characters each

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully.",
  "user": {
    "id": 1,
    "username": "john_doe_updated",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Security:**
- Requires authentication.
- Email uniqueness is validated to prevent collisions.

---

#### `POST /api/auth/change-password/`

Change user password.

**Request:**
```json
{
  "old_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

**Validation Rules:**
- `old_password`: required, must match current password
- `new_password`: required, minimum 8 characters, must include uppercase, lowercase, digit, and special character

**Response (200 OK):**
```json
{
  "message": "Password changed successfully."
}
```

**Security:**
- Requires authentication.
- Old password is verified before change.
- Session tokens remain valid (user stays logged in).

---

#### `POST /api/auth/upload-profile-image/`

Upload a profile image (multipart/form-data).

**Request:**
```
POST /api/auth/upload-profile-image/
Content-Type: multipart/form-data

profile_image: <binary image file>
```

**Supported Formats:**
- JPEG, PNG, WebP, GIF
- Maximum file size: 5 MB
- Only user-provided MIME type is currently validated (planned: real content validation via python-magic)

**Response (200 OK):**
```json
{
  "message": "Profile image uploaded successfully.",
  "profile_image_url": "https://cdn.example.com/images/user_1.jpg"
}
```

**Security:**
- Requires authentication.
- File size is limited to 5 MB.
- MIME type is validated (JPEG, PNG, WebP, GIF only).

---

### Session Management

#### `POST /api/auth/logout/`

Invalidate the user's current token.

**Request:**
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully."
}
```

**Security:**
- Requires authentication.
- Token is invalidated immediately.
- No further API calls with this token will be accepted.

---

#### `GET /api/auth/debug-users/` (Admin Only)

Retrieve all users with email verification status and admin flags (for debugging).

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "username": "john_doe",
      "is_email_verified": true,
      "is_admin": false
    }
  ]
}
```

**Security:**
- **Admin-only endpoint** (requires `IsAuthenticated` + `is_admin=true`).
- Returns HTTP 403 Forbidden if user is not an admin.
- Useful for development and support workflows.

---

## Rate Limiting

The following endpoints are protected by aggressive rate limiting:

- `POST /api/auth/signup/`
- `POST /api/auth/login/`
- `POST /api/auth/verify-email/`
- `POST /api/auth/resend-verification/`

**Limit:** 5 requests per hour per IP address.

**Behavior:**
- 6th request within the hour returns HTTP 429 Too Many Requests.
- Includes `Retry-After` header indicating seconds until next request is allowed.

**Configuration:**
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'auth': '5/hour',
    }
}
```

---

## Email Delivery

### Auth Emails (Verification & Password Reset)

Auth emails are sent by **EmailJS on the frontend** — the backend generates the token and returns it in the API response; the browser calls EmailJS directly.

**Required frontend env vars:**
```bash
REACT_APP_EMAILJS_PUBLIC_KEY=
REACT_APP_EMAILJS_SERVICE_ID=
REACT_APP_EMAILJS_TEMPLATE_VERIFY=
REACT_APP_EMAILJS_TEMPLATE_RESET=
```

Templates are managed in the [EmailJS dashboard](https://dashboard.emailjs.com/).

### Dashboard Emails (Contact Form, Newsletter)

Dashboard emails (contact form, newsletter) use a backend delivery chain via Brevo → Resend → SMTP. Configuration is environment-based.

```bash
EMAIL_BACKEND_PRIORITY=brevo,resend,smtp   # order of preference

# Brevo (300 emails/day free, no custom domain required)
BREVO_API_KEY=...

# Resend (requires verified custom domain)
RESEND_API_KEY=...

# SMTP (blocked on Render free tier — use for local dev or paid hosting)
AUTH_EMAIL_HOST_USER=...
AUTH_EMAIL_HOST_PASSWORD=...
```

### Verification Email Flow

1. User signs up → backend returns `{ verification: { uid, token } }`
2. Frontend constructs: `{origin}/auth/verify-email?uid={uid}&token={token}`
3. Frontend calls EmailJS → user receives email
4. User clicks link → frontend POSTs `{ uid, token }` to `/api/auth/verify-email/`

---

## User Model

The custom user model (`User`) extends Django's `AbstractUser`:

```python
class User(AbstractUser):
    email = EmailField(unique=True)
    is_email_verified = BooleanField(default=False)
    is_admin = BooleanField(default=False)
    profile_image = CharField(max_length=500, null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Key Fields:**
- `email`: Unique email address (required for login via email).
- `username`: Unique username (required; used for username login and profile display).
- `is_email_verified`: Whether the user has verified their email address.
- `is_admin`: Whether the user has admin privileges (admin dashboard access).
- `profile_image`: URL to the user's profile picture.

---

## Serializers

### SignupSerializer
- Validates `email`, `username`, `password`.
- Enforces password complexity (uppercase, lowercase, digit, special char).
- Ensures unique email and username.

### LoginSerializer
- Validates `identifier` (email or username) and `password`.
- Performs authentication via `EmailOrUsernameBackend`.

### UpdateProfileSerializer
- Validates `username`, `first_name`, `last_name`.
- Checks uniqueness of `username` if provided.

### ChangePasswordSerializer
- Validates `old_password` (must match user's current password).
- Validates `new_password` (must meet complexity requirements).

---

## Security Hardening Summary

| Vulnerability | Mitigation |
|---|---|
| Brute Force Attacks | Rate limiting (5/hour on auth endpoints) |
| Token Reuse | Token invalidation on each login |
| Weak Passwords | Password complexity enforcement (8+ chars, uppercase, lowercase, digit, special) |
| Credential Stuffing | Rate limiting + email verification |
| Email Enumeration | Signup/verification endpoints rate-limited |
| Verbose Errors | Generic error messages in responses |
| Input Injection | DRF serializer validation + length bounds |

---

## Related Documentation

- [Email Verification Flow](../authentication/EMAIL_VERIFICATION.md)
- [Custom User Model](../authentication/CUSTOM_USER_MODEL.md)
- [Security Reference](../security-reference/SECURITY.md)
- [Dashboard Admin Features](./DASHBOARD.md)
