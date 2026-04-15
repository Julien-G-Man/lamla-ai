# Custom User Model

Location: `backend/apps/accounts/models.py`

## Summary

- Class: `User(AbstractBaseUser, PermissionsMixin)`
- Login field: `email` (`USERNAME_FIELD = "email"`)
- Required field: `username`

## Key Fields

- `email` (unique)
- `username` (unique)
- `is_admin`, `is_staff`, `is_superuser`, `is_active`
- `is_email_verified`, `email_verified_at`
- `profile_image`, `date_joined`, `last_login`
- `is_donor` — set to `True` permanently when a donation is confirmed; never unset. Included in all `user_to_dict` payloads. Used in Tier 3 for LLM budget and future donor badge display.

## Manager Rules

- Normalizes email.
- Enforces case-insensitive uniqueness semantics for username logic.
- Auto-promotes to admin/staff/superuser when signup email matches `ADMIN_EMAIL`.

## Integration Rules

- All FK to user must use `settings.AUTH_USER_MODEL`.
- Never import `django.contrib.auth.models.User` directly in app models.
