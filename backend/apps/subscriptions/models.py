from django.conf import settings
from django.db import models


class Donation(models.Model):
    STATUS_PENDING = "pending"
    STATUS_SUCCESS = "success"
    STATUS_FAILED  = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED,  "Failed"),
    ]

    # Nullable: allow anonymous donations
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="donations",
    )
    amount    = models.DecimalField(max_digits=10, decimal_places=2)  # GHS
    reference = models.CharField(max_length=100, unique=True)          # Paystack ref
    status    = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    email     = models.EmailField()
    paid_at   = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Donation {self.reference} — {self.status} — {self.amount} GHS"


class Subscription(models.Model):
    """
    Every user has exactly one Subscription row (auto-created via signal).
    Phase 1: plan is always 'free'. Phase 2 upgrades it to 'pro' and adds
    the Paystack-specific fields via a migration.
    """
    PLAN_FREE = "free"
    PLAN_PRO  = "pro"
    PLAN_CHOICES = [
        (PLAN_FREE, "Free"),
        (PLAN_PRO,  "Pro"),
    ]

    STATUS_ACTIVE    = "active"
    STATUS_CANCELLED = "cancelled"
    STATUS_PAST_DUE  = "past_due"
    STATUS_EXPIRED   = "expired"
    STATUS_CHOICES = [
        (STATUS_ACTIVE,    "Active"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_PAST_DUE,  "Past Due"),
        (STATUS_EXPIRED,   "Expired"),
    ]

    user   = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
    )
    plan   = models.CharField(max_length=10, choices=PLAN_CHOICES, default=PLAN_FREE)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

    # Phase 2 fields — added via migration when subscriptions ship:
    #   paystack_customer_code     CharField
    #   paystack_subscription_code CharField
    #   paystack_email_token       CharField
    #   current_period_start       DateTimeField
    #   current_period_end         DateTimeField
    #   cancelled_at               DateTimeField (nullable)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.plan} ({self.status})"

    @property
    def is_pro(self):
        return self.plan == self.PLAN_PRO and self.status == self.STATUS_ACTIVE


class PaymentHistory(models.Model):
    """
    Immutable audit trail for every payment event — donations and subscriptions.
    Never delete rows from this table.
    """
    TYPE_DONATION     = "donation"
    TYPE_SUBSCRIPTION = "subscription"
    TYPE_CHOICES = [
        (TYPE_DONATION,     "Donation"),
        (TYPE_SUBSCRIPTION, "Subscription"),
    ]

    STATUS_SUCCESS  = "success"
    STATUS_FAILED   = "failed"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_SUCCESS,  "Success"),
        (STATUS_FAILED,   "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    # Nullable: anonymous donations have no user
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="payment_history",
    )
    amount    = models.DecimalField(max_digits=10, decimal_places=2)
    currency  = models.CharField(max_length=5, default="GHS")
    reference = models.CharField(max_length=100, unique=True)  # Paystack reference
    type      = models.CharField(max_length=14, choices=TYPE_CHOICES)
    status    = models.CharField(max_length=10, choices=STATUS_CHOICES)
    paid_at   = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering  = ["-created_at"]
        verbose_name_plural = "Payment history"

    def __str__(self):
        return f"{self.type} {self.reference} — {self.status} — {self.amount} GHS"
