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
    DebugUsers,
    ProfileView
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("auth/signup/",               SignupView.as_view(),              name="auth-signup"),
    path("auth/login/",                LoginView.as_view(),               name="auth-login"),
    path("auth/logout/",               LogoutView.as_view(),              name="auth-logout"),
    path("auth/change-password/",      ChangePasswordView.as_view(),      name="auth-change-password"),

    # Re-hydrate auth state on page refresh
    path("auth/me/",                   MeView.as_view(),                  name="auth-me"),

    # ── Email Verification ────────────────────────────────────────────────────
    path("auth/verify-email/",         VerifyEmailView.as_view(),         name="auth-verify-email"),
    path("auth/resend-verification/",  ResendVerificationEmailView.as_view(), name="auth-resend-verification"),

    # ── Profile ───────────────────────────────────────────────────────────────
    path("profile/",                   ProfileView.as_view(),             name="profile"),
    path("profile/update-profile/",       UpdateProfileView.as_view(),       name="auth-update-profile"),
    path("profile/upload-profile-image/", UploadProfileImageView.as_view(),  name="auth-upload-image"),
    
    # Tests
    path("debug/users", DebugUsers.as_view(), name="debug-users")
]