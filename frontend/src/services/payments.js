import djangoApi from "./api";

// ── Donations ─────────────────────────────────────────────────────────────────

export const initiateDonation = ({ amount, email }) =>
  djangoApi.post("/subscriptions/donate/initiate/", { amount, email });

export const verifyDonation = (reference) =>
  djangoApi.get("/subscriptions/donate/verify/", { params: { reference } });

// ── Subscriptions (Phase 2) ───────────────────────────────────────────────────
// Uncomment and implement when Phase 2 ships.

// export const initiateSubscription = () =>
//   djangoApi.post("/subscriptions/initiate/");

// export const verifySubscription = (reference) =>
//   djangoApi.get("/subscriptions/verify/", { params: { reference } });

// export const getSubscriptionStatus = () =>
//   djangoApi.get("/subscriptions/status/");

// export const cancelSubscription = () =>
//   djangoApi.post("/subscriptions/cancel/");

// export const getPaymentHistory = () =>
//   djangoApi.get("/subscriptions/history/");
