from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    MeView,
    VerifyEmailView,
    ResendVerificationEmailView,
    UpdateProfileView,
    ChangePasswordView,
    UploadProfileImageView,
    DebugUsers
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("auth/signup/",               SignupView.as_view(),              name="auth-signup"),
    path("auth/login/",                LoginView.as_view(),               name="auth-login"),
    path("auth/logout/",               LogoutView.as_view(),              name="auth-logout"),

    # Re-hydrate auth state on page refresh
    path("auth/me/",                   MeView.as_view(),                  name="auth-me"),

    # ── Email Verification ────────────────────────────────────────────────────
    path("auth/verify-email/",         VerifyEmailView.as_view(),         name="auth-verify-email"),
    path("auth/resend-verification/",  ResendVerificationEmailView.as_view(), name="auth-resend-verification"),

    # ── Profile ───────────────────────────────────────────────────────────────
    path("auth/update-profile/",       UpdateProfileView.as_view(),       name="auth-update-profile"),
    path("auth/change-password/",      ChangePasswordView.as_view(),      name="auth-change-password"),
    path("auth/upload-profile-image/", UploadProfileImageView.as_view(),  name="auth-upload-image"),
    
    # Tests
    path("debug/users", DebugUsers.as_view(), name="debug-users")
]