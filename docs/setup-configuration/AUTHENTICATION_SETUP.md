# Authentication Setup Guide

## Overview

Lamla AI uses a **custom User model** with **email-based authentication** and **optional email verification**. Users can log in immediately after registration, but certain features are restricted until email is verified. A dashboard prompt guides users to complete verification.

## User Model Architecture

### Custom User Model
The `accounts.User` model replaces Django's default `auth.User`:

| Field | Type | Notes |
|-------|------|-------|
| `email` | `EmailField` | Unique, `USERNAME_FIELD` — used to log in |
| `username` | `CharField(50)` | Unique display name |
| `is_admin` | `BooleanField` | Set server-side from `ADMIN_EMAIL` env var |
| `is_active` | `BooleanField` | Default `True` |
| `is_staff` | `BooleanField` | Django admin access |
| `is_email_verified` | `BooleanField` | Email verification status |
| `email_verified_at` | `DateTimeField` | When email was verified |
| `profile_image` | `URLField` | Nullable, stores image URL |
| `date_joined` | `DateTimeField` | Auto-set on creation |
| `last_login` | `DateTimeField` | Updated on each successful login |

### Admin Detection (Backend Env Var)
Admin status is determined entirely on the Django backend by comparing the registering email against `ADMIN_EMAIL` from the server's `.env`:

```python
admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
if admin_email and email.lower() == admin_email:
    extra_fields["is_admin"] = True
    extra_fields["is_staff"] = True
    extra_fields["is_superuser"] = True
```

**Why backend?** React env vars (`REACT_APP_*`) are embedded in the JS bundle at build time — anyone can read them by inspecting page source. The frontend already consumes `is_admin` from the API response, so no frontend logic change is needed. Changing the admin requires only a `.env` update and redeploy — no code changes.

---

## Email System Setup

### Email Provider Configuration
Lamla supports both **Resend** (production) and **SMTP/Console** (development):

| Environment | Backend |
|---|---|
| Development | Django Console Backend |
| Production | Resend API |

### Production Configuration (.env)
```
EMAIL_BACKEND_TYPE=resend
RESEND_API_KEY=your_resend_api_key
DEFAULT_FROM_EMAIL=Lamla <noreply@lamla.ai>
```

### Development Configuration (.env)
```
EMAIL_BACKEND_TYPE=smtp
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=Lamla <noreply@lamla.ai>
```

### Django Settings Setup
```python
# Email backend — swap for SMTP in production
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"  # dev
# EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"    # prod

DEFAULT_FROM_EMAIL = "Lamla AI <noreply@lamla.ai>"
SITE_NAME = "Lamla AI"

# React app URL — used to build the verification link
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Token expiry (default: 3 days)
PASSWORD_RESET_TIMEOUT = 259200  # in seconds
```

### Template Setup
Make sure Django can find the email templates. In `settings.py`:
```python
TEMPLATES = [
    {
        ...
        "DIRS": [BASE_DIR / "templates"],
        ...
    }
]
```

Place templates at:
```
templates/
  accounts/
    emails/
      verification_email.txt
      verification_email.html
```

### Sending Email with Resend (Production)
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

### Future: Background Queue
Replace synchronous sending with **Celery + Redis** for faster responses, automatic retries, and better scalability.

---

## Email Verification Flow

### Registration Flow
1. User registers → account created with `is_email_verified = False`
2. Verification email sent immediately
3. User logs in; dashboard shows verification prompt
4. User clicks verification link → token validated → `is_email_verified = True`
5. Full platform access granted

### Feature Access
| Status | Access |
|---|---|
| Unverified | Register, log in, dashboard, profile |
| Verified | AI tools, quiz generation, flashcards, API access |

### Token Expiry
`default_token_generator` tokens expire after `PASSWORD_RESET_TIMEOUT` seconds (default: 259200 = 3 days).

To change:
```python
PASSWORD_RESET_TIMEOUT = 86400  # 24 hours
```

### Frontend Integration

#### VerifyEmail Page
- `src/pages/VerifyEmail/VerifyEmail.jsx` (new)
- `src/pages/VerifyEmail/VerifyEmail.css` (new)
- Route: `/verify-email`

#### AuthContext Updates
Add to context:
- `markEmailVerified()` — Mark email as verified
- `resendVerificationEmail()` — Resend verification email

#### Auth Service Updates
Add to `src/services/auth.js`:
- `verifyEmail(token)` — Verify email with token
- `resendVerificationEmail()` — Request new verification email

#### Signup Updates
`src/pages/Signup/Signup.jsx`:
- Updated to show email field
- Handles email verification after signup

