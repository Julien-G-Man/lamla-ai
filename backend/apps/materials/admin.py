from django.contrib import admin
from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display  = ('title', 'subject', 'uploaded_by', 'file_size_display', 'download_count', 'is_active', 'created_at')
    list_filter   = ('is_active', 'subject', 'created_at')
    search_fields = ('title', 'description', 'uploaded_by__username', 'uploaded_by__email')
    readonly_fields = ('download_count', 'file_size', 'file_type', 'original_filename', 'created_at', 'updated_at')
    ordering      = ('-created_at',)

    actions = ['soft_delete', 'restore']

    @admin.action(description='Soft-delete selected materials')
    def soft_delete(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description='Restore selected materials')
    def restore(self, request, queryset):
        queryset.update(is_active=True)