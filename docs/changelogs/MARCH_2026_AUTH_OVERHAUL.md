# Lamla AI — Development Changelog

**Project:** Lamla AI (React + Django + FastAPI)  
**Date:** March 1, 2026  
**Scope:** Auth system redesign (frontend + backend), routing changes, model refactors

---

## Table of Contents

1. [Frontend — Auth Page Redesign](#1-frontend--auth-page-redesign)
2. [Frontend — Routing Changes](#2-frontend--routing-changes)
3. [Frontend — Signup Cleanup](#3-frontend--signup-cleanup)
4. [Backend — Accounts App (Django)](#4-backend--accounts-app-django)
5. [Backend — Other App Fixes](#5-backend--other-app-fixes)
6. [Architecture Decisions](#6-architecture-decisions)

---

## 1. Frontend — Auth Page Redesign

**Date:** March 1, 2026  
**Files changed:** `Login.jsx`, `Login.css`, `Signup.jsx`, `Signup.css`

### What changed

Completely replaced the original single-column card auth pages with a **split-panel layout**:

- **Left panel (brand):** Dark background (`#0c0c0c` → `#1a1a1a` gradient), logo, headline, feature list with emoji icons, radial glow effect, geometric ring overlays
- **Right panel (form):** Clean centered form with labelled inputs, icon prefixes, password toggle, error banner, footer links

### Login page specifics

- Brand headline: *"Study smarter, not harder."*
- Features listed: AI quiz generation, smart flashcards, progress analytics, AI tutor
- Error normalisation handles all DRF response shapes: `non_field_errors`, `detail`, `message`
- Redirects to `/admin-dashboard` if `response.user.is_admin === true`, else `/dashboard`
- `autoComplete` attributes set for browser password manager support

### Signup page specifics

- Brand headline: *"Start learning smarter today."* (mirrors Login style)
- **Progress dots** (3 steps): names → email → password, animate green when each section is complete
- Inline green checkmarks (✓) appear per field as it validates
- Password hint text animates grey → green in real-time
- Submit button disabled until all fields pass validation
- Removed perks strip from form panel (left panel is sufficient)

### Shared CSS architecture

- `Login.css` owns all shared tokens: `.auth-page`, `.auth-brand-panel`, `.auth-form-panel`, `.auth-input-wrap`, `.auth-submit-btn`, `.auth-error-banner`, `.auth-hint`, progress dots, etc.
- `Signup.css` imports `../Login/Login.css` and only adds signup-specific overrides (`.auth-name-row` grid, `.auth-page--signup` width override)
- All values use existing CSS variables (`--surface`, `--border`, `--primary-color`, `--radius-*`, `--navbar-height`) so dark/light theme switching works automatically
- Light theme overrides via `[data-theme="light"]` already wired

### Responsive behaviour

- Below 900px: left brand panel hidden, form panel goes full-width
- Below 480px: reduced padding, stacked name row

---

## 2. Frontend — Routing Changes

**Date:** March 1, 2026  
**Files changed:** `App.jsx`, `Navbar.jsx`

### New routes

| Old path | New path | Behaviour |
|----------|----------|-----------|
| `/login` | `/auth/login` | New canonical route |
| `/signup` | `/auth/signup` | New canonical route |
| `/login` | — | `<Navigate to="/auth/login" replace />` legacy redirect |
| `/signup` | — | `<Navigate to="/auth/signup" replace />` legacy redirect |

### App.jsx

```jsx
<Route path="/auth/login"  element={<Login />} />
<Route path="/auth/signup" element={<Signup />} />
<Route path="/login"  element={<Navigate to="/auth/login"  replace />} />
<Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
```

Legacy redirects keep existing bookmarks and any hardcoded `/login` links working without a breaking change.

### Navbar.jsx

Updated two links from `/login` → `/auth/login` and `/signup` → `/auth/signup` in both the desktop nav and mobile drawer. No other changes to Navbar — component, CSS, scroll behaviour, hamburger, theme FAB all untouched.

---

## 3. Frontend — Signup Cleanup

**Date:** March 1, 2026  
**Files changed:** `Signup.jsx`

### Perks strip removed

The `auth-perks` block (AI quiz generation, Smart flashcards, Progress tracking, AI tutor assistant) was removed from the right form panel. The left brand panel already communicates this information through the feature list — duplicating it on the form side was cluttered.

Removed:
- `PERKS` constant array
- `<div className="auth-perks">` JSX block and all child elements

### Left panel aligned with Login

- `BRAND_FEATURES` array updated to use the same four icons and labels as Login's `FEATURES` array
- Headline changed from *"Your personal AI study partner."* to *"Start learning smarter today."* to match Login's tone and structure
- Both pages now feel like visual siblings

---

## 4. Backend — Accounts App (Django)

**Date:** March 1, 2026  
**Location:** `backend/apps/accounts/`  
**Files created:** `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, `apps.py`

### models.py — Custom User model

Replaced Django's default `auth.User` with a custom `AbstractBaseUser`:

| Field | Type | Notes |
|-------|------|-------|
| `email` | `EmailField` | Unique, `USERNAME_FIELD` — used to log in |
| `username` | `CharField(50)` | Unique display name (replaces first/last name) |
| `is_admin` | `BooleanField` | Set server-side from `ADMIN_EMAIL` env var |
| `is_active` | `BooleanField` | Default `True` |
| `is_staff` | `BooleanField` | Django admin access |
| `profile_image` | `URLField` | Nullable, stores image URL |
| `date_joined` | `DateTimeField` | Auto-set on creation |
| `last_login` | `DateTimeField` | Updated on each successful login |

**Admin detection logic (in `UserManager.create_user`):**

```python
admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
if admin_email and email.lower() == admin_email:
    extra_fields["is_admin"] = True
    extra_fields["is_staff"] = True
    extra_fields["is_superuser"] = True
```

The `ADMIN_EMAIL` environment variable is read at signup time on the server. It is never exposed to the frontend or embedded in the JS bundle. Changing the admin requires only a `.env` update and redeploy — no code changes.

### serializers.py

| Serializer | Endpoint | Purpose |
|-----------|----------|---------|
| `SignupSerializer` | `POST /api/auth/signup/` | Validates email uniqueness, username uniqueness (case-insensitive), Django password validators |
| `LoginSerializer` | `POST /api/auth/login/` | Uses Django's `authenticate()` — handles password hashing correctly |
| `UpdateProfileSerializer` | `POST /api/auth/update-profile/` | Partial update of `username` and/or `email`, checks uniqueness excluding self |
| `ChangePasswordSerializer` | `POST /api/auth/change-password/` | Verifies old password, validates new password against Django validators |

All serializers return errors in shapes the frontend `auth.js` already handles: field-level arrays, `non_field_errors`, `detail`.

Helper `user_to_dict(user)` produces the safe payload sent to the frontend:

```python
{
    "id", "email", "username", "is_admin", "profile_image", "date_joined"
}
```

### views.py

| View | Method | URL | Auth |
|------|--------|-----|------|
| `SignupView` | POST | `/api/auth/signup/` | Public |
| `LoginView` | POST | `/api/auth/login/` | Public |
| `LogoutView` | POST | `/api/auth/logout/` | Required |
| `MeView` | GET | `/api/auth/me/` | Required |
| `UpdateProfileView` | POST | `/api/auth/update-profile/` | Required |
| `ChangePasswordView` | POST | `/api/auth/change-password/` | Required |
| `UploadProfileImageView` | POST | `/api/auth/upload-profile-image/` | Required |

Production details:
- Structured `logging` on every action (signup, login, logout, profile update, password change, image upload)
- `last_login` updated on each successful login via `update_fields` (no full model save)
- Token **rotated** on password change — invalidates all existing sessions
- Image upload validates file type (JPEG, PNG, WebP, GIF) and size (max 5 MB) before touching storage
- `UploadProfileImageView._upload()` is a pluggable method — set `STORAGE_BACKEND=cloudinary` in `.env` to activate Cloudinary; falls back to local placeholder in dev

### urls.py

All 7 paths match the `authApi.post(...)` calls in `frontend/src/services/auth.js` exactly:

```
/api/auth/signup/
/api/auth/login/
/api/auth/logout/
/api/auth/me/
/api/auth/update-profile/
/api/auth/change-password/
/api/auth/upload-profile-image/
```

Included in root `urls.py` via `path('api/', include("apps.accounts.urls"))` — already present.

### admin.py

Custom `UserAdmin` extending `BaseUserAdmin`:
- List view: email, username, is_admin, is_active, date_joined
- Search by email or username
- Fieldsets: credentials, profile, permissions, dates
- `filter_horizontal` for groups and user_permissions

### Required settings.py additions

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
'rest_framework.authtoken',
```

### Required .env additions

```
ADMIN_EMAIL=admin@yourdomain.com
STORAGE_BACKEND=cloudinary   # optional, omit for local dev
```

### Migration commands

```bash
python manage.py makemigrations accounts
python manage.py migrate
```

---

## 5. Backend — Other App Fixes

**Date:** March 1, 2026  
**Files changed:** `apps/chatbot/models.py`, `apps/quiz/models.py`

### Problem

Both apps had `ForeignKey` pointing directly at `auth.User`:

```python
# ❌ Before
from django.contrib.auth.models import User
user = models.ForeignKey(User, ...)
```

After setting `AUTH_USER_MODEL = "accounts.User"`, Django raises `fields.E301` at system check time because the referenced model has been swapped out.

### Fix

```python
# ✅ After
from django.conf import settings
user = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
```

This is the correct pattern for any app that references the user model — it always resolves to whatever `AUTH_USER_MODEL` is set to.

### Additional fix in quiz/models.py

`QuizSession.__str__` was using `self.user.username` — which refers to Django's default `username` field that doesn't exist on the custom model. Changed to `self.user.email` which is always present.

```python
# ❌ Before
return f"{self.user.username} - {self.subject} ..."

# ✅ After
return f"{self.user.email} - {self.subject} ..."
```

### Migration error resolution

Running `makemigrations accounts` after setting `AUTH_USER_MODEL` raised:

```
InconsistentMigrationHistory: Migration admin.0001_initial is applied
before its dependency accounts.0001_initial on database 'default'.
```

**Cause:** Django's `admin` and `auth` apps were already migrated against the default `auth.User`, but the new custom model had no migration yet.

**Resolution (development):** Drop and recreate the database, then run a clean `migrate`:

```bash
# PostgreSQL
DROP DATABASE lamla_db;
CREATE DATABASE lamla_db;

python manage.py migrate
```

Or attempt fake-initial first:

```bash
python manage.py migrate --fake-initial
python manage.py makemigrations accounts
python manage.py migrate
```

---

## 6. Architecture Decisions

### Admin detection — backend env var vs frontend env var

**Decision:** Admin status is determined entirely on the Django backend by comparing the registering email against `ADMIN_EMAIL` from the server's `.env`.

**Why not frontend:**
- React env vars (`REACT_APP_*`) are embedded in the JS bundle at build time — anyone can read them by inspecting page source
- Client-side role checks can be bypassed by navigating directly to `/admin-dashboard`
- The frontend already consumes `is_admin` from the API response — no frontend logic change was needed

**Why backend env var works:**
- The secret never leaves the server
- Changing the admin email requires only a `.env` update and redeploy
- The existing `response.user.is_admin` check in `Login.jsx` continues to work unchanged

### Token authentication

Using DRF's built-in `TokenAuthentication` (stored in `rest_framework.authtoken`):
- Simple, stateless, works well with the existing `auth.js` interceptor that attaches `Authorization: Bearer <token>` to every request
- Token is rotated on password change to invalidate other sessions
- Token is deleted server-side on logout (not just cleared from localStorage)

### Username over first/last name

**Decision:** Single `username` field replaces separate `first_name` + `last_name` fields.

- Simpler signup form (one field instead of two)
- Unique constraint enforced case-insensitively (`__iexact`) so `JohnDoe` and `johndoe` can't coexist
- `user_to_dict` returns `username` — the frontend displays this everywhere a display name is needed

---

*Documentation generated: March 1, 2026*