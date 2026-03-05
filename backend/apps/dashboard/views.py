import datetime
import logging
from django.utils import timezone
from django.db import models as dm
from django.db.models import Value, TextField
from django.db.models.functions import TruncDate, Length, Cast, Coalesce
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.quiz.models import QuizSession
from apps.chatbot.models import ChatSession, ChatMessage
from apps.accounts.serializers import user_to_dict
from apps.accounts.services import EmailDeliveryError
from .services import send_contact_emails, send_newsletter_emails
from .serializers import ContactFormSerializer, NewsletterSerializer

logger = logging.getLogger(__name__)


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
    today = timezone.now().date()
    for i, day in enumerate(dates):
        if day == today - datetime.timedelta(days=i):
            streak += 1
        else:
            break
    return streak


def _tokens_from_chars(char_count: int) -> int:
    """
    Approximate token count from character count.
    Rule of thumb: ~4 characters/token for English mixed text.
    """
    if not char_count:
        return 0
    return int(round(char_count / 4))


def _safe_char_sum(qs, expression):
    result = qs.aggregate(total=Coalesce(dm.Sum(expression), Value(0)))
    return int(result.get("total") or 0)


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
            'total_quizzes': quiz_stats['total'] or 0,
            'average_score': round(float(quiz_stats['avg'] or 0), 1),
            'total_flashcard_sets': total_flashcard_sets,
            'total_chats': ChatSession.objects.filter(user=user).count(),
            'study_streak': _calculate_streak(user),
        })


class AdminDashboardStatsView(APIView):
    """GET /api/dashboard/admin/stats/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden.'}, status=403)

        from apps.accounts.models import User
        from apps.flashcards.models import Deck, Flashcard

        now = timezone.now()
        day_ago = now - datetime.timedelta(days=1)

        quiz_stats = QuizSession.objects.aggregate(
            total=dm.Count('id'),
            avg=dm.Avg('score_percentage'),
            total_questions=Coalesce(dm.Sum('total_questions'), Value(0)),
        )

        total_users = User.objects.count()
        verified_users = User.objects.filter(is_email_verified=True).count()
        total_flashcard_sets = Deck.objects.count()
        total_flashcards = Flashcard.objects.count()
        total_chat_sessions = ChatSession.objects.exclude(user__isnull=True).count()
        total_chat_messages = ChatMessage.objects.count()

        # 24h activity
        quizzes_24h = QuizSession.objects.filter(created_at__gte=day_ago).count()
        decks_24h = Deck.objects.filter(created_at__gte=day_ago).count()
        cards_24h = Flashcard.objects.filter(created_at__gte=day_ago).count()
        chat_messages_24h = ChatMessage.objects.filter(created_at__gte=day_ago).count()
        new_users_24h = User.objects.filter(date_joined__gte=day_ago).count()

        # Character volume for token estimates
        chat_chars = _safe_char_sum(ChatMessage.objects.all(), Length('content'))

        flashcard_q_chars = _safe_char_sum(Flashcard.objects.all(), Length('question'))
        flashcard_a_chars = _safe_char_sum(Flashcard.objects.all(), Length('answer'))
        flashcard_chars = flashcard_q_chars + flashcard_a_chars

        quiz_subject_chars = _safe_char_sum(QuizSession.objects.all(), Length('subject'))
        quiz_questions_json_chars = _safe_char_sum(
            QuizSession.objects.all(),
            Length(Cast('questions_data', output_field=TextField()))
        )
        quiz_answers_json_chars = _safe_char_sum(
            QuizSession.objects.all(),
            Length(Cast('user_answers', output_field=TextField()))
        )
        quiz_chars = quiz_subject_chars + quiz_questions_json_chars + quiz_answers_json_chars

        estimated_tokens_chat = _tokens_from_chars(chat_chars)
        estimated_tokens_flashcards = _tokens_from_chars(flashcard_chars)
        estimated_tokens_quiz = _tokens_from_chars(quiz_chars)
        estimated_tokens_total = (
            estimated_tokens_chat +
            estimated_tokens_flashcards +
            estimated_tokens_quiz
        )

        avg_quizzes_per_user = round((quiz_stats['total'] or 0) / max(total_users, 1), 2)
        avg_chats_per_user = round(total_chat_sessions / max(total_users, 1), 2)

        return Response({
            'total_users': total_users,
            'verified_users': verified_users,
            'total_quizzes': quiz_stats['total'] or 0,
            'total_materials': total_flashcard_sets,
            'total_flashcards': total_flashcards,
            'total_chat_sessions': total_chat_sessions,
            'total_chat_messages': total_chat_messages,
            'total_quiz_questions': int(quiz_stats['total_questions'] or 0),
            'average_score': round(float(quiz_stats['avg'] or 0), 1),
            'avg_quizzes_per_user': avg_quizzes_per_user,
            'avg_chats_per_user': avg_chats_per_user,
            'activity_24h': {
                'new_users': new_users_24h,
                'quizzes': quizzes_24h,
                'decks': decks_24h,
                'flashcards': cards_24h,
                'chat_messages': chat_messages_24h,
            },
            'estimated_tokens': {
                'chat': estimated_tokens_chat,
                'quiz': estimated_tokens_quiz,
                'flashcards': estimated_tokens_flashcards,
                'total': estimated_tokens_total,
                'method': 'chars_div_4_estimate',
                'note': 'Approximation only. Provider billing tokens may differ.',
            },
        })


class AdminUsageTrendsView(APIView):
    """GET /api/dashboard/admin/usage-trends/?days=14"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden.'}, status=403)

        from apps.accounts.models import User
        from apps.flashcards.models import Deck

        try:
            days = int(request.query_params.get("days", 14))
        except (TypeError, ValueError):
            days = 14
        days = max(7, min(days, 90))

        today = timezone.now().date()
        start_day = today - datetime.timedelta(days=days - 1)

        def _series(qs, date_field: str):
            rows = (
                qs.filter(**{f"{date_field}__date__gte": start_day})
                .annotate(day=TruncDate(date_field))
                .values("day")
                .annotate(count=dm.Count("id"))
                .order_by("day")
            )
            return {r["day"]: int(r["count"]) for r in rows}

        users_map = _series(User.objects.all(), "date_joined")
        quizzes_map = _series(QuizSession.objects.all(), "created_at")
        decks_map = _series(Deck.objects.all(), "created_at")
        chats_map = _series(ChatMessage.objects.all(), "created_at")

        labels = []
        users = []
        quizzes = []
        decks = []
        chats = []
        for offset in range(days):
            day = start_day + datetime.timedelta(days=offset)
            labels.append(day.isoformat())
            users.append(users_map.get(day, 0))
            quizzes.append(quizzes_map.get(day, 0))
            decks.append(decks_map.get(day, 0))
            chats.append(chats_map.get(day, 0))

        return Response(
            {
                "days": days,
                "labels": labels,
                "series": {
                    "new_users": users,
                    "quizzes": quizzes,
                    "decks": decks,
                    "chat_messages": chats,
                },
            }
        )


class AdminUsersListView(APIView):
    """GET /api/dashboard/admin/users/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_admin:
            return Response({'detail': 'Forbidden.'}, status=403)

        from apps.accounts.models import User

        users = (
            User.objects
            .annotate(
                total_quizzes=dm.Count('quiz_sessions', distinct=True),
                total_flashcard_sets=dm.Count('decks', distinct=True),
                total_chats=dm.Count('chatsession', distinct=True),
            )
            .order_by('-date_joined')[:50]
        )
        data = []
        for u in users:
            d = user_to_dict(u)
            d['total_quizzes'] = int(getattr(u, 'total_quizzes', 0) or 0)
            d['total_flashcard_sets'] = int(getattr(u, 'total_flashcard_sets', 0) or 0)
            d['total_chats'] = int(getattr(u, 'total_chats', 0) or 0)
            d['date_joined'] = u.date_joined.strftime('%b %d, %Y')
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


class ContactMessageView(APIView):
    """POST /api/dashboard/contact/"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = ContactFormSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            send_contact_emails(**serializer.validated_data)
        except (EmailDeliveryError, ValueError) as exc:
            logger.exception("Contact email delivery failed: %s", exc)
            return Response(
                {"detail": "Message saved but email delivery is temporarily unavailable."},
                status=202,
            )

        return Response({"detail": "Message sent successfully."})


class NewsletterSubscribeView(APIView):
    """POST /api/dashboard/newsletter/"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = NewsletterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            send_newsletter_emails(serializer.validated_data["email"])
        except (EmailDeliveryError, ValueError) as exc:
            logger.exception("Newsletter email delivery failed: %s", exc)
            return Response(
                {"detail": "Subscription received but email delivery is temporarily unavailable."},
                status=202,
            )

        return Response({"detail": "Subscription successful."})
