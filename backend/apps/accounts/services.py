import logging
import requests
import resend
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)


def _get_uid(user) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def _get_token(user) -> str:
    return default_token_generator.make_token(user)


def _send_email(subject: str, to_email: str, html_body: str, text_body: str = None) -> None:
    """
    Sends email via selected backend:
    - resend (production)
    - smtp (development)
    """

    backend_type = getattr(settings, "EMAIL_BACKEND_TYPE", "smtp").lower()
    text_body = text_body or html_body

    if backend_type == "resend":
        api_key = getattr(settings, "RESEND_API_KEY", None)

        if not api_key:
            raise ValueError("RESEND_API_KEY not set.")

        resend.api_key = api_key

        try:
            resend.Emails.send({
                "from":    settings.DEFAULT_FROM_EMAIL,
                "to":      [to_email],
                "subject": subject,
                "html":    html_body,
                "text":    text_body,
            })

            logger.info("Resend: Sent email to %s", to_email)

        except Exception as e:
            logger.exception("Resend failed to send email: %s", e)
            raise

    else:
        # SMTP / Console fallback
        try:
            msg = EmailMultiAlternatives(
                subject,
                text_body,
                settings.DEFAULT_FROM_EMAIL,
                [to_email]
            )

            msg.attach_alternative(html_body, "text/html")
            msg.send()

            logger.info("SMTP: Sent email to %s", to_email)

        except Exception as e:
            logger.exception("SMTP failed to send email: %s", e)
            raise


def send_templated_email(*, subject: str, to_email: str, template_prefix: str, context: dict) -> None:
    text_body = render_to_string(f"{template_prefix}.txt", context)
    html_body = render_to_string(f"{template_prefix}.html", context)

    _send_email(subject=subject, to_email=to_email, html_body=html_body, text_body=text_body)


def send_verification_email(user) -> None:
    uid = _get_uid(user)
    token = _get_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    verify_link = f"{frontend_url}/verify-email?uid={uid}&token={token}"

    context = {
        "user": user,
        "verify_link": verify_link,
        "site_name": getattr(settings, "SITE_NAME", "Lamla AI"),
    }
    try:
        send_templated_email(
            subject=f"Verify your email – {context['site_name']}",
            to_email=user.email,
            template_prefix="accounts/emails/verification_email",
            context=context,
        )
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)


def send_password_reset_email(user) -> None:
    uid = _get_uid(user)
    token = _get_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

    context = {
        "user": user,
        "reset_link": reset_link,
        "site_name": getattr(settings, "SITE_NAME", "Lamla AI"),
    }
    try:
        send_templated_email(
            subject=f"Reset your password – {context['site_name']}",
            to_email=user.email,
            template_prefix="accounts/emails/password_reset_email",
            context=context,
        )
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)