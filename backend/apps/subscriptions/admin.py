from django.contrib import admin
from .models import Donation, Subscription, PaymentHistory


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display   = ("reference", "email", "amount", "status", "paid_at", "created_at")
    list_filter    = ("status",)
    search_fields  = ("reference", "email", "user__username", "user__email")
    readonly_fields = ("reference", "created_at", "paid_at")
    ordering       = ("-created_at",)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display  = ("user", "plan", "status", "created_at", "updated_at")
    list_filter   = ("plan", "status")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("created_at", "updated_at")
    ordering      = ("-created_at",)


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display   = ("reference", "type", "amount", "status", "paid_at", "created_at")
    list_filter    = ("type", "status")
    search_fields  = ("reference", "user__username", "user__email")
    readonly_fields = ("reference", "created_at", "paid_at")
    ordering       = ("-created_at",)

    def has_delete_permission(self, request, obj=None):
        # Enforce the rule: payment history is never deleted
        return False
