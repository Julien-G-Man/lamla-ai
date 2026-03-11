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


def _get_uid(user) -> str:
    return urlsafe_base64_encode(force_bytes(user.pk))


def _get_token(user) -> str:
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

    Set EMAIL_BACKEND_PRIORITY in your .env as a comma-separated list.
    Available backends: gas, resend, brevo, smtp, console

    Examples:
        EMAIL_BACKEND_PRIORITY=gas,brevo              # GAS first (recommended on Render free)
        EMAIL_BACKEND_PRIORITY=brevo,resend,smtp      # Brevo first
        EMAIL_BACKEND_PRIORITY=resend,brevo,smtp      # Resend first (default when domain ready)
        EMAIL_BACKEND_PRIORITY=smtp                   # SMTP only (local dev)
        EMAIL_BACKEND_PRIORITY=console                # Print to console (testing)

    If unset, defaults to: gas → brevo → resend → smtp
    (GAS first because it works on Render's free tier via HTTP API and needs no extra paid service)
    """
    raw = getattr(settings, "EMAIL_BACKEND_PRIORITY", None)

    if not raw:
        return ["gas", "brevo", "resend", "smtp"]

    valid = {"gas", "resend", "brevo", "smtp", "console"}
    priority = []

    for item in str(raw).split(","):
        cleaned = item.strip().lower().split("#")[0].strip()  # strip inline comments
        if cleaned in valid:
            priority.append(cleaned)
        elif cleaned:
            logger.warning("Unknown email backend '%s' in EMAIL_BACKEND_PRIORITY — skipping.", cleaned)

    if not priority:
        logger.warning("EMAIL_BACKEND_PRIORITY had no valid entries. Falling back to: gas, brevo, resend, smtp.")
        return ["gas", "brevo", "resend", "smtp"]

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


def _send_via_gas(subject: str, to_email: str, html_body: str, text_body: str) -> None:
    """
    Send via Google Apps Script Web App.
    Works on Render's free tier (plain HTTPS request, no SMTP).
    Uses GmailApp inside GAS — no extra paid service needed.

    Required env vars:
        GAS_AUTH_EMAIL_URL     — deployed Web App URL from gas/auth_emails.gs
        GAS_AUTH_EMAIL_SECRET  — shared secret set in GAS Script Properties as GAS_SECRET

    The email type is inferred from the subject line.
    Alternatively, callers can use send_verification_email / send_password_reset_email
    which call GAS with the explicit `type` field via _send_gas_typed().
    """
    gas_url = getattr(settings, "GAS_AUTH_EMAIL_URL", None)
    if not gas_url:
        raise EmailDeliveryError("GAS_AUTH_EMAIL_URL is not configured")

    secret = getattr(settings, "GAS_AUTH_EMAIL_SECRET", None)

    payload: dict = {
        "type":        "__raw__",   # handled by _send_gas_typed for typed sends
        "to_email":    to_email,
        "action_link": "",
        "subject":     subject,
        "html_body":   html_body,
    }
    if secret:
        payload["secret"] = secret

    try:
        resp = requests.post(gas_url, json=payload, timeout=15)
        data = resp.json() if resp.text else {}
        if not data.get("success"):
            raise EmailDeliveryError(f"GAS returned error: {data.get('error', resp.text)}")
        logger.info("Email sent via GAS to %s", to_email)
    except EmailDeliveryError:
        raise
    except Exception as exc:
        raise EmailDeliveryError(f"GAS request failed: {exc}") from exc


def _send_gas_typed(*, email_type: str, to_email: str, user_name: str, action_link: str) -> None:
    """
    Send a typed auth email (verification or password_reset) through GAS.
    Called directly by send_verification_email and send_password_reset_email.
    """
    gas_url = getattr(settings, "GAS_AUTH_EMAIL_URL", None)
    if not gas_url:
        raise EmailDeliveryError("GAS_AUTH_EMAIL_URL is not configured")

    secret = getattr(settings, "GAS_AUTH_EMAIL_SECRET", None)

    payload: dict = {
        "type":        email_type,
        "to_email":    to_email,
        "user_name":   user_name,
        "action_link": action_link,
    }
    if secret:
        payload["secret"] = secret

    try:
        resp = requests.post(gas_url, json=payload, timeout=15)
        data = resp.json() if resp.text else {}
        if not data.get("success"):
            raise EmailDeliveryError(f"GAS returned error: {data.get('error', resp.text)}")
        logger.info("Auth email (%s) sent via GAS to %s", email_type, to_email)
    except EmailDeliveryError:
        raise
    except Exception as exc:
        raise EmailDeliveryError(f"GAS request failed: {exc}") from exc


# ─── Router ───────────────────────────────────────────────────────────────────

_BACKEND_MAP = {
    # "gas" is intentionally excluded here.
    # Auth emails (verification, password_reset) already call _send_gas_typed()
    # directly in send_verification_email() / send_password_reset_email().
    # The __raw__ GAS path is not available until the GAS script is redeployed
    # with __raw__ type support — adding it here would cause a redundant failing
    # attempt for every auth email that falls back to _send_email().
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


def send_verification_email(user) -> bool:
    uid = _get_uid(user)
    token = _get_token(user)

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    verify_link = f"{frontend_url}/auth/verify-email?uid={uid}&token={token}"
    site_name = getattr(settings, "SITE_NAME", "Lamla AI")
    user_name = getattr(user, "first_name", None) or user.email

    # Try GAS typed send first (if configured), then fall back to template-based backends
    priority = _get_backend_priority()
    if "gas" in priority and getattr(settings, "GAS_AUTH_EMAIL_URL", None):
        try:
            _send_gas_typed(
                email_type="verification",
                to_email=user.email,
                user_name=user_name,
                action_link=verify_link,
            )
            return True
        except EmailDeliveryError as exc:
            logger.warning("GAS verification email failed for %s: %s — falling back", user.email, exc)

    context = {
        "user": user,
        "verify_link": verify_link,
        "site_name": site_name,
    }
    try:
        send_templated_email(
            subject=f"Verify your email - {site_name}",
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
    site_name = getattr(settings, "SITE_NAME", "Lamla AI")
    user_name = getattr(user, "first_name", None) or user.email

    # Try GAS typed send first (if configured), then fall back to template-based backends
    priority = _get_backend_priority()
    if "gas" in priority and getattr(settings, "GAS_AUTH_EMAIL_URL", None):
        try:
            _send_gas_typed(
                email_type="password_reset",
                to_email=user.email,
                user_name=user_name,
                action_link=reset_link,
            )
            return True
        except EmailDeliveryError as exc:
            logger.warning("GAS password reset email failed for %s: %s — falling back", user.email, exc)

    context = {
        "user": user,
        "reset_link": reset_link,
        "site_name": site_name,
    }
    try:
        send_templated_email(
            subject=f"Reset your password - {site_name}",
            to_email=user.email,
            template_prefix="accounts/emails/password_reset_email",
            context=context,
        )
        return True
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)
        return False