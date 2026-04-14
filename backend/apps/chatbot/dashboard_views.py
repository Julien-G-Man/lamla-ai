from django.db.models import Count, OuterRef, Subquery
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ChatMessage, ChatSession


class ChatHistoryView(APIView):
    """GET /api/chatbot/history/ — list of chat sessions for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        last_message_subquery = ChatMessage.objects.filter(
            session=OuterRef('pk')
        ).order_by('-created_at').values('content')[:1]

        sessions = ChatSession.objects.filter(
            user=request.user
        ).annotate(
            message_count=Count('messages'),
            last_message_raw=Subquery(last_message_subquery),
        ).order_by('-created_at')[:10]

        data = [{
            'id':            s.id,
            'session_id':    s.session_id,
            'title':         s.title,
            'message_count': s.message_count,
            'last_message':  (s.last_message_raw or '')[:120],
            'created_at':    s.created_at.isoformat(),
        } for s in sessions]

        return Response({'history': data})