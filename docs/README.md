# Documentation Hub 📚

Welcome to the Lamla AI comprehensive documentation repository. This directory contains all project documentation organized by category and use case.

## 📋 Directory Structure

### 🚀 [setup-configuration/](setup-configuration/)
Setup procedures, configuration guides, quick start documentation, and authentication setup.

**Contents:**
- `GETTING_STARTED.md` - Getting started guide with Django & FastAPI setup
- `QUICK_REFERENCE.md` - Quick reference for common tasks
- `QUICK_TEST_GUIDE.md` - Quick testing procedures
- `SETUP_POSTGRES_USAGE.md` - PostgreSQL setup and usage
- `AUTHENTICATION_SETUP.md` - Email verification, auth flows, and API endpoints
- `UI_COMPONENTS_DASHBOARD.md` - Dashboard layout and component architecture

**Best For:** Setting up the development environment, initial configuration, authentication, and UI components.

---

### 🏗️ [architecture-design/](architecture-design/)
System architecture, design patterns, and frontend-backend integration documentation.

**Contents:**
- `ARCHITECTURE.md` - Complete system architecture overview
- `FRONTEND_INTEGRATION.md` - Frontend-backend integration guide

**Best For:** Understanding system design, component relationships, and integration points.

---

### 🔐 [authentication/](authentication/)
Complete authentication system documentation, user models, and email verification.

**Contents:**
- `AUTHENTICATION_SETUP.md` - Consolidated auth setup with email verification flow
- `EMAIL_VERIFICATION.md` - Email verification system details
- `CUSTOM_USER_MODEL.md` - Custom User model implementation and usage

**Best For:** Understanding authentication architecture, email verification, custom user model, and security practices.

---

### ✨ [features/](features/)
Feature-specific documentation for major system components.

**Contents:**
- `QUIZ.md` - Quiz generation, session management, and timer implementation
- `FLASHCARDS.md` - Flashcard feature documentation
- `CHATBOT.md` - AI chatbot integration and features

**Best For:** Understanding individual feature architecture, APIs, and usage patterns.

---

### 🌐 [frontend/](frontend/)
Frontend architecture, routing, and React component documentation.

**Contents:**
- `ROUTES_AND_PAGES.md` - React routes, page structure, and navigation

**Best For:** Understanding frontend architecture and component organization.

---

### ⏱️ [timer-fixes/](timer-fixes/)
Detailed documentation of timer bug identification, fixes, and validation.

**Contents:**
- `QUIZ_TIMER_EXEC_SUMMARY.md` - Executive summary of timer fixes
- `QUIZ_TIMER_FIX_COMPLETE.md` - Complete fix implementation and details

**Best For:** Understanding the timer bug, how it was fixed, and how to verify the fix.

---

### 📅 [changelogs/](changelogs/)
Development changelog and version history.

**Contents:**
- `MARCH_2026_AUTH_OVERHAUL.md` - Auth system redesign (March 2026)

**Best For:** Understanding what changed and when, and tracking feature implementation history.

---

### 🚀 [deployment-guides/](deployment-guides/)
Deployment procedures, checklists, and environment configuration.

**Contents:**
- `DEPLOYMENT_CHECKLIST.md` - Complete deployment checklist

**Related Info:**
- Backend: Render (Django + FastAPI on separate servers)
- Frontend: Already deployed on Vercel

**Best For:** Deployment verification, environment setup, and production readiness checks.

---

### 🐛 [bug-fixes/](bug-fixes/)
Documentation of identified bugs and their resolutions.

**Contents:**
- `AZURE_SAFETY_BLOCK_FIX.md` - Azure safety content filter fix
- `CONVERSATION_SAVE_FIXES.md` - Conversation persistence fixes
- `FILE_UPLOAD_CONTENT_FILTER_FIX.md` - File upload content filtering
- `FIXES_SUMMARY.md` - Summary of all fixes

**Best For:** Understanding past issues, how they were resolved, and preventing regressions.

---

### 🔒 [security-reference/](security-reference/)
Security best practices, authentication, and data protection documentation.

**Contents:**
- `SECURITY.md` - Security guidelines and best practices

**Best For:** Security considerations, authentication flows, and data protection.

---

### 🎨 [ui-styling/](ui-styling/)
UI/UX documentation, styling guidelines, and design implementation.

**Contents:**
- `QUIZ_UI_SESSION_SUMMARY.md` - UI styling session summary
- `QUIZ_UI_STYLING_COMPLETE.md` - Complete styling implementation
- `QUIZ_STYLING_QUICK_REFERENCE.md` - Quick reference for styling

**Best For:** Understanding UI styling, CSS structure, and design system.

---

## 🌐 Deployment Architecture

