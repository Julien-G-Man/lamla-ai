import hashlib

from django.conf import settings
from django.db import models
from django.utils import timezone


class QuizSession(models.Model):
    """Model to track quiz sessions and results."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_sessions",
    )
    subject           = models.CharField(max_length=100, blank=True, help_text="Subject/topic of the quiz", db_index=True)
    total_questions   = models.IntegerField(default=0)
    correct_answers   = models.IntegerField(default=0)
    score_percentage  = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    duration_minutes  = models.IntegerField(default=0, help_text="Time taken in minutes")
    questions_data    = models.JSONField(default=dict, help_text="Stored quiz questions and answers")
    user_answers      = models.JSONField(default=dict, help_text="User's answers")
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering        = ["-created_at"]
        verbose_name    = "Quiz Session"
        verbose_name_plural = "Quiz Sessions"

    def __str__(self):
        # Custom user model uses email, not username
        return f"{self.user.email} - {self.subject} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def score_display(self):
        return f"{self.correct_answers}/{self.total_questions} ({self.score_percentage}%)"


class Question(models.Model):
    question_text = models.TextField()
    answer        = models.TextField(default="N/A")
    question_type = models.CharField(max_length=20, choices=[
        ("mcq",   "Multiple Choice"),
        ("short", "Short Answer"),
    ], default="mcq")
    options    = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question_text

    @staticmethod
    def generate_content_hash(text: str) -> str:
        """Generate a hash for the content to use for caching."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()


class QuestionCache(models.Model):
    """Cache for storing generated questions based on content hash."""
    question_content_hash = models.CharField(max_length=64, unique=True, db_index=True)
    question_text  = models.TextField(null=True, blank=True)
    answer         = models.TextField(null=True, blank=True)
    question_type  = models.CharField(max_length=20, null=True, blank=True)
    options        = models.JSONField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    last_used      = models.DateTimeField(auto_now=True, db_index=True)
    times_used     = models.IntegerField(default=0)

    def __str__(self):
        return f"Cache for {self.question_content_hash[:8]}..."