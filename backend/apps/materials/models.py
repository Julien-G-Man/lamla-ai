from django.db import models
from django.conf import settings
from django.utils import timezone


class Material(models.Model):
    """
    A community-shared study material (PDF).
    Uploaded by a user and accessible to everyone.
    """

    uploaded_by     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='materials',
    )

    title           = models.CharField(max_length=200)
    description     = models.TextField(blank=True, default='')
    subject         = models.CharField(max_length=100, blank=True, default='')

    # Storage-agnostic: we store a URL after uploading to Cloudinary / local
    file_url        = models.URLField(max_length=1000)
    original_filename = models.CharField(max_length=255)
    file_size       = models.PositiveBigIntegerField(help_text='Size in bytes')
    file_type       = models.CharField(max_length=100, default='application/pdf')

    download_count  = models.PositiveIntegerField(default=0)
    is_active       = models.BooleanField(default=True)

    created_at      = models.DateTimeField(default=timezone.now)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering            = ['-created_at']
        verbose_name        = 'Material'
        verbose_name_plural = 'Materials'

    def __str__(self):
        uploader = self.uploaded_by.username if self.uploaded_by else 'deleted user'
        return f'{self.title} — {uploader}'

    @property
    def file_size_display(self):
        """Human-readable file size."""
        size = self.file_size
        for unit in ('B', 'KB', 'MB', 'GB'):
            if size < 1024:
                return f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'