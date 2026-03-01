from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = "List users"

    def handle(self, *args, **kwargs):
        users = User.objects.all()

        if not users.exists():
            print("No users found")
            return

        for user in users:
            print(
                f"id={user.id} | email={user.email} | username={user.username} | verified={user.is_email_verified}"
            )