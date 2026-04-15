import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add exam_mode and time_limit_minutes to QuizSession
        migrations.AddField(
            model_name="quizsession",
            name="exam_mode",
            field=models.BooleanField(default=False, help_text="Whether this was taken as an exam simulation"),
        ),
        migrations.AddField(
            model_name="quizsession",
            name="time_limit_minutes",
            field=models.PositiveIntegerField(blank=True, null=True, help_text="Time limit set for this session"),
        ),
        # TopicPerformance model
        migrations.CreateModel(
            name="TopicPerformance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("topic", models.CharField(db_index=True, max_length=200)),
                ("subject", models.CharField(db_index=True, max_length=200)),
                ("total_questions", models.PositiveIntegerField(default=0)),
                ("correct_answers", models.PositiveIntegerField(default=0)),
                ("accuracy", models.FloatField(default=0.0)),
                ("last_attempted", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="topic_performance",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"unique_together": {("user", "topic")}},
        ),
        migrations.AddIndex(
            model_name="topicperformance",
            index=models.Index(fields=["user", "accuracy"], name="quiz_topic_user_accuracy_idx"),
        ),
        # QuizTopicSchedule model
        migrations.CreateModel(
            name="QuizTopicSchedule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("topic", models.CharField(max_length=200)),
                ("subject", models.CharField(max_length=200)),
                ("repetition", models.IntegerField(default=0)),
                ("interval", models.IntegerField(default=1)),
                ("ease_factor", models.FloatField(default=2.5)),
                ("next_review", models.DateTimeField(default=django.utils.timezone.now)),
                ("last_review", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="quiz_schedules",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"unique_together": {("user", "topic")}},
        ),
        migrations.AddIndex(
            model_name="quiztopicschedule",
            index=models.Index(fields=["user", "next_review"], name="quiz_schedule_user_review_idx"),
        ),
    ]
