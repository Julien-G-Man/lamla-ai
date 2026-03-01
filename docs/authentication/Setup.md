# Email Verification — Setup Checklist

## 1. Django migration
```bash
python manage.py makemigrations accounts
python manage.py migrate
```
Three new fields land on the User table: `is_email_verified`, `email_verified_at`, `last_login_ip`.

## 2. settings.py additions
```python
# Email backend — swap for SMTP in production
EMAIL_BACKEND   = "django.core.mail.backends.console.EmailBackend"  # dev
# EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"      # prod

DEFAULT_FROM_EMAIL = "Lamla AI <noreply@lamla.ai>"
SITE_NAME          = "Lamla AI"

# React app URL — used to build the verification link
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
```

## 3. Template directory
Make sure Django can find the email templates. In settings.py:
```python
TEMPLATES = [
    {
        ...
        "DIRS": [BASE_DIR / "templates"],   # or wherever your templates root is
        ...
    }
]
```
Place the templates at:
```
templates/
  accounts/
    emails/
      verification_email.txt
      verification_email.html
```

## 4. SMTP settings for production (example — any provider works)
```python
EMAIL_BACKEND       = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST          = os.getenv("EMAIL_HOST")          # e.g. smtp.sendgrid.net
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
```

## 5. React file locations
- `src/pages/VerifyEmail/VerifyEmail.jsx`  (new)
- `src/pages/VerifyEmail/VerifyEmail.css`  (new)
- `src/pages/Signup/Signup.jsx`            (updated — username field)
- `src/context/AuthContext.jsx`            (updated — markEmailVerified, resendVerificationEmail)
- `src/services/auth.js`                   (updated — verifyEmail, resendVerificationEmail)
- `src/App.jsx`                            (updated — /verify-email route)

## 6. Verification banner
Add this wherever you want the banner to appear (e.g. Dashboard layout):

```jsx
const { isAuthenticated, isEmailVerified, resendVerificationEmail } = useAuth();
const [sent, setSent] = useState(false);

{isAuthenticated && !isEmailVerified && (
  <div className="verify-banner">
    Please verify your email address.{' '}
    {sent
      ? 'Email sent — check your inbox.'
      : <button onClick={() => resendVerificationEmail().then(() => setSent(true))}>Resend email</button>
    }
  </div>
)}
```

## 7. Token expiry note
`default_token_generator` tokens expire after `PASSWORD_RESET_TIMEOUT` seconds
(default: 259200 = 3 days). To change it:
```python
PASSWORD_RESET_TIMEOUT = 86400  # 24 hours
```