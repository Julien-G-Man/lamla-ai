# Email Verification System

## Quick Overview

The email verification system allows users to:
1. **Register immediately** with any email
2. **Access basic features** without verification (dashboard, profile)
3. **Unlock full features** (AI tools, quiz, flashcards) after verifying email
4. **Resend verification emails** if they miss the original

## Email Flow

```
User Registration
     ↓
Account created (is_email_verified = False)
     ↓
Verification email sent
     ↓
User clicks link or enters token
     ↓
Email verified (is_email_verified = True)
     ↓
Full platform access
```

## Django Setup

### 1. Database Fields
The `User` model includes:
- `is_email_verified` — Boolean flag
- `email_verified_at` — DateTime of verification

Run migrations:
```bash
python manage.py makemigrations accounts
python manage.py migrate
```

### 2. Email Backend Configuration
In `settings.py`:
```python
# Development — emails print to console
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Production — use Resend or other SMTP
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
```

### 3. Email Provider Setup
**For Resend (recommended for production):**
```python
import resend

resend.api_key = settings.RESEND_API_KEY
resend.Emails.send({
    "from": settings.DEFAULT_FROM_EMAIL,
    "to": [user.email],
    "subject": "Verify your email",
    "html": html_content,
})
```

**For SMTP (any provider):**
```python
EMAIL_HOST = "smtp.sendgrid.net"  # example
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
```

## Frontend Integration

### React Route
```jsx
<Route path="/verify-email" element={<VerifyEmail />} />
```

### Verification Page
Create `src/pages/VerifyEmail/VerifyEmail.jsx`:
- Takes verification token from URL query parameter
- Calls `/api/auth/verify-email/` endpoint
- Shows success/error message
- Redirects to dashboard on success

### Auth Context
Update `AuthContext` with:
```jsx
const [isEmailVerified, setIsEmailVerified] = useState(false);

const verifyEmail = async (token) => {
  const response = await fetch('/api/auth/verify-email/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (response.ok) {
    setIsEmailVerified(true);
  }
  return response;
};

const resendVerificationEmail = async () => {
  return fetch('/api/auth/resend-verification/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
};
```

### Verification Banner
Show in Dashboard when user is logged in but not verified:
```jsx
{isAuthenticated && !isEmailVerified && (
  <div className="verify-banner">
    <p>Please verify your email to unlock all features.</p>
    <button onClick={resendVerificationEmail}>
      Resend verification email
    </button>
  </div>
)}
```

## API Endpoints

### POST `/api/auth/verify-email/`
Verify email with a token.

**Request:**
```json
{
  "token": "abc123..."
}
```

**Response (Success 200):**
```json
{
  "detail": "Email verified successfully"
}
```

**Response (Error 400):**
```json
{
  "error": "Invalid or expired token"
}
```

### POST `/api/auth/resend-verification/`
Resend verification email to current user.

**Auth:** Required (Bearer token)

**Response (Success 200):**
```json
{
  "detail": "Verification email sent"
}
```

**Response (Error 429):**
```json
{
  "error": "Too many requests. Try again later."
}
```

## Feature Access Control

| Feature | Unverified | Verified |
|---------|-----------|----------|
| Register | ✅ | ✅ |
| Login | ✅ | ✅ |
| Profile | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| AI Chat | ❌ | ✅ |
| Quiz Generation | ❌ | ✅ |
| Flashcards | ❌ | ✅ |
| API Access | ❌ | ✅ |

## Token Expiry

Verification tokens expire after `PASSWORD_RESET_TIMEOUT` seconds (default: 3 days).

To change in `settings.py`:
```python
PASSWORD_RESET_TIMEOUT = 86400  # 24 hours
```

## Email Template Example

**File:** `templates/accounts/emails/verification_email.html`

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Verify Your Email</h1>
    <p>Welcome to Lamla AI! Please verify your email to access all features.</p>
    
    <a href="{{ verification_link }}" class="button">Verify Email</a>
    
    <p>Or paste this link in your browser:</p>
    <p>{{ verification_link }}</p>
    
    <p>This link expires in 3 days.</p>
    
    <p>Questions? Contact support@lamla.ai</p>
</body>
</html>
```

## Troubleshooting

### Email not arriving
- Check Django logs for errors
- Verify email backend is correctly configured
- Check spam folder
- Verify `DEFAULT_FROM_EMAIL` is valid
- For Resend, verify API key is correct

### Verification link not working
- Check token hasn't expired (3 days default)
- Ensure URL is correctly formatted
- Verify token matches database
- Check frontend is sending token correctly

### User can't resend email
- Verify user is authenticated (has valid token)
- Check rate limiting isn't blocking (optional feature)
- Ensure email backend is running

## Best Practices

1. **Always verify in production** — At minimum, it prevents typo emails
2. **Send immediately** — Don't wait, send email after signup
3. **Show progress** — Tell user email was sent and where to look
4. **Allow resends** — Users lose emails, make resending easy
5. **Handle failures gracefully** — Show helpful error messages
6. **Test in development** — Check emails print to console output
