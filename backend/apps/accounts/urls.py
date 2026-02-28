from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    MeView,
    UpdateProfileView,
    ChangePasswordView,
    UploadProfileImageView,
)

urlpatterns = [
    # authApi.post("/auth/----")
    path("auth/signup/",               SignupView.as_view(),             name="auth-signup"),
    path("auth/login/",                LoginView.as_view(),              name="auth-login"),
    path("auth/logout/",               LogoutView.as_view(),             name="auth-logout"),

    # authApi.get("/auth/me/")  — for re-hydrating auth state on refresh
    path("auth/me/",                   MeView.as_view(),                 name="auth-me"),

    # authApi.post("/auth/---")
    path("auth/update-profile/",       UpdateProfileView.as_view(),      name="auth-update-profile"),
    path("auth/change-password/",      ChangePasswordView.as_view(),     name="auth-change-password"),
    path("auth/upload-profile-image/", UploadProfileImageView.as_view(), name="auth-upload-image"),
]