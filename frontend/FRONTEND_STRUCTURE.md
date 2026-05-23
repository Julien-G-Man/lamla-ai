# Lamla AI — Frontend Structure

> **Updated:** 2026-05-23
> **Framework:** React 19.2.3 + Vite 6.3.5
> **Deployment:** Vercel

---

## 1. Root Files

```
frontend/
├── index.html                 # Vite HTML entry point (root-level, not in public/)
├── vite.config.js             # Vite config — React plugin, @ path alias, VITE_ env prefix
├── package.json               # Dependencies & scripts
├── package-lock.json          # Lockfile
├── .env.development           # Dev env vars (VITE_* prefix)
├── .env.example               # Env template for new contributors
├── vercel.json                # Vercel SPA rewrite rules
├── public/                    # Static assets — served as-is at /
│   ├── favicon.ico
│   ├── manifest.json          # PWA manifest
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── googlef82bec8c5ad249a7.html  # Google Search Console verification
│   └── assets/                # Images referenced by CSS / JSX
│       ├── lamla_logo.png
│       ├── og-image.png            (1200×630, Open Graph)
│       ├── og-image-square.png     (600×600)
│       ├── ai-tutor.jpg
│       ├── ai_teaching.jpg
│       ├── developer.jpg / .webp
│       ├── discussion.jpg
│       ├── flashcards.jpeg
│       ├── graduation-cap.jpg
│       ├── highfive-with-teacher.jpg
│       ├── improve-performance.jpg
│       ├── incognito.png
│       ├── not-found.jpg / .webp
│       ├── not-found2.jpg / .webp
│       ├── profile_default.png
│       ├── profile_default2.png
│       ├── quizzes.jpg
│       ├── steam.jpg
│       ├── student.jpeg
│       ├── student_desk.webp
│       └── uni_exams.jpg
└── src/
    ├── index.jsx              # React 19 entry (ReactDOM.createRoot)
    ├── index.css              # Minimal global reset
    ├── App.jsx                # Root — routing + context providers + warmup pings
    └── App.css                # Design tokens (:root), global resets, AppShell layout
```

> **Build output:** `dist/` (Vite). The legacy `build/` directory from CRA is dead and should be deleted.

---

## 2. Source Code Structure (`src/`)

```
src/
├── context/
│   ├── AuthContext.jsx        # Auth state, token, user object
│   └── ThemeContext.jsx       # Light/dark theme — default light; data-theme on <html>
│
├── services/                  # API abstraction — nothing else calls fetch/axios directly
│   ├── api.js                 # Axios instance (Django), interceptors, 10-min warmup ping
│   ├── auth.js                # Auth endpoints (login, signup, Google, verify, password)
│   ├── dashboard.js           # Dashboard + admin endpoints
│   ├── materials.js           # Materials CRUD + extract-for-quiz
│   ├── emailService.js        # EmailJS contact form
│   └── payments.js            # Paystack donation flow
│
├── components/
│   ├── AppShell/
│   │   ├── AppShell.jsx       # Authenticated layout — 240px sidebar (desktop) + bottom tab (mobile)
│   │   └── AppShell.css
│   ├── Navbar.jsx             # Top navbar — used by public pages + standalone Chatbot
│   ├── Footer.jsx             # Footer — public pages only
│   ├── GoogleSignInButton.jsx
│   ├── GoogleSignInButton.css
│   └── sidebar/               # ⚠️ LEGACY — superseded by AppShell. Scheduled for deletion.
│       ├── Sidebar.jsx
│       └── Sidebar.css
│
├── utils/
│   ├── richTextRenderer.jsx   # Markdown + KaTeX renderer for chat/quiz content
│   └── richText.css
│
└── pages/
    ├── Home/
    │   ├── Home.jsx
    │   └── Home.css
    ├── Auth/
    │   ├── VerifyEmail.jsx
    │   ├── VerifyEmail.css
    │   ├── ForgotPassword.jsx  # Password reset request form
    │   └── ResetPassword.jsx   # Password reset confirmation (token from email)
    ├── Login/
    │   ├── Login.jsx
    │   ├── Login.css           # Shared by Login + Signup (auth page layout)
    │   └── GoogleAuth.css
    ├── Signup/
    │   ├── Signup.jsx
    │   └── Signup.css
    ├── Dashboards/
    │   ├── Dashboard.jsx
    │   ├── Dashboard.css
    │   ├── AdminDashboard.jsx
    │   ├── AdminDashboard.css
    │   ├── AdminUserDetails.jsx
    │   ├── AdminUserDetails.css
    │   ├── AdminActivity.jsx
    │   ├── AdminRatings.jsx
    │   └── dashboard-shared.css
    ├── Quiz/
    │   ├── CreateQuiz.jsx
    │   ├── CreateQuiz.css
    │   ├── Quiz.jsx
    │   ├── Quiz.css
    │   ├── QuizHistory.jsx
    │   ├── QuizResults.jsx
    │   └── QuizResults.css
    ├── Flashcards/
    │   ├── FlashcardDecks.jsx
    │   ├── FlashcardCreate.jsx
    │   ├── FlashcardDeck.jsx
    │   ├── FlashcardStudy.jsx
    │   └── Flashcards.css
    ├── Chatbot/
    │   ├── Chatbot.jsx         # Standalone page (own Navbar, not in AppShell)
    │   ├── Chatbot.css
    │   ├── Sidebar.jsx         # Chatbot session history sidebar
    │   └── Sidebar.css
    ├── Materials/
    │   ├── Materials.jsx       # Community materials library (/materials/community)
    │   ├── CommunityMaterials.jsx
    │   ├── MyMaterials.jsx     # User's own uploads (/materials/mine)
    │   ├── MaterialUpload.jsx
    │   └── Materials.css
    ├── UserProfile/
    │   ├── Profile.jsx
    │   └── Profile.css
    ├── About/
    │   ├── About.jsx           # ⚠️ Page exists but is NOT routed in App.jsx
    │   └── About.css
    ├── Donate/
    │   ├── Donate.jsx
    │   ├── Donate.css
    │   ├── DonateThankyou.jsx
    │   └── DonateThankyou.css
    ├── LeaderBoard/            # ⚠️ WIP — exists but not routed
    └── NotFound/
        └── NotFound.jsx
```

