import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    SignupSerializer,
    LoginSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    user_to_dict,
)

logger = logging.getLogger(__name__)


# ── Signup ────────────────────────────────────────────────────────────────────

class SignupView(APIView):
    """POST /api/auth/signup/ — public, creates user, returns token + user."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user     = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            logger.info("New user registered: %s (admin=%s)", user.email, user.is_admin)
            return Response(
                {"token": token.key, "user": user_to_dict(user)},
                status=status.HTTP_201_CREATED,
            )
        except Exception:
            logger.exception("Unexpected error during signup")
            return Response(
                {"detail": "Registration failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """POST /api/auth/login/ — public, returns token + user."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            errors     = serializer.errors
            non_field  = errors.get("non_field_errors", [])
            detail     = non_field[0] if non_field else "Invalid credentials."
            return Response({"detail": detail}, status=status.HTTP_401_UNAUTHORIZED)

        user     = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        logger.info("User logged in: %s (admin=%s)", user.email, user.is_admin)
        return Response(
            {"token": token.key, "user": user_to_dict(user)},
            status=status.HTTP_200_OK,
        )


# ── Logout ────────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """POST /api/auth/logout/ — deletes token server-side."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            logger.info("User logged out: %s", request.user.email)
        except Token.DoesNotExist:
            pass
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


# ── Current user ──────────────────────────────────────────────────────────────

class MeView(APIView):
    """GET /api/auth/me/ — re-hydrate auth state on page refresh."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": user_to_dict(request.user)}, status=status.HTTP_200_OK)


# ── Update profile ────────────────────────────────────────────────────────────

class UpdateProfileView(APIView):
    """POST /api/auth/update-profile/ — update username and/or email."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UpdateProfileSerializer(
            instance=request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        logger.info("Profile updated: %s", user.email)
        return Response({"user": user_to_dict(user)}, status=status.HTTP_200_OK)


# ── Change password ───────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — validates old pw, sets new, rotates token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Rotate token to invalidate existing sessions
        Token.objects.filter(user=user).delete()
        new_token, _ = Token.objects.get_or_create(user=user)

        logger.info("Password changed for: %s", user.email)
        return Response(
            {"detail": "Password updated successfully.", "token": new_token.key},
            status=status.HTTP_200_OK,
        )


# ── Upload profile image ──────────────────────────────────────────────────────

class UploadProfileImageView(APIView):
    """POST /api/auth/upload-profile-image/ — multipart image upload."""
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("profile_image")
        if not file:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if file.content_type not in allowed_types:
            return Response(
                {"detail": "Unsupported format. Use JPEG, PNG, WebP, or GIF."},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )

        if file.size > 5 * 1024 * 1024:
            return Response(
                {"detail": "Image must be under 5 MB."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        try:
            image_url = self._upload(file, request.user)
        except Exception:
            logger.exception("Profile image upload failed for %s", request.user.email)
            return Response(
                {"detail": "Upload failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        request.user.profile_image = image_url
        request.user.save(update_fields=["profile_image"])

        logger.info("Profile image updated for: %s", request.user.email)
        return Response({"user": user_to_dict(request.user)}, status=status.HTTP_200_OK)

    def _upload(self, file, user):
        """
        Swap this body for your storage backend:
          - Cloudinary: cloudinary.uploader.upload(file)["secure_url"]
          - S3:         boto3 put_object → URL
          - Azure Blob: BlobServiceClient → upload_blob → URL
        """
        import os
        if os.getenv("STORAGE_BACKEND") == "cloudinary":
            import cloudinary.uploader
            result = cloudinary.uploader.upload(
                file,
                folder=f"lamla/profile_images/{user.id}",
                public_id="avatar",
                overwrite=True,
                resource_type="image",
            )
            return result["secure_url"]

        # Local dev placeholder
        return f"/media/profile_images/{user.id}/avatar"