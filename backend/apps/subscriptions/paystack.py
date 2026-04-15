"""
Thin wrapper around the Paystack REST API.

All money amounts that enter this module are in GHS (floats/Decimals).
Conversion to pesewas (×100, integer) happens here — callers never touch pesewas.
"""
import re
import requests
from django.conf import settings

_SAFE_REFERENCE = re.compile(r'^[a-zA-Z0-9_-]+$')

PAYSTACK_BASE = "https://api.paystack.co"


def _headers():
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def initialize_transaction(email, amount_ghs, reference, callback_url, metadata=None, plan=None):
    """
    Start a Paystack transaction.

    Works for both one-time payments (donations) and subscription initialisation.
    Pass `plan=PAYSTACK_PLAN_CODE` to attach a recurring plan — Paystack will
    create the subscription automatically after the first charge.

    Returns the full Paystack response dict.
    """
    amount_pesewas = int(float(amount_ghs) * 100)
    payload = {
        "email": email,
        "amount": amount_pesewas,
        "currency": "GHS",
        "reference": reference,
        "callback_url": callback_url,
        "metadata": metadata or {},
    }
    if plan:
        payload["plan"] = plan

    response = requests.post(
        f"{PAYSTACK_BASE}/transaction/initialize",
        json=payload,
        headers=_headers(),
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def verify_transaction(reference):
    """
    Verify a completed transaction by reference.
    Used after a redirect callback to confirm the payment actually succeeded.
    Returns the full Paystack response dict.
    """
    if not _SAFE_REFERENCE.match(reference):
        raise ValueError(f"Unsafe reference rejected: {reference!r}")

    response = requests.get(
        f"{PAYSTACK_BASE}/transaction/verify/{reference}",
        headers=_headers(),
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def cancel_subscription(subscription_code, email_token):
    """
    Disable a Paystack recurring subscription (Phase 2).

    subscription_code — SUB_xxx from Paystack (stored on Subscription model)
    email_token       — the email token Paystack issues with the subscription
                        (stored on Subscription model as paystack_email_token)

    Returns the full Paystack response dict.
    """
    response = requests.post(
        f"{PAYSTACK_BASE}/subscription/disable",
        json={"code": subscription_code, "token": email_token},
        headers=_headers(),
        timeout=15,
    )
    response.raise_for_status()
    return response.json()
