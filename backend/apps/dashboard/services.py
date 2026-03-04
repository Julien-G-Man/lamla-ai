import logging
from django.conf import settings
from apps.accounts.services import send_templated_email

logger = logging.getLogger(__name__)


def _admin_recipient() -> str:
    return (
        getattr(settings, "ADMIN_EMAIL", None)
        or getattr(settings, "DEFAULT_FROM_EMAIL", None)
        or getattr(settings, "AUTH_EMAIL_HOST_USER", None)
    )


def send_contact_emails(title: str, name: str, email: str, message: str) -> None:
    site_name = getattr(settings, "SITE_NAME", "Lamla AI")
    admin_email = _admin_recipient()
    if not admin_email:
        raise ValueError("No admin recipient configured for contact emails.")

    admin_context = {
        "site_name": site_name,
        "title": title,
        "name": name,
        "email": email,
        "message": message,
    }
    user_context = {
        "site_name": site_name,
        "title": title,
        "name": name,
        "email": email,
    }

    send_templated_email(
        subject=f"New Contact Message - {site_name}",
        to_email=admin_email,
        template_prefix="dashboard/emails/contact_admin",
        context=admin_context,
    )
    send_templated_email(
        subject=f"We received your message - {site_name}",
        to_email=email,
        template_prefix="dashboard/emails/contact_user",
        context=user_context,
    )

    logger.info("Contact form email sent for %s", email)


def send_newsletter_emails(email: str) -> None:
    site_name = getattr(settings, "SITE_NAME", "Lamla AI")
    admin_email = _admin_recipient()
    if not admin_email:
        raise ValueError("No admin recipient configured for newsletter emails.")

    admin_context = {
        "site_name": site_name,
        "email": email,
    }
    user_context = {
        "site_name": site_name,
        "email": email,
    }

    send_templated_email(
        subject=f"New Newsletter Subscription - {site_name}",
        to_email=admin_email,
        template_prefix="dashboard/emails/newsletter_admin",
        context=admin_context,
    )
    send_templated_email(
        subject=f"You are subscribed - {site_name}",
        to_email=email,
        template_prefix="dashboard/emails/newsletter_user",
        context=user_context,
    )

    logger.info("Newsletter subscription email sent for %s", email)
