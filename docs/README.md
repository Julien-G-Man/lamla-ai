# Lamla AI Documentation

This folder is the maintained source of truth for architecture, setup, features, security, and deployment.

## Read In This Order

1. `setup-configuration/GETTING_STARTED.md`
2. `setup-configuration/QUICK_REFERENCE.md`
3. `architecture-design/ARCHITECTURE.md`
4. `frontend/ROUTES_AND_PAGES.md`

## Core Docs

- `architecture-design/ARCHITECTURE.md` - system components and request flow
- `architecture-design/FRONTEND_INTEGRATION.md` - React to Django/FastAPI contracts
- `setup-configuration/GETTING_STARTED.md` - local environment setup
- `setup-configuration/QUICK_REFERENCE.md` - high-signal env vars and common endpoints
- `setup-configuration/AUTHENTICATION_SETUP.md` - auth integration setup (password + Google OAuth)
- `authentication/CUSTOM_USER_MODEL.md` - user model behavior and admin flag
- `authentication/EMAIL_VERIFICATION.md` - verification flow and API
- `authentication/GOOGLE_OAUTH.md` - **Google OAuth 2.0 integration guide (setup, testing, security)**
- `features/QUIZ.md` - quiz generation and quiz lifecycle
- `features/FLASHCARDS.md` - flashcards feature and API behavior
- `features/CHATBOT.md` - AI tutor/chat feature
- `frontend/ROUTES_AND_PAGES.md` - current route ownership and aliases
- `deployment-guides/DEPLOYMENT_CHECKLIST.md` - deploy preflight checklist
- `deployment-guides/RENDER_DEPLOYMENT_GUIDE.md` - backend deployment specifics
- `deployment-guides/VERCEL_FRONTEND_DEPLOYMENT.md` - frontend deployment specifics
- `security-reference/SECURITY.md` - security controls and rules

## Documentation Rules

- Keep docs aligned with code changes in the same PR.
- Remove temporary migration notes and one-off status reports.
- Prefer one canonical doc per topic; avoid near-duplicates.
- All Django API routes are rooted at `/api/` unless noted otherwise.
