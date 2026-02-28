from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display    = ("email", "username", "is_admin", "is_active", "date_joined")
    list_filter     = ("is_admin", "is_active", "is_staff")
    search_fields   = ("email", "username")
    ordering        = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login")

    fieldsets = (
        (None, {
            "fields": ("email", "password"),
        }),
        (_("Profile"), {
            "fields": ("username", "profile_image"),
        }),
        (_("Permissions"), {
            "fields": ("is_active", "is_admin", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        (_("Important dates"), {
            "fields": ("last_login", "date_joined"),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields":  ("email", "username", "password1", "password2", "is_admin", "is_staff", "is_active"),
        }),
    )

    filter_horizontal = ("groups", "user_permissions")