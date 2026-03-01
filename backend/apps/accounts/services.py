"""
accounts/services.py

All email-sending logic lives here — views stay thin.
Uses Django's built-in email tools (no third-party libraries).
"""

import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)


def _get_uid(user) -> str:
    """URL-safe base64-encoded user PK."""
    return urlsafe_base64_encode(force_bytes(user.pk))


def _get_token(user) -> str:
    """One-time token tied to the user's current password hash + last_login."""
    return default_token_generator.make_token(user)


def _send_email(subject: str, to_email: str, text_body: str, html_body: str) -> None:
    """Low-level helper — send a plain+HTML email."""
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send()


# ── Email Verification ────────────────────────────────────────────────────────

def send_verification_email(user) -> None:
    """
    Send an account-verification email to `user`.
    The link points at the React frontend, which then POSTs uid+token to the API.

    Template paths:
        accounts/auth-email-templates/verification_email.txt
        accounts/auth-email-templates/verification_email.html
    """
    uid   = _get_uid(user)
    token = _get_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    verify_link  = f"{frontend_url}/verify-email?uid={uid}&token={token}"

    context = {
        "user":        user,
        "verify_link": verify_link,
        "site_name":   getattr(settings, "SITE_NAME", "Lamla AI"),
    }

    text_body = render_to_string(
        "accounts/auth-email-templates/verification_email.txt", context
    )
    html_body = render_to_string(
        "accounts/auth-email-templates/verification_email.html", context
    )

    try:
        _send_email(
            subject=f"Verify your email – {context['site_name']}",
            to_email=user.email,
            text_body=text_body,
            html_body=html_body,
        )
        logger.info("Verification email sent to %s", user.email)
    except Exception:
        # Log but don't crash signup — user can request a resend
        logger.exception("Failed to send verification email to %s", user.email)


# ── Password Reset ────────────────────────────────────────────────────────────
# (Stub — implement when password-reset flow is in scope)

def send_password_reset_email(user) -> None:
    """
    Send a password-reset email to `user`.

    Template paths:
        accounts/auth-email-templates/password_reset_email.txt
        accounts/auth-email-templates/password_reset_email.html
    """
    uid   = _get_uid(user)
    token = _get_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    reset_link   = f"{frontend_url}/reset-password?uid={uid}&token={token}"

    context = {
        "user":       user,
        "reset_link": reset_link,
        "site_name":  getattr(settings, "SITE_NAME", "Lamla AI"),
    }

    text_body = render_to_string(
        "accounts/auth-email-templates/password_reset_email.txt", context
    )
    html_body = render_to_string(
        "accounts/auth-email-templates/password_reset_email.html", context
    )

    try:
        _send_email(
            subject=f"Reset your password – {context['site_name']}",
            to_email=user.email,
            text_body=text_body,
            html_body=html_body,
        )
        logger.info("Password reset email sent to %s", user.email)
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)