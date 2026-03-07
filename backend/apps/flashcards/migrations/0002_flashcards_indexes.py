from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("flashcards", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="deck",
            index=models.Index(fields=["user", "created_at"], name="fc_deck_user_created_idx"),
        ),
        migrations.AddIndex(
            model_name="flashcard",
            index=models.Index(fields=["deck", "next_review"], name="fc_card_deck_due_idx"),
        ),
        migrations.AddIndex(
            model_name="flashcard",
            index=models.Index(fields=["next_review"], name="fc_card_due_idx"),
        ),
    ]
