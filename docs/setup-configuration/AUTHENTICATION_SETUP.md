# Authentication Setup

## Model

Project uses custom user model: `accounts.User`.

`AUTH_USER_MODEL = "accounts.User"` is required in Django settings.

## Token Auth

- DRF `TokenAuthentication`
- Frontend sends `Authorization: Token <token>`
- `DEFAULT_PERMISSION_CLASSES` is authenticated by default
- **Token rotation:** Tokens are invalidated and regenerated on every login/Google auth for security

## Authentication Methods

### 1. Email/Username + Password
Traditional credentials-based authentication using Django's custom auth backend.

### 2. Google OAuth 2.0
Custom Google Sign-In integration (no django-allauth dependency).

**Implementation:**
- Backend: `apps/accounts/google_auth.py` - `GoogleAuthView`
- Frontend: `@react-oauth/google` package with `GoogleOAuthProvider`
- Flow: Frontend gets Google ID token → Backend verifies with Google → Returns app auth token

**Requirements:**
- `GOOGLE_OAUTH_CLIENT_ID` environment variable (backend)
- Same client ID configured in frontend `GoogleOAuthProvider`
- Authorized JavaScript origins configured in Google Cloud Console
- Authorized redirect URIs configured in Google Cloud Console

**User Creation:**
- Google auth users are auto-created with `is_email_verified=True`
- Username defaults to email prefix before `@`
- Profile image from Google is saved if available

## Main Endpoints

### Core Auth
- `POST /api/auth/signup/` - Create new account with email/password
- `POST /api/auth/login/` - Login with email/username and password
- `POST /api/auth/logout/` - Invalidate current token
- `POST /api/auth/google/` - **Google OAuth sign-in/sign-up**
- `GET /api/auth/me/` - Get current user info

### Password & Verification
- `POST /api/auth/change-password/` - Change password (requires old password)
- `POST /api/auth/verify-email/` - Verify email with token
- `POST /api/auth/resend-verification/` - Resend verification email

### Profile Management
- `POST /api/profile/update-profile/` - Update username/email
- `POST /api/profile/upload-profile-image/` - Upload profile picture

## Email Verification

- Users created via signup are initialized with `is_email_verified=False`
- Verification endpoint marks user verified
- Resend endpoint sends new verification email
- **Google OAuth users bypass email verification** (auto-verified)

## Admin Assignment

- `ADMIN_EMAIL` in backend env controls auto-admin promotion at signup
- Decision is backend-only
- Works for both traditional signup and Google OAuth

## Debug Logging

All authentication events are logged with both `logger.info()` and `print()`:
- User signup (email/username + Google OAuth)
- User login (email/username + Google OAuth)
- User logout
- Email verification

Logs include user email and admin status for monitoring.
