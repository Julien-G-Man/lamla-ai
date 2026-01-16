from django.urls import path
from . import async_views

urlpatterns = [
    # High-performance async proxy endpoint
    path("quiz/generate/", async_views.generate_quiz_api_async, name="generate_quiz_api"),
    path("quiz/ajax-extract-text/", async_views.ajax_extract_text, name="ajax_extract_text"),
    
    # Legacy sync endpoint (kept for backward compatibility)
    # from . import views
    # path("quiz/generate/sync/", views.generate_quiz_api, name="generate_quiz_api_sync"),
]