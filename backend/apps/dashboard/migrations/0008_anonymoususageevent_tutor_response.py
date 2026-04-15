# Generated manually for anonymous tutor response capture

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0007_anonymoususageevent_tutor_message"),
    ]

    operations = [
        migrations.AddField(
            model_name="anonymoususageevent",
            name="tutor_response",
            field=models.TextField(blank=True),
        ),
    ]
