from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .settings_model import SystemSettings


class QuizExperienceRating(models.Model):
    """Stores quiz experience star ratings from authenticated and anonymous users."""

    SOURCE_CHOICES = [
        ("quiz_results", "Quiz Results"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quiz_experience_ratings",
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    source = models.CharField(max_length=40, choices=SOURCE_CHOICES, default="quiz_results", db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["source", "updated_at"]),
        ]

    def __str__(self):
        actor = self.user.email if self.user else (self.session_key or "anonymous")
        return f"{actor} rated {self.rating}/5"


__all__ = ["SystemSettings", "QuizExperienceRating"]
