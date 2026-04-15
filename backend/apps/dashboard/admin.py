from django.contrib import admin
from .models import SystemSettings, QuizExperienceRating, AnonymousUsageEvent


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ('platform_name', 'maintenance_mode', 'updated_at', 'updated_by')
    fieldsets = (
        ('Platform', {
            'fields': ('platform_name', 'support_email')
        }),
        ('Feature Toggles', {
            'fields': (
                'features_quiz_enabled',
                'features_flashcard_enabled',
                'features_chat_enabled',
                'features_materials_enabled',
            )
        }),
        ('File Upload', {
            'fields': (
                'max_upload_size_mb',
                'allowed_file_types',
            )
        }),
        ('Quiz Settings', {
            'fields': (
                'default_quiz_time_limit_minutes',
                'max_quiz_questions',
            )
        }),
        ('Rate Limiting', {
            'fields': (
                'chatbot_daily_limit',
                'quiz_daily_limit',
            )
        }),
        ('Maintenance', {
            'fields': (
                'maintenance_mode',
                'maintenance_message',
            ),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'updated_by')

    def has_add_permission(self, request):
        # Prevent adding new instances
        return False

    def has_delete_permission(self, request, obj=None):
        # Prevent deleting the singleton instance
        return False


@admin.register(QuizExperienceRating)
class QuizExperienceRatingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session_key", "rating", "source", "created_at")
    list_filter = ("rating", "source", "created_at")
    search_fields = ("user__email", "session_key", "ip_address")
    readonly_fields = ("created_at", "updated_at")


@admin.register(AnonymousUsageEvent)
class AnonymousUsageEventAdmin(admin.ModelAdmin):
    list_display = ("id", "method", "path", "status_code", "session_key", "created_at")
    list_filter = ("method", "status_code", "created_at")
    search_fields = ("path", "session_key", "ip_address", "user_agent")
    readonly_fields = ("created_at",)

