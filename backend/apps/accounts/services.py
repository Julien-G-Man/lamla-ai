import logging
import requests
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """Raised when email delivery fails across all configured backends."""


def get_uid(user) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def get_token(user) -> str:
    return default_token_generator.make_token(user)


def _resolve_from_email() -> str:
    return (
        getattr(settings, "DEFAULT_FROM_EMAIL", None)
        or getattr(settings, "AUTH_EMAIL_HOST_USER", None)
        or "no-reply@localhost"
    )


def _get_backend_priority() -> list[str]:
    """
    Determine backend priority order from EMAIL_BACKEND_PRIORITY env var.
    Used by dashboard contact/newsletter emails only. Auth emails are sent via EmailJS on the frontend.

    Set EMAIL_BACKEND_PRIORITY in your .env as a comma-separated list.
    Available backends: brevo, resend, smtp, console

    Examples:
        EMAIL_BACKEND_PRIORITY=brevo,resend,smtp      # Brevo first
        EMAIL_BACKEND_PRIORITY=resend,brevo,smtp      # Resend first
        EMAIL_BACKEND_PRIORITY=smtp                   # SMTP only (local dev)
        EMAIL_BACKEND_PRIORITY=console                # Print to console (testing)

    If unset, defaults to: brevo → resend → smtp
    """
    raw = getattr(settings, "EMAIL_BACKEND_PRIORITY", None)

    if not raw:
        return ["brevo", "resend", "smtp"]

    valid = {"resend", "brevo", "smtp", "console"}
    priority = []

    for item in str(raw).split(","):
        cleaned = item.strip().lower().split("#")[0].strip()  # strip inline comments
        if cleaned in valid:
            priority.append(cleaned)
        elif cleaned:
            logger.warning("Unknown email backend '%s' in EMAIL_BACKEND_PRIORITY — skipping.", cleaned)

    if not priority:
        logger.warning("EMAIL_BACKEND_PRIORITY had no valid entries. Falling back to: brevo, resend, smtp.")
        return ["brevo", "resend", "smtp"]

    return priority


# ─── Backend Implementations ──────────────────────────────────────────────────

def _send_via_brevo(subject: str, to_email: str, html_body: str, text_body: str) -> None:
    """
    Send via Brevo HTTP API.
    Works on Render free tier (no SMTP port restrictions).
    300 emails/day free. No custom domain required.

    Required env var: BREVO_API_KEY
    Get it from: brevo.com → SMTP & API → API Keys
    """
    api_key = getattr(settings, "BREVO_API_KEY", None)
    if not api_key:
        raise EmailDeliveryError("BREVO_API_KEY is not configured")

    try:
        resp = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
            },
            json={
                "sender": {"email": _resolve_from_email()},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_body,
                "textContent": text_body,
            },
            timeout=10,
        )
        if resp.status_code not in (200, 201):
            raise EmailDeliveryError(f"Brevo API returned {resp.status_code}: {resp.text}")

        logger.info("Email sent via Brevo to %s", to_email)

    except EmailDeliveryError:
        raise
    except Exception as exc:
        raise EmailDeliveryError(f"Brevo request failed: {exc}") from exc


def _send_via_resend(subject: str, to_email: str, html_body: str, text_body: str) -> None:
    """
    Send via Resend HTTP API.
    Requires a verified custom domain.

    Required env var: RESEND_API_KEY
    Get it from: resend.com → API Keys
    """
    try:
        import resend
    except Exception as exc:
        raise EmailDeliveryError(f"Resend SDK not installed: {exc}") from exc

    api_key = getattr(settings, "RESEND_API_KEY", None)
    if not api_key:
        raise EmailDeliveryError("RESEND_API_KEY is not configured")

    resend.api_key = api_key

    try:
        resend.Emails.send({
            "from": _resolve_from_email(),
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        })
        logger.info("Email sent via Resend to %s", to_email)
    except Exception as exc:
        raise EmailDeliveryError(f"Resend send failed: {exc}") from exc


def _send_via_django_mail(subject: str, to_email: str, html_body: str, text_body: str) -> None:
    """
    Send via Django's EMAIL_BACKEND (SMTP, console, etc).
    Note: SMTP is blocked on Render's free tier. Use for local dev or paid hosting.

    Required env vars: AUTH_EMAIL_HOST_USER, AUTH_EMAIL_HOST_PASSWORD
    """
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


def _send_via_console(subject: str, to_email: str, html_body: str, text_body: str) -> None:
    """Prints email to console. For local testing only."""
    logger.info("=== [CONSOLE EMAIL] To: %s | Subject: %s ===", to_email, subject)
    logger.info(text_body)


# ─── Router ───────────────────────────────────────────────────────────────────
# Used for dashboard contact/newsletter emails only.
# Auth emails (verification, password reset) are sent via EmailJS on the frontend.

_BACKEND_MAP = {
    "brevo":   _send_via_brevo,
    "resend":  _send_via_resend,
    "smtp":    _send_via_django_mail,
    "console": _send_via_console,
}


def _send_email(subject: str, to_email: str, html_body: str, text_body: str | None = None) -> None:
    """
    Send email by trying each backend in priority order.
    Priority is controlled via EMAIL_BACKEND_PRIORITY in your .env.

    Falls through to the next backend on any failure, raising
    EmailDeliveryError only if all backends are exhausted.
    """
    text = text_body or html_body
    priority = _get_backend_priority()
    errors: list[str] = []

    for backend_name in priority:
        send_fn = _BACKEND_MAP.get(backend_name)
        if not send_fn:
            continue

        try:
            send_fn(subject, to_email, html_body, text)
            return  # success — stop here
        except EmailDeliveryError as exc:
            logger.warning("[%s] failed for %s: %s", backend_name, to_email, exc)
            errors.append(f"{backend_name}: {exc}")

    reason = " | ".join(errors) if errors else "No delivery backend available"
    logger.error("All email backends failed for %s: %s", to_email, reason)
    raise EmailDeliveryError(reason)


# ─── Public API ───────────────────────────────────────────────────────────────

def send_templated_email(*, subject: str, to_email: str, template_prefix: str, context: dict) -> None:
    text_body = render_to_string(f"{template_prefix}.txt", context)
    html_body = render_to_string(f"{template_prefix}.html", context)
    _send_email(subject=subject, to_email=to_email, html_body=html_body, text_body=text_body)