# Authentication Setup

## Model

Project uses custom user model: `accounts.User`.

`AUTH_USER_MODEL = "accounts.User"` is required in Django settings.

## Token Auth

- DRF `TokenAuthentication`
- Frontend sends `Authorization: Token <token>`
- `DEFAULT_PERMISSION_CLASSES` is authenticated by default

## Main Endpoints

- `POST /api/auth/signup/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `POST /api/auth/change-password/`
- `POST /api/auth/verify-email/`
- `POST /api/auth/resend-verification/`
- `POST /api/profile/update-profile/`
- `POST /api/profile/upload-profile-image/`

## Email Verification

- Users are created with `is_email_verified=False`.
- Verification endpoint marks user verified.
- Resend endpoint sends new verification email.

## Admin Assignment

- `ADMIN_EMAIL` in backend env controls auto-admin promotion at signup.
- Decision is backend-only.
