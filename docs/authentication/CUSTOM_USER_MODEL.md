# Custom User Model — Implementation Details

## Overview

Lamla AI replaced Django's default `auth.User` model with a custom `AbstractBaseUser`-based model to:
- Use **email as the username** (not a separate username field)
- Support **email verification status** tracking
- Enable **admin detection** via environment variable
- Better align with modern authentication patterns

## Model Architecture

### File Location
`backend/apps/accounts/models.py`

### User Model Fields

| Field | Type | Constraints | Notes |
|-------|------|-----------|-------|
| `id` | `AutoField` | Primary key | Auto-generated |
| `email` | `EmailField` | Unique, `USERNAME_FIELD` | Used for login |
| `username` | `CharField(50)` | Unique, `REQUIRED_FIELDS` | Display name |
| `password` | (inherited) | — | PBKDF2 hashed |
| `is_admin` | `BooleanField` | Default `False` | Server-side only |
| `is_active` | `BooleanField` | Default `True` | Soft delete flag |
| `is_staff` | `BooleanField` | Default `False` | Django admin access |
| `is_superuser` | `BooleanField` | Default `False` | Full permissions |
| `is_email_verified` | `BooleanField` | Default `False` | Email verification status |
| `email_verified_at` | `DateTimeField` | Nullable, auto now | Timestamp of verification |
| `last_login_ip` | `CharField(45)` | Nullable | Last login IP address (IPv4/IPv6) |
| `profile_image` | `URLField` | Nullable | Profile image URL |
| `date_joined` | `DateTimeField` | auto_now_add | Account creation timestamp |
| `last_login` | `DateTimeField` | Auto-updated | Last successful login |

### Manager Implementation

**File:** `backend/apps/accounts/models.py`

```python
class UserManager(BaseUserManager):
    def create_user(self, email, password, username, **extra_fields):
        """
        Create and save a regular user.
        """
        email = self.normalize_email(email)
        username_lower = username.lower()
        
        # Check uniqueness (case-insensitive for username)
        if self.filter(username__iexact=username_lower).exists():
            raise ValueError(f"Username '{username}' already taken")
        
        # Auto-promote to admin if email matches ADMIN_EMAIL env var
        admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
        if admin_email and email.lower() == admin_email:
            extra_fields["is_admin"] = True
            extra_fields["is_staff"] = True
            extra_fields["is_superuser"] = True
        
        user = self.model(
            email=email,
            username=username_lower,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, username, **extra_fields):
        """
        Create and save a superuser.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        return self.create_user(email, password, username, **extra_fields)
```

### Key Features

1. **Email as USERNAME_FIELD**
   - Users log in with email, not username
   - Email must be unique
   - Normalized to lowercase

2. **Case-insensitive username**
   - `JohnDoe` and `johndoe` can't both exist
   - Stored in lowercase internally
   - Prevents confusion and duplicate accounts

3. **Auto admin detection**
   - Reads `ADMIN_EMAIL` from server's `.env` at signup
   - Automatically promotes matching email to admin
   - No frontend knowledge of admin email
   - Can be changed by updating `.env` and redeploying

4. **Soft delete support**
   - `is_active=False` for soft-deleting accounts
   - Data preserved in database
   - Can be reactivated without data loss

## Django Settings Integration

### AUTH_USER_MODEL Configuration

In `settings.py`, register the custom model:

```python
AUTH_USER_MODEL = "accounts.User"
```

This must be set **before any migrations** that reference the user model.

### Admin App Integration

In `settings.py`, ensure both apps are installed:

```python
INSTALLED_APPS = [
    # ...
    'django.contrib.auth',          # Still needed for permissions
    'django.contrib.contenttypes',
    'rest_framework',
    'rest_framework.authtoken',
    'accounts',                     # Custom user model
    # ...
]
```

### Rest Framework Configuration

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}
```

## Migration Guide

### Initial Setup

1. **Create accounts app:**
   ```bash
   python manage.py startapp accounts
   ```

2. **Define User model** in `models.py`

3. **Create migrations:**
   ```bash
   python manage.py makemigrations accounts
   ```

4. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```

### Converting from Default User

If migrating from Django's default `auth.User`:

1. **Create data migration:**
   ```bash
   python manage.py makemigrations accounts --empty --name migrate_users
   ```

2. **Write migration function:**
   ```python
   def migrate_users(apps, schema_editor):
       OldUser = apps.get_model('auth', 'User')
       NewUser = apps.get_model('accounts', 'User')
       
       for old_user in OldUser.objects.all():
           NewUser.objects.create(
               email=old_user.email,
               username=old_user.username.lower(),
               password=old_user.password,
               # ... other fields
           )
   ```

3. **Apply migration:**
   ```bash
   python manage.py migrate
   ```

## Admin Registration

### Custom UserAdmin

In `backend/apps/accounts/admin.py`:

```python
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Profile', {'fields': ('profile_image', 'is_email_verified', 'email_verified_at')}),
        ('Permissions', {'fields': ('is_admin', 'is_staff', 'is_superuser', 'is_active')}),
        ('Activity', {'fields': ('date_joined', 'last_login', 'last_login_ip')}),
    )
    
    list_display = ('email', 'username', 'is_admin', 'is_active', 'date_joined')
    search_fields = ('email', 'username')
    list_filter = ('is_admin', 'is_active', 'date_joined')
    
    ordering = ('-date_joined',)
```

## Using in Views and Serializers

### Getting the User Model

**Correct (recommended):**
```python
from django.conf import settings
User = settings.AUTH_USER_MODEL  # Dynamic reference
```

**Incorrect:**
```python
from django.contrib.auth.models import User  # Hard-coded to default
```

### ForeignKey to User

**Correct (in other apps):**
```python
from django.conf import settings

user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE
)
```

**Incorrect:**
```python
from django.contrib.auth.models import User

user = models.ForeignKey(User, on_delete=models.CASCADE)  # Error!
```

### Querying Users

```python
from django.conf import settings

User = settings.AUTH_USER_MODEL

# Get by email (the USERNAME_FIELD)
user = User.objects.get(email='user@example.com')

# Filter by admin status
admins = User.objects.filter(is_admin=True)

# Case-insensitive username search
user = User.objects.get(username__iexact='johndoe')
```

## Serializer Integration

### Signup Serializer

```python
from rest_framework import serializers
from django.conf import settings

class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=50)
    password = serializers.CharField(write_only=True)
    
    def validate_email(self, value):
        User = settings.AUTH_USER_MODEL
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("User already exists")
        return value
    
    def validate_username(self, value):
        User = settings.AUTH_USER_MODEL
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username taken")
        return value
    
    def create(self, validated_data):
        User = settings.AUTH_USER_MODEL
        return User.objects.create_user(**validated_data)
```

## Token Authentication

### Creating Tokens

When user logs in, create an auth token:

```python
from rest_framework.authtoken.models import Token

user = authenticate(email=email, password=password)
token = Token.objects.create(user=user)
return {'token': token.key}
```

### Token Rotation

On password change, delete old tokens to invalidate sessions:

```python
def change_password(user, old_password, new_password):
    if not user.check_password(old_password):
        raise ValueError("Invalid password")
    
    user.set_password(new_password)
    user.save()
    
    # Rotate token — invalidate all sessions
    Token.objects.filter(user=user).delete()
```

## Admin Detection Flow

### Setup

1. **Set environment variable:**
   ```bash
   # .env
   ADMIN_EMAIL=admin@yourdomain.com
   ```

2. **Deploy/restart server**

3. **User registers with that email:**
   - Account is created with `is_admin=True`
   - User is promoted to staff and superuser
   - Frontend receives `is_admin` in login response

### Changing Admin

1. **Update `.env`:**
   ```bash
   ADMIN_EMAIL=neoadmin@yourdomain.com
   ```

2. **Redeploy server** (no code changes)

3. **Next signup with new email becomes admin**

### Why Not Frontend?

- React env vars are embedded in JS bundle at build time
- Anyone can inspect page source and read them
- `is_admin` from API response is safe (backend-generated)
- Frontend can't be trusted to determine roles

## Troubleshooting

### Migration Errors

**Error:** `fields.E301: Field defines a relation to the model 'auth.User'`

**Cause:** Some app is still referencing the old `auth.User` model

**Fix:** Update to use `settings.AUTH_USER_MODEL`:
```python
# Before
from django.contrib.auth.models import User
user = models.ForeignKey(User, ...)

# After
from django.conf import settings
user = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
```

### Duplicate Email Registration

**Error:** `IntegrityError at /api/auth/signup/`

**Cause:** Email already exists in database

**Fix:** Ensure email validation in serializer:
```python
def validate_email(self, value):
    if User.objects.filter(email__iexact=value).exists():
        raise serializers.ValidationError("Email already registered")
    return value
```

### Admin Email Not Being Detected

**Check:** Is `ADMIN_EMAIL` set in `.env` and server restarted?

**Debug:** Add logging to `UserManager.create_user()`:
```python
admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
print(f"[DEBUG] ADMIN_EMAIL env: {admin_email}")
print(f"[DEBUG] Signup email: {email.lower()}")
print(f"[DEBUG] Match: {email.lower() == admin_email}")
```