---

## 3. Routing (`App.jsx`)

See `docs/frontend/ROUTES_AND_PAGES.md` for the full route table with access rules.

### Summary

| Scope | Routes |
|---|---|
| Public | `/`, `/auth/login`, `/auth/signup`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password` |
| Authenticated | `/dashboard`, `/profile`, `/quiz/*`, `/flashcards/*`, `/materials/*`, `/ai-tutor` |
| Admin | `/admin-dashboard`, `/admin-dashboard/user/:id`, `/admin-dashboard/activity`, `/admin-dashboard/ratings` |
| Open | `/donate`, `/donate/thank-you` |
| Redirects | `/auth` → login, `/login` → login, `/signup` → signup, `/ai` → `/ai-tutor`, `/materials` → `/materials/community` |

---

## 4. Layout System

### AppShell (authenticated pages)
All authenticated pages (`Dashboard`, `Quiz`, `Flashcards`, `Materials`, `Profile`, admin pages) render inside `<AppShell>` which provides:
- **Desktop ≥1024px:** fixed 240px left sidebar with nav links, user section, logout
- **Mobile <1024px:** full-width content + fixed bottom tab bar (5 items)

### Standalone (public + chatbot)
`Home`, `Login`, `Signup`, auth pages, `Donate`, and **`Chatbot`** render with their own `<Navbar>`. Chatbot is standalone because it has its own full-height layout with a session sidebar.

---

## 5. Design System

All tokens live in `App.css` `:root`. **No component should hardcode colors, font sizes, or spacing.**

```css
/* Brand */
--primary-color:   #2563EB   /* blue-600 */
--primary-dark:    #1d4ed8
--primary-light:   #eff6ff

/* Surfaces */
--background-dark: #ffffff   /* page background (light-only) */
--background-gray: #f8fafc
--surface:         #ffffff
--border:          #e2e8f0

/* Text */
--text-primary:    #0f172a
--text-secondary:  #475569
--text-muted:      #94a3b8

/* Semantic */
--color-success: #16a34a    --color-danger:  #dc2626
--color-warning: #d97706    --color-info:    #2563eb
```

**Theme:** Light-only by default (`data-theme="light"` always set). Dark mode CSS vars exist but the UI ships light.

---

## 6. State Management

### `AuthContext.jsx`
- **State:** `user`, `isLoading`, `isAuthenticated`, `isEmailVerified`
- **Key methods:** `login()`, `signup()`, `googleAuth()`, `logout()`, `updateProfile()`, `uploadProfileImage()`, `changePassword()`
- **Storage:** `localStorage` (token + user object)

### `ThemeContext.jsx`
- **State:** `theme` (`"light"` | `"dark"`) — default `"light"`
- **Method:** `toggleTheme()`
- **Effect:** writes `data-theme` attribute to `<html>`

---

## 7. API Services

### `api.js`
- Axios instance targeting Django REST API
- Base URL: `VITE_DJANGO_API_URL` (env var)
- Request interceptor: injects `Authorization: Token <token>` on every request
- Warmup: pings Django + FastAPI on mount and every 10 min

### Environment Variables
All use `VITE_` prefix (Vite requirement):

| Variable | Description |
|---|---|
| `VITE_DJANGO_API_URL` | Django REST API base URL |
| `VITE_FASTAPI_URL` | FastAPI AI service base URL |

---

## 8. Technology Stack

| Category | Package | Version |
|---|---|---|
| **Core** | React | 19.2.3 |
| | React Router DOM | 6.30.2 |
| | Axios | 1.13.2 |
| **Build** | Vite | 6.3.5 |
| | @vitejs/plugin-react | 4.3.4 |
| **Auth** | @react-oauth/google | 0.12.2 |
| **Rendering** | react-markdown | 10.1.0 |
| | katex | 0.16.38 |
| | react-katex | 3.1.0 |
| | remark-gfm / remark-math | latest |
| | rehype-katex / rehype-raw | 7.x |
| **Icons** | @fortawesome/react-fontawesome | 3.1.1 |
| **Email** | @emailjs/browser | 4.4.1 |
| **Styling** | Plain CSS (component-scoped) | — |
| **Deploy** | Vercel | — |

---

## 9. Known Legacy / Scheduled Deletions

| File/Dir | Status |
|---|---|
| `frontend/build/` | CRA output — dead. Vite outputs to `dist/` |
| `src/reportWebVitals.js` | CRA-only — dead |
| `src/service-worker.js` + `serviceWorkerRegistration.js` | CRA Workbox — dead |
| `src/setupTests.js` + `src/App.test.js` | CRA Jest boilerplate — dead |
| `public/index.html` | Old CRA HTML shell — dead (root `index.html` is now the entry) |
| `public/Quiz_Results_Random_Stuff.pdf` | Test artifact — delete |
| `src/components/sidebar/Sidebar.jsx` + `Sidebar.css` | Superseded by AppShell |
| `pages/LeaderBoard/` | Unrouted WIP |
| `pages/About/` | Page built, not routed |
