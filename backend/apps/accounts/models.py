import os
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email)

        # Automatically grant admin if email matches the env-configured admin email
        admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
        if admin_email and email.lower() == admin_email:
            extra_fields.setdefault("is_admin", True)
            extra_fields.setdefault("is_staff", True)
            extra_fields.setdefault("is_superuser", True)
        else:
            extra_fields.setdefault("is_admin", False)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_admin", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model.
    - Email is the unique identifier.
    - username is the display name (unique).
    - is_admin is set server-side by matching ADMIN_EMAIL env var.
    """

    email    = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=50, unique=True, db_index=True)

    # Application-level admin flag (separate from Django's is_staff/is_superuser)
    is_admin = models.BooleanField(default=False)

    # Django internals
    is_active = models.BooleanField(default=True)
    is_staff  = models.BooleanField(default=False)

    profile_image = models.URLField(blank=True, null=True)

    date_joined = models.DateTimeField(default=timezone.now)
    last_login  = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username"]  # prompted by createsuperuser

    class Meta:
        verbose_name        = "User"
        verbose_name_plural = "Users"
        ordering            = ["-date_joined"]

    def __str__(self):
        return f"{self.username} <{self.email}>"