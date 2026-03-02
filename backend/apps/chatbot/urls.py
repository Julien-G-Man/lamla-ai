from django.urls import path
from . import async_views
from .dashboard_views import ChatHistoryView

urlpatterns = [
    path("chat/",               async_views.chatbot_api_async,        name="chatbot_api"),
    path("chat/stream/",        async_views.chatbot_stream_async,      name="chatbot_stream"),
    path("chat/file/",          async_views.chatbot_file_api_async,    name="chatbot_file_api"),
    path("chat/history/",       async_views.get_conversation_history,  name="get_history"),
    path("chat/history/clear/", async_views.clear_conversation_history,name="clear_history"),
    path("chatbot/history/",    ChatHistoryView.as_view(),             name="chat_history_dashboard"),
]