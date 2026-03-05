import logging
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when email delivery fails across all configured backends."""


def _get_uid(user) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def _get_token(user) -> str:
    return default_token_generator.make_token(user)


def _normalize_backend_type() -> str:
    """Normalize backend value from env/settings to one of: auto|resend|smtp|console."""
    raw_value = getattr(settings, "EMAIL_BACKEND_TYPE", None)
    if raw_value is None:
        return "auto"

    value = str(raw_value).strip().lower()
    if not value:
        return "auto"

    # Handle accidental inline comments in env values.
    value = value.split("#", 1)[0].strip()

    aliases = {
        "mailjet": "smtp",  # backward compatibility with older docs/env comments
        "django": "smtp",
    }
    value = aliases.get(value, value)

    if value not in {"auto", "resend", "smtp", "console"}:
        logger.warning("Unknown EMAIL_BACKEND_TYPE '%s'. Falling back to auto.", raw_value)
        return "auto"

    return value


def _resolve_from_email() -> str:
    return (
        getattr(settings, "DEFAULT_FROM_EMAIL", None)
        or getattr(settings, "AUTH_EMAIL_HOST_USER", None)
        or "no-reply@localhost"
    )


def _send_via_resend(subject: str, to_email: str, html_body: str, text_body: str) -> None:
    try:
        import resend
    except Exception as exc:
        raise EmailDeliveryError(f"Resend SDK import failed: {exc}") from exc

    api_key = getattr(settings, "RESEND_API_KEY", None)
    if not api_key:
        raise EmailDeliveryError("RESEND_API_KEY is missing")

    resend.api_key = api_key

    try:
        resend.Emails.send(
            {
                "from": _resolve_from_email(),
                "to": [to_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            }
        )
        logger.info("Email sent via Resend to %s", to_email)
    except Exception as exc:
        raise EmailDeliveryError(f"Resend send failed: {exc}") from exc


def _send_via_django_mail(subject: str, to_email: str, html_body: str, text_body: str) -> None:
    try:
        msg = EmailMultiAlternatives(
            subject,
            text_body,
            _resolve_from_email(),
            [to_email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        logger.info("Email sent via Django mail backend to %s", to_email)
    except Exception as exc:
        raise EmailDeliveryError(f"Django mail send failed: {exc}") from exc


def _send_email(subject: str, to_email: str, html_body: str, text_body: str | None = None) -> None:
    """
    Send email with resilient backend routing.

    Strategy:
    - EMAIL_BACKEND_TYPE=resend: try Resend, then fallback to Django mail backend
    - EMAIL_BACKEND_TYPE=smtp|console: use Django mail backend directly
    - EMAIL_BACKEND_TYPE=auto/unset: try Resend first if available, then Django mail backend
    """
    text = text_body or html_body
    backend_type = _normalize_backend_type()

    errors: list[str] = []

    if backend_type in {"resend", "auto"}:
        try:
            _send_via_resend(subject, to_email, html_body, text)
            return
        except EmailDeliveryError as exc:
            errors.append(str(exc))
            logger.warning("Resend path failed for %s: %s", to_email, exc)

            # If explicitly configured for resend, still allow fallback for uptime.
            # This avoids hard outages when provider keys/domain are temporarily invalid.

    if backend_type in {"smtp", "console", "auto", "resend"}:
        try:
            _send_via_django_mail(subject, to_email, html_body, text)
            return
        except EmailDeliveryError as exc:
            errors.append(str(exc))
            logger.warning("Django mail backend path failed for %s: %s", to_email, exc)

    reason = " | ".join(errors) if errors else "No delivery backend available"
    raise EmailDeliveryError(reason)


def send_templated_email(*, subject: str, to_email: str, template_prefix: str, context: dict) -> None:
    text_body = render_to_string(f"{template_prefix}.txt", context)
    html_body = render_to_string(f"{template_prefix}.html", context)
    _send_email(subject=subject, to_email=to_email, html_body=html_body, text_body=text_body)


def send_verification_email(user) -> bool:
    uid = _get_uid(user)
    token = _get_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verify_link = f"{frontend_url}/auth/verify-email?uid={uid}&token={token}"

    context = {
        "user": user,
        "verify_link": verify_link,
        "site_name": getattr(settings, "SITE_NAME", "Lamla AI"),
    }
    try:
        send_templated_email(
            subject=f"Verify your email - {context['site_name']}",
            to_email=user.email,
            template_prefix="accounts/emails/verification_email",
            context=context,
        )
        return True
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)
        return False


def send_password_reset_email(user) -> bool:
    uid = _get_uid(user)
    token = _get_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

    context = {
        "user": user,
        "reset_link": reset_link,
        "site_name": getattr(settings, "SITE_NAME", "Lamla AI"),
    }
    try:
        send_templated_email(
            subject=f"Reset your password - {context['site_name']}",
            to_email=user.email,
            template_prefix="accounts/emails/password_reset_email",
            context=context,
        )
        return True
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)
        return False
