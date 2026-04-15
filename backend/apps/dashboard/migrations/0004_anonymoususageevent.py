# Generated manually for anonymous usage tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dashboard", "0003_rename_dashboard_qu_source_b77157_idx_dashboard_q_source_e6dc6a_idx"),
    ]

    operations = [
        migrations.CreateModel(
            name="AnonymousUsageEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_key", models.CharField(blank=True, db_index=True, max_length=64)),
                ("method", models.CharField(max_length=10)),
                ("path", models.CharField(db_index=True, max_length=255)),
                ("query_string", models.CharField(blank=True, max_length=255)),
                ("status_code", models.PositiveSmallIntegerField(db_index=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="anonymoususageevent",
            index=models.Index(fields=["created_at"], name="dashboard_a_created_0a8f31_idx"),
        ),
        migrations.AddIndex(
            model_name="anonymoususageevent",
            index=models.Index(fields=["path", "created_at"], name="dashboard_a_path_8840a7_idx"),
        ),
    ]