#### Verification Banner
Add to Dashboard layout:
```jsx
const { isAuthenticated, isEmailVerified, resendVerificationEmail } = useAuth();
const [sent, setSent] = useState(false);

{isAuthenticated && !isEmailVerified && (
  <div className="verify-banner">
    Please verify your email address.{' '}
    {sent
      ? 'Email sent — check your inbox.'
      : <button onClick={() => resendVerificationEmail().then(() => setSent(true))}>
          Resend email
        </button>
    }
  </div>
)}
```

---

## Database Setup

### Initial Migration
```bash
python manage.py makemigrations accounts
python manage.py migrate
```

Three new fields land on the User table:
- `is_email_verified`
- `email_verified_at`
- `last_login_ip`

### Reset Database (Development)
If you encounter migration conflicts:
```bash
# PostgreSQL
DROP DATABASE lamla_db;
CREATE DATABASE lamla_db;

python manage.py migrate
```

Or attempt fake-initial:
```bash
python manage.py migrate --fake-initial
python manage.py makemigrations accounts
python manage.py migrate
```

---

## Required Settings.py Configuration

```python
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "UNAUTHENTICATED_USER": None,
}

# INSTALLED_APPS additions:
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework.authtoken',
    'accounts',
    # ...
]
```

---

## API Authentication Endpoints

All endpoints use **Token Authentication**:

| View | Method | URL | Auth | Purpose |
|------|--------|-----|------|---------|
| `SignupView` | POST | `/api/auth/signup/` | Public | Register new user |
| `LoginView` | POST | `/api/auth/login/` | Public | Login and get token |
| `LogoutView` | POST | `/api/auth/logout/` | Required | Logout and revoke token |
| `MeView` | GET | `/api/auth/me/` | Required | Get current user info |
| `UpdateProfileView` | POST | `/api/auth/update-profile/` | Required | Update username/email |
| `ChangePasswordView` | POST | `/api/auth/change-password/` | Required | Change password (rotates token) |
| `UploadProfileImageView` | POST | `/api/auth/upload-profile-image/` | Required | Upload profile image |

### Token Authentication
- Uses DRF's built-in `TokenAuthentication` (stored in `rest_framework.authtoken`)
- Frontend attaches `Authorization: Bearer <token>` to every request
- Token is **rotated** on password change to invalidate other sessions
- Token is **deleted** server-side on logout (not just cleared from localStorage)

### Profile Image Upload
- Validates file type: JPEG, PNG, WebP, GIF (max 5 MB)
- Pluggable storage backend: set `STORAGE_BACKEND=cloudinary` in `.env` for Cloudinary
- Falls back to local placeholder in dev mode

---

## Error Handling

All serializers return errors in shapes the frontend `auth.js` handles:
- Field-level error arrays
- `non_field_errors`
- `detail`

Example error response:
```json
{
    "email": ["User with this email already exists."],
    "non_field_errors": ["Invalid credentials."]
}
```

---

## Required Environment Variables

```bash
# Email Configuration
EMAIL_BACKEND_TYPE=resend          # or 'smtp'
RESEND_API_KEY=your_key            # if using Resend
DEFAULT_FROM_EMAIL=Lamla <noreply@lamla.ai>
FRONTEND_URL=http://localhost:3000

# Admin Detection
ADMIN_EMAIL=admin@yourdomain.com

# Storage Backend (optional)
STORAGE_BACKEND=cloudinary         # omit for local dev
```

---

## Security Best Practices

1. **Password hashing** — Uses Django's default PBKDF2, can be upgraded
2. **Token rotation** — Tokens are rotated on password change
3. **Email verification** — Optional but recommended for production
4. **Admin detection** — Server-side only, never exposed to frontend
5. **HTTPS in production** — Required for token security
6. **HTTP-only cookies** — Recommended for token storage (can be implemented)

---

## Troubleshooting

### Email not sending
- Check `RESEND_API_KEY` is set in `.env`
- Verify email templates exist at `templates/accounts/emails/`
- Check Django logs for email backend errors
- In dev mode, emails appear in console output

### Token authentication failing
- Verify `Authorization: Bearer <token>` header format
- Check token hasn't expired (no built-in expiry, but can be added)
- Ensure `rest_framework.authtoken` is in `INSTALLED_APPS`

### Admin user not recognized
- Check `ADMIN_EMAIL` is set correctly in `.env`
- Redeploy after changing `ADMIN_EMAIL`
- Admin status is set at signup time only

### Profile image not uploading
- Check file size (max 5 MB)
- Verify file type (JPEG, PNG, WebP, GIF only)
- If using Cloudinary, verify `STORAGE_BACKEND=cloudinary` and API key
