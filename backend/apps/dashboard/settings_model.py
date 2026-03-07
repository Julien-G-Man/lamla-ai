from django.db import models


class SystemSettings(models.Model):
    """Global system configuration accessible only to admins."""
    
    # Feature toggles
    features_quiz_enabled = models.BooleanField(default=True, help_text="Enable/disable quiz feature")
    features_flashcard_enabled = models.BooleanField(default=True, help_text="Enable/disable flashcard feature")
    features_chat_enabled = models.BooleanField(default=True, help_text="Enable/disable chat feature")
    features_materials_enabled = models.BooleanField(default=True, help_text="Enable/disable materials upload")
    
    # File upload limits
    max_upload_size_mb = models.IntegerField(default=25, help_text="Maximum file upload size in MB")
    allowed_file_types = models.TextField(
        default="pdf,docx,doc,txt,xlsx,xls,pptx,ppt",
        help_text="Comma-separated list of allowed file extensions"
    )
    
    # Quiz settings
    default_quiz_time_limit_minutes = models.IntegerField(default=30, help_text="Default quiz time limit in minutes")
    max_quiz_questions = models.IntegerField(default=100, help_text="Maximum questions per quiz")
    
    # System behavior
    maintenance_mode = models.BooleanField(default=False, help_text="Enable maintenance mode (blocks user access)")
    maintenance_message = models.TextField(blank=True, help_text="Message shown during maintenance mode")
    
    # Rate limiting
    chatbot_daily_limit = models.IntegerField(default=0, help_text="Chat messages per user per day (0=unlimited)")
    quiz_daily_limit = models.IntegerField(default=0, help_text="Quizzes per user per day (0=unlimited)")
    
    # General settings
    platform_name = models.CharField(max_length=255, default="Lamla AI")
    support_email = models.EmailField(blank=True, help_text="Contact email for support requests")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="settings_updates"
    )
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'
    
    def __str__(self):
        return f"System Settings (updated {self.updated_at.strftime('%Y-%m-%d %H:%M')})"
    
    @classmethod
    def get_instance(cls):
        """Get or create the singleton system settings instance."""
        instance, _ = cls.objects.get_or_create(pk=1)
        return instance
