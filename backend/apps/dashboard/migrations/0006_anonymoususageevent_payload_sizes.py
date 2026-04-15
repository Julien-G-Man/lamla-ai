# Generated manually for anonymous usage payload sizes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0005_rename_dashboard_a_created_0a8f31_idx_dashboard_a_created_b01fa0_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="anonymoususageevent",
            name="request_chars",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="anonymoususageevent",
            name="response_chars",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
