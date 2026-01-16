from django.urls import path
from . import views
from . import async_views

urlpatterns = [
    # High-performance async proxy endpoints
    path("chat/", async_views.chatbot_api_async, name="chatbot_api"),
    path("chat/stream/", async_views.chatbot_stream_async, name="chatbot_stream"),
    
    # File upload endpoint (kept as sync for now, can be converted later)
    path("chat/file/", views.chatbot_file_api, name="chatbot_file_api"),
    
    # Legacy sync endpoints (kept for backward compatibility)
    # Uncomment if you need to fallback:
    # path("chat/sync/", views.chatbot_api, name="chatbot_api_sync"),
]