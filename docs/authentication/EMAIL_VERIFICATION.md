# Email Verification

## Endpoints

- `POST /api/auth/verify-email/`
- `POST /api/auth/resend-verification/`

## Typical Flow

1. User signs up.
2. Account starts unverified.
3. Verification email is sent.
4. User verifies via token endpoint.
5. `is_email_verified` is set true.

## Frontend Route

- Verification page route: `/auth/verify-email`

## Operational Notes

- Keep email delivery credentials on backend only.
- In development, console backend may be used to inspect outgoing mail.
