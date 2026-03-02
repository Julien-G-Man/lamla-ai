from django.contrib.auth.backends import ModelBackend
from .models import User

class EmailOrUsernameBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Try email first, then username
        try:
            if '@' in str(username):
                user = User.objects.get(email=username.strip().lower())
            else:
                user = User.objects.get(username__iexact=username.strip())
        except User.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None