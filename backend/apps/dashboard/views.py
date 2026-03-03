import datetime
from django.utils import timezone
from django.db import models as dm
from django.db.models.functions import TruncDate
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.quiz.models import QuizSession
from apps.chatbot.models import ChatSession
from apps.accounts.serializers import user_to_dict


def _calculate_streak(user):
    """Consecutive days (ending today) on which user completed at least one quiz."""
    dates = (
        QuizSession.objects
        .filter(user=user)
        .annotate(day=TruncDate('created_at'))
        .values_list('day', flat=True)
        .distinct()
        .order_by('-day')
    )
    streak = 0
    today  = timezone.now().date()
    for i, day in enumerate(dates):
        if day == today - datetime.timedelta(days=i):
            streak += 1
        else:
            break
    return streak


class DashboardStatsView(APIView):
    """GET /api/dashboard/stats/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        quiz_stats = QuizSession.objects.filter(user=user).aggregate(
            total=dm.Count('id'),
            avg=dm.Avg('score_percentage'),
        )

        total_flashcard_sets = 0
        try:
            from apps.flashcards.models import Deck
            total_flashcard_sets = Deck.objects.filter(user=user).count()
        except Exception:
            pass

        return Response({
            'total_quizzes':        quiz_stats['total'] or 0,
            'average_score':        round(float(quiz_stats['avg'] or 0), 1),
            'total_flashcard_sets': total_flashcard_sets,
            'total_chats':          ChatSession.objects.filter(user=user).count(),
            'study_streak':         _calculate_streak(user),
        })


class AdminDashboardStatsView(APIView):
    """GET /api/dashboard/admin/stats/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden.'}, status=403)

        from apps.accounts.models import User

        quiz_stats = QuizSession.objects.aggregate(
            total=dm.Count('id'),
            avg=dm.Avg('score_percentage'),
        )

        total_flashcard_sets = 0
        try:
            from apps.flashcards.models import Deck
            total_flashcard_sets = Deck.objects.count()
        except Exception:
            pass

        return Response({
            'total_users':     User.objects.count(),
            'verified_users':  User.objects.filter(is_email_verified=True).count(),
            'total_quizzes':   quiz_stats['total'] or 0,
            'total_materials': total_flashcard_sets,
            'average_score':   round(float(quiz_stats['avg'] or 0), 1),
        })


class AdminUsersListView(APIView):
    """GET /api/dashboard/admin/users/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden.'}, status=403)

        from apps.accounts.models import User

        users = User.objects.order_by('-date_joined')[:50]
        data  = []
        for u in users:
            d = user_to_dict(u)
            d['total_quizzes'] = QuizSession.objects.filter(user=u).count()
            d['date_joined']   = u.date_joined.strftime('%b %d, %Y')
            data.append(d)

        return Response({'users': data})


class AdminUserDeleteView(APIView):
    """DELETE /api/dashboard/admin/users/<user_id>/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden.'}, status=403)

        from apps.accounts.models import User
        try:
            target = User.objects.get(id=user_id)
            if target.is_admin:
                return Response({'detail': 'Cannot delete an admin.'}, status=400)
            target.delete()
            return Response({'detail': 'User removed.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)