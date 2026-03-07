from rest_framework import serializers
from .models import Material
from .helpers import SUBJECT_CHOICES


class MaterialSerializer(serializers.ModelSerializer):
    uploader_username = serializers.SerializerMethodField()
    uploader_id       = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()

    class Meta:
        model  = Material
        fields = [
            'id', 'title', 'description', 'subject',
            'file_url', 'original_filename', 'file_size', 'file_size_display',
            'download_count', 'uploader_id', 'uploader_username', 'created_at',
        ]
        read_only_fields = fields

    def get_uploader_id(self, obj):
        return obj.uploaded_by_id

    def get_uploader_username(self, obj):
        return obj.uploaded_by.username if obj.uploaded_by else 'Anonymous'

    def get_file_size_display(self, obj):
        size = obj.file_size or 0
        if size < 1024:
            return f'{size} B'
        elif size < 1024 ** 2:
            return f'{size / 1024:.1f} KB'
        return f'{size / (1024 ** 2):.1f} MB'


class MaterialUploadSerializer(serializers.Serializer):
    """Validates multipart upload fields before the view touches them."""
    file        = serializers.FileField()
    title       = serializers.CharField(max_length=200)
    description = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=''
    )
    
    subject = serializers.ChoiceField(
        choices=[s["value"] for s in SUBJECT_CHOICES],
        required=False,
        default='other',
    )

    def validate_file(self, value):
        allowed_types = ('application/pdf',)
        if value.content_type not in allowed_types and not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('Only PDF files are accepted.')
        if value.size > 20 * 1024 * 1024:
            raise serializers.ValidationError('File must be under 20 MB.')
        return value