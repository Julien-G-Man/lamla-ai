from django.urls import path
from . import async_views

urlpatterns = [
    # High-performance async proxy endpoints
    path("chat/", async_views.chatbot_api_async, name="chatbot_api"),
    path("chat/stream/", async_views.chatbot_stream_async, name="chatbot_stream"),
    path("chat/file/", async_views.chatbot_file_api_async, name="chatbot_file_api"),
    
    # Diagnostic endpoints (for testing/debugging)
    path("chat/history/", async_views.get_conversation_history, name="get_history"),
    path("chat/history/clear/", async_views.clear_conversation_history, name="clear_history"),
]