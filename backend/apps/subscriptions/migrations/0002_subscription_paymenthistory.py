import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Subscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('plan', models.CharField(
                    choices=[('free', 'Free'), ('pro', 'Pro')],
                    default='free',
                    max_length=10,
                )),
                ('status', models.CharField(
                    choices=[
                        ('active', 'Active'),
                        ('cancelled', 'Cancelled'),
                        ('past_due', 'Past Due'),
                        ('expired', 'Expired'),
                    ],
                    default='active',
                    max_length=12,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='subscription',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PaymentHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='GHS', max_length=5)),
                ('reference', models.CharField(max_length=100, unique=True)),
                ('type', models.CharField(
                    choices=[('donation', 'Donation'), ('subscription', 'Subscription')],
                    max_length=14,
                )),
                ('status', models.CharField(
                    choices=[('success', 'Success'), ('failed', 'Failed'), ('refunded', 'Refunded')],
                    max_length=10,
                )),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='payment_history',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name_plural': 'Payment history',
                'ordering': ['-created_at'],
            },
        ),
    ]
