from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import User


# ── Helpers ───────────────────────────────────────────────────────────────────

def user_to_dict(user):
    """Minimal safe user payload sent to the frontend."""
    return {
        "id":            user.id,
        "email":         user.email,
        "username":      user.username,
        "is_admin":      user.is_admin,
        "profile_image": user.profile_image,
        "date_joined":   user.date_joined.isoformat(),
    }


# ── Signup ────────────────────────────────────────────────────────────────────

class SignupSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(max_length=50)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username cannot be blank.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_password(self, value):
        try:
            password_validation.validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email    = validated_data["email"],
            password = validated_data["password"],
            username = validated_data["username"],
        )


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email    = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = authenticate(
            request=self.context.get("request"),
            username=email,   # Django's authenticate uses USERNAME_FIELD
            password=password,
        )

        if user is None:
            raise serializers.ValidationError("Incorrect email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        data["user"] = user
        return data


# ── Profile update ────────────────────────────────────────────────────────────

class UpdateProfileSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50, required=False)
    email    = serializers.EmailField(required=False)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exclude(pk=self.context["request"].user.pk).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username cannot be blank.")
        if User.objects.filter(username__iexact=value).exclude(pk=self.context["request"].user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def update(self, instance, validated_data):
        instance.username = validated_data.get("username", instance.username)
        instance.email    = validated_data.get("email",    instance.email)
        instance.save()
        return instance


# ── Password change ───────────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        try:
            password_validation.validate_password(value, self.context["request"].user)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user