from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ChatSession


class ChatHistoryView(APIView):
    """GET /api/chatbot/history/ — list of chat sessions for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(
            user=request.user
        ).order_by('-created_at')[:20]

        data = [{
            'id':            s.id,
            'message_count': s.messages.count(),
            'last_message':  (
                s.messages.order_by('-created_at')
                .values_list('content', flat=True)
                .first() or ''
            )[:120],
            'created_at':    s.created_at.isoformat(),
        } for s in sessions]

        return Response({'history': data})