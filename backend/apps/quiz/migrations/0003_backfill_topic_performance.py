"""
Data migration: backfill TopicPerformance and QuizTopicSchedule
from all existing QuizSession rows.

Runs automatically on `manage.py migrate`. Safe to run on a DB that
already has some rows from live submissions — TopicPerformance rows are
replaced with the full aggregate and QuizTopicSchedule rows are only
initialised if they don't exist yet.

SM-2 logic is inlined here (not imported from live code) so this
migration stays self-contained and won't break if the scheduling module
changes later.
"""
from datetime import timedelta

from django.db import migrations
from django.db.models import Max, Sum
from django.utils import timezone


def _score_to_quality(score: float) -> int:
    if score >= 90: return 5
    if score >= 75: return 4
    if score >= 60: return 3
    if score >= 40: return 2
    if score >= 20: return 1
    return 0


def _apply_sm2(schedule, quality: int):
    """Minimal SM-2 update — mirrors flashcards/scheduling.py."""
    quality = max(0, min(5, quality))
    if quality < 3:
        schedule.repetition = 0
        schedule.interval = 1
    else:
        if schedule.repetition == 0:
            schedule.interval = 1
        elif schedule.repetition == 1:
            schedule.interval = 6
        else:
            schedule.interval = round(schedule.interval * schedule.ease_factor)
        schedule.repetition += 1

    schedule.ease_factor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    if schedule.ease_factor < 1.3:
        schedule.ease_factor = 1.3

    now = timezone.now()
    schedule.next_review = now + timedelta(days=schedule.interval)
    schedule.last_review = now
    schedule.save()


def backfill(apps, schema_editor):
    QuizSession = apps.get_model("quiz", "QuizSession")
    TopicPerformance = apps.get_model("quiz", "TopicPerformance")
    QuizTopicSchedule = apps.get_model("quiz", "QuizTopicSchedule")

    groups = (
        QuizSession.objects
        .exclude(subject="")
        .values("user_id", "subject")
        .annotate(
            total_q=Sum("total_questions"),
            total_correct=Sum("correct_answers"),
            latest_score=Max("score_percentage"),
        )
    )

    for row in groups:
        user_id = row["user_id"]
        topic = row["subject"]
        total_q = row["total_q"] or 0
        total_correct = row["total_correct"] or 0
        latest_score = float(row["latest_score"] or 0)

        if not topic or total_q == 0:
            continue

        accuracy = round(total_correct / total_q * 100, 2)

        TopicPerformance.objects.update_or_create(
            user_id=user_id,
            topic=topic,
            defaults={
                "subject": topic,
                "total_questions": total_q,
                "correct_answers": total_correct,
                "accuracy": accuracy,
            },
        )

        schedule, created = QuizTopicSchedule.objects.get_or_create(
            user_id=user_id,
            topic=topic,
            defaults={"subject": topic},
        )
        if created:
            _apply_sm2(schedule, _score_to_quality(latest_score))


def reverse_backfill(apps, schema_editor):
    # Reversing a backfill is a no-op — we don't delete data that may
    # have been created by live submissions after the forward migration ran.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0002_tier1_models"),
    ]

    operations = [
        migrations.RunPython(backfill, reverse_backfill),
    ]
