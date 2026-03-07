from rest_framework import serializers
from .settings_model import SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for system settings."""
    
    updated_by_username = serializers.CharField(
        source='updated_by.username',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = SystemSettings
        fields = [
            'id',
            'features_quiz_enabled',
            'features_flashcard_enabled',
            'features_chat_enabled',
            'features_materials_enabled',
            'max_upload_size_mb',
            'allowed_file_types',
            'default_quiz_time_limit_minutes',
            'max_quiz_questions',
            'maintenance_mode',
            'maintenance_message',
            'chatbot_daily_limit',
            'quiz_daily_limit',
            'platform_name',
            'support_email',
            'created_at',
            'updated_at',
            'updated_by_username',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'updated_by_username',
        ]