### Frontend
- **Platform:** Vercel
- **Status:** Already deployed
- **Tech Stack:** React, Node.js
- **Location:** `/frontend`

### Backend - Django Server
- **Platform:** Render
- **Role:** Main backend API
- **Tech Stack:** Django, Python
- **Location:** `/backend`
- **Port:** As configured in Render

### Backend - FastAPI Server
- **Platform:** Render (separate server)
- **Role:** Async API services
- **Tech Stack:** FastAPI, Python, AsyncIO
- **Location:** `/backend/fastapi_service`
- **Port:** As configured in Render

---

## 📖 Quick Navigation

### For First-Time Setup
1. Start with [setup-configuration/GETTING_STARTED.md](setup-configuration/GETTING_STARTED.md)
2. Review [setup-configuration/QUICK_REFERENCE.md](setup-configuration/QUICK_REFERENCE.md)
3. Check [authentication/AUTHENTICATION_SETUP.md](authentication/AUTHENTICATION_SETUP.md)
4. Review [security-reference/SECURITY.md](security-reference/SECURITY.md)

### For Feature Understanding
1. Read [architecture-design/ARCHITECTURE.md](architecture-design/ARCHITECTURE.md)
2. Review [features/QUIZ.md](features/QUIZ.md) for quiz feature
3. Check [architecture-design/FRONTEND_INTEGRATION.md](architecture-design/FRONTEND_INTEGRATION.md)

### For Quiz Module
1. Start with [features/QUIZ.md](features/QUIZ.md)
2. Review timer docs: [timer-fixes/QUIZ_TIMER_EXEC_SUMMARY.md](timer-fixes/QUIZ_TIMER_EXEC_SUMMARY.md)
3. Check styling: [ui-styling/QUIZ_UI_STYLING_COMPLETE.md](ui-styling/QUIZ_UI_STYLING_COMPLETE.md)

### For Authentication
1. Read [authentication/AUTHENTICATION_SETUP.md](authentication/AUTHENTICATION_SETUP.md)
2. Review [authentication/CUSTOM_USER_MODEL.md](authentication/CUSTOM_USER_MODEL.md)
3. Check [authentication/EMAIL_VERIFICATION.md](authentication/EMAIL_VERIFICATION.md)

### For Deployment
1. Review [architecture-design/ARCHITECTURE.md](architecture-design/ARCHITECTURE.md)
2. Check [deployment-guides/DEPLOYMENT_CHECKLIST.md](deployment-guides/DEPLOYMENT_CHECKLIST.md)
3. Follow deployment procedures for each service

### For Bug Fixes & Troubleshooting
1. Check [bug-fixes/FIXES_SUMMARY.md](bug-fixes/FIXES_SUMMARY.md)
2. Review specific fix documentation
3. Test with appropriate test guides

---

## 🔍 Finding What You Need

| Need | Start Here |
|------|-----------|
| Setting up dev environment | `setup-configuration/GETTING_STARTED.md` |
| Understanding authentication | `authentication/AUTHENTICATION_SETUP.md` |
| Understanding Quiz feature | `features/QUIZ.md` |
| Understanding Timer fixes | `timer-fixes/QUIZ_TIMER_EXEC_SUMMARY.md` |
| System Architecture | `architecture-design/ARCHITECTURE.md` |
| Deployment Setup | `deployment-guides/DEPLOYMENT_CHECKLIST.md` |
| UI/Design System | `ui-styling/QUIZ_STYLING_QUICK_REFERENCE.md` |
| Security guidelines | `security-reference/SECURITY.md` |
| Bug history | `bug-fixes/FIXES_SUMMARY.md` |
| Flashcards feature | `features/FLASHCARDS.md` |
| Chatbot feature | `features/CHATBOT.md` |
| Frontend routing | `frontend/ROUTES_AND_PAGES.md` |

---

## 📞 Support & Questions

Each documentation file contains detailed information about its specific topic. If you need clarification:

1. **Check the specific folder README** (index documentation)
2. **Review the quick reference guides** for your topic
3. **Check ARCHITECTURE.md** for system-level questions
4. **Refer to DEPLOYMENT_CHECKLIST.md** for deployment issues
5. **Check CUSTOM_USER_MODEL.md** for authentication questions

---

## 📅 Documentation Updates

- **March 2026:** Auth system redesign (custom user model, email verification)
- **January 2026:** Initial documentation structure and timer fixes

---

## 📦 Documentation Organization

This documentation directory structure is organized by:
- **Topic/Category** (setup, architecture, features, deployment)
- **Use Case** (first-time setup, feature understanding, troubleshooting)
- **Audience** (developers, DevOps, project managers)

No redundancy — each file has a single, focused purpose. Outdated and duplicate files have been consolidated or removed.

---

**Happy coding! 🚀**
