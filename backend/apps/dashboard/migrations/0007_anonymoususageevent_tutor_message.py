# Generated manually for anonymous tutor message capture

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0006_anonymoususageevent_payload_sizes"),
    ]

    operations = [
        migrations.AddField(
            model_name="anonymoususageevent",
            name="tutor_message",
            field=models.TextField(blank=True),
        ),
    ]
