from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chatbot", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="chatsession",
            index=models.Index(
                fields=["user", "-created_at"],
                name="chat_session_user_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="chatmessage",
            index=models.Index(
                fields=["session", "created_at"],
                name="chat_msg_session_created_idx",
            ),
        ),
    ]
