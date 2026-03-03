# Frontend Routes & Pages Documentation

## Route Structure

The React frontend uses the **React Router** (v6) with the following route structure:

### Authentication Routes

| Path | Component | Auth Required | Purpose |
|------|-----------|---|---------|
| `/auth/login` | `Login.jsx` | ❌ No | User login |
| `/auth/signup` | `Signup.jsx` | ❌ No | User registration |
| `/login` | Redirect | ❌ No | Legacy redirect to `/auth/login` |
| `/signup` | Redirect | ❌ No | Legacy redirect to `/auth/signup` |

### Protected Routes

| Path | Component | Auth Required | Email Verified | Purpose |
|------|-----------|---|---|---------|
| `/dashboard` | `Dashboard.jsx` | ✅ Yes | ❌ No | User learning dashboard |
| `/admin-dashboard` | `AdminDashboard.jsx` | ✅ Yes | ❌ No | Admin panel (admin only) |
| `/profile` | `Profile.jsx` | ✅ Yes | ❌ No | User profile & settings |
| `/verify-email` | `VerifyEmail.jsx` | ✅ Yes | ❌ No | Email verification page |
| `/quiz` | `Quiz.jsx` | ✅ Yes | ✅ **Yes** | Quiz generator & interface |
| `/flashcards` | `Flashcards.jsx` | ✅ Yes | ✅ **Yes** | Flashcard decks |
| `/chat` | `Chat.jsx` | ✅ Yes | ✅ **Yes** | AI chatbot |

### Public Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Home.jsx` | Landing page |
| `/about` | `About.jsx` | About page |
| `/contact` | `Contact.jsx` | Contact form |
| `*` | `NotFound.jsx` | 404 page |

## Component Hierarchy

```
App.jsx
├── Navbar.jsx (visible on all pages)
├── ThemeToggle.jsx (light/dark mode)
└── Routes
    ├── Public Routes
    │   ├── Home.jsx
    │   ├── About.jsx
    │   └── Contact.jsx
    ├── Auth Routes (no auth required)
    │   ├── Login.jsx
    │   │   ├── Login.css (shared with Signup)
    │   │   └── Components
    │   │       ├── BrandPanel.jsx
    │   │       ├── FormPanel.jsx
    │   │       └── ErrorBanner.jsx
    │   └── Signup.jsx
    │       ├── Signup.css (imports Login.css)
    │       └── ProgressSteps.jsx
    └── Protected Routes (auth required)
        ├── Dashboard.jsx
        │   ├── dashboard-shared.css
        │   ├── Sidebar.jsx
        │   └── DashboardContent.jsx
        ├── AdminDashboard.jsx
        │   ├── AdminDashboard.css
        │   ├── Sidebar.jsx (variant="admin")
        │   └── AdminContent.jsx
        ├── Profile.jsx
        │   ├── Profile.css
        │   ├── ProfileCard.jsx
        │   ├── ProfileForm.jsx
        │   └── ImageUpload.jsx
        ├── VerifyEmail.jsx
        │   └── VerifyEmail.css
        ├── Quiz.jsx (email verified only)
        │   ├── Quiz.css
        │   ├── QuizGenerator.jsx
        │   ├── QuizSession.jsx (with Timer)
        │   ├── QuizResults.jsx
        │   └── QuizHistory.jsx
        ├── Flashcards.jsx (email verified only)
        │   ├── Flashcards.css
        │   ├── DeckList.jsx
        │   ├── DeckEditor.jsx
        │   ├── StudyMode.jsx
        │   └── CardReview.jsx
        └── Chat.jsx (email verified only)
            ├── Chat.css
            ├── ChatWindow.jsx
            ├── MessageList.jsx
            ├── ChatInput.jsx
            ├── FileUpload.jsx
            └── ConversationHistory.jsx
```

## File Structure

```
frontend/
├── src/
│   ├── App.jsx                     # Main routing & layout
│   ├── index.js                    # React entry point
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── NotFound.jsx
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   ├── Signup.jsx
│   │   │   └── Signup.css
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.css
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminDashboard.css
│   │   │   ├── dashboard-shared.css
│   │   │   └── [components]
│   │   ├── UserProfile/
│   │   │   ├── Profile.jsx
│   │   │   ├── Profile.css
│   │   │   └── [components]
│   │   ├── VerifyEmail/
│   │   │   ├── VerifyEmail.jsx
│   │   │   └── VerifyEmail.css
│   │   ├── Quiz/
│   │   │   ├── Quiz.jsx
│   │   │   ├── Quiz.css
│   │   │   └── [components]
│   │   ├── Flashcards/
│   │   │   ├── Flashcards.jsx
│   │   │   ├── Flashcards.css
│   │   │   └── [components]
│   │   └── Chat/
│   │       ├── Chat.jsx
│   │       ├── Chat.css
│   │       └── [components]
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   ├── ThemeToggle.jsx
│   │   ├── ProtectedRoute.jsx      # Route protection wrapper
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.css
│   │   └── [shared components]
│   ├── context/
│   │   ├── AuthContext.jsx         # Auth state
│   │   ├── ThemeContext.jsx        # Theme state
│   │   └── [other contexts]
│   ├── services/
│   │   ├── auth.js                 # Auth API calls
│   │   ├── quiz.js                 # Quiz API calls
│   │   ├── flashcards.js           # Flashcards API calls
│   │   ├── chat.js                 # Chat API calls
│   │   └── [other services]
│   ├── hooks/
│   │   ├── useAuth.js              # Auth hook
│   │   ├── useTheme.js             # Theme hook
│   │   └── [other hooks]
│   ├── styles/
│   │   ├── globals.css             # Global styles
│   │   ├── variables.css           # CSS variables
│   │   └── [shared styles]
│   └── App.css                     # Main app styles
```

## Authentication Flow

```
App.jsx initializes
         ↓
Check localStorage for token
         ↓
If token exists:
  └── Call /api/auth/me/ to verify
      ├── If valid: Set AuthContext
      └── If expired: Clear token, redirect to login
         ↓
Navigate to requested page
         ↓
ProtectedRoute checks:
  ├── Is authenticated? (has token)
  ├── Is email verified? (for protected features)
  └── Is admin? (for admin routes)
         ↓
If checks pass: Render component
If checks fail: Redirect to appropriate page
```

## Protected Route Implementation

**ProtectedRoute.jsx:**
```jsx
function ProtectedRoute({ 
  component: Component, 
  emailVerificationRequired = false,
  adminRequired = false 
}) {
  const { isAuthenticated, isEmailVerified, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (emailVerificationRequired && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  
  if (adminRequired && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Component />;
}
```

## Route Registration (App.jsx)

```jsx
<Routes>
  {/* Public */}
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/contact" element={<Contact />} />
  
  {/* Auth (no verification) */}
  <Route path="/auth/login" element={<Login />} />
  <Route path="/auth/signup" element={<Signup />} />
  <Route path="/login" element={<Navigate to="/auth/login" replace />} />
  <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
  
  {/* Protected (auth required) */}
  <Route 
    path="/dashboard" 
    element={<ProtectedRoute component={Dashboard} />} 
  />
  <Route 
    path="/admin-dashboard" 
    element={<ProtectedRoute component={AdminDashboard} adminRequired />} 
  />
  <Route 
    path="/profile" 
    element={<ProtectedRoute component={Profile} />} 
  />
  <Route 
    path="/verify-email" 
    element={<ProtectedRoute component={VerifyEmail} />} 
  />
  
  {/* Protected + Email Verification Required */}
  <Route 
    path="/quiz" 
    element={<ProtectedRoute component={Quiz} emailVerificationRequired />} 
  />
  <Route 
    path="/flashcards" 
    element={<ProtectedRoute component={Flashcards} emailVerificationRequired />} 
  />
  <Route 
    path="/chat" 
    element={<ProtectedRoute component={Chat} emailVerificationRequired />} 
  />
  
  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

## Navigation Patterns

### From Login
```javascript
// After successful login
if (response.user.is_admin) {
  navigate('/admin-dashboard');
} else {
  navigate('/dashboard');
}
```

### From Signup
```javascript
// After successful signup
// Show email verification banner
navigate('/dashboard');
```

### From VerifyEmail
```javascript
// After successful verification
navigate('/dashboard');
```

### Logout
```javascript
// Clear token from localStorage
// Clear AuthContext
navigate('/auth/login');
```

## State Management

### AuthContext
```jsx
{
  isAuthenticated: boolean,
  user: {
    id, email, username, is_admin, profile_image, date_joined
  },
  token: string,
  isEmailVerified: boolean,
  login: (email, password) => Promise,
  signup: (email, username, password) => Promise,
  logout: () => void,
  updateProfile: (username, email) => Promise,
  changePassword: (oldPassword, newPassword) => Promise,
  verifyEmail: (token) => Promise,
  resendVerificationEmail: () => Promise,
  uploadProfileImage: (file) => Promise
}
```

### ThemeContext
```jsx
{
  theme: 'light' | 'dark',
  toggleTheme: () => void
}
```

## API Interceptors

**Auth Service (auth.js):**
- Automatically adds `Authorization: Bearer <token>` to all requests
- Handles 401 responses (expired token) → redirects to login
- Clears token on 403 responses (invalid token)

## Responsive Behavior

### Mobile (<768px)
- Sidebar hidden
- Navbar with hamburger menu
- Full-width content
- Stacked layout

### Tablet (768px - 1024px)
- Sidebar visible (reduced width)
- Desktop navbar
- Adjusted padding
- 2-column layouts where applicable

### Desktop (>1024px)
- Full sidebar (260px)
- Full navbar
- Standard padding
- Multi-column layouts

## Query Parameters

### Verify Email
```
/verify-email?token=abc123...
```
Automatically extracted and submitted to `/api/auth/verify-email/`

### Quiz Results
```
/quiz/results/123?score=95
```
Shows result details for completed quiz

### Flashcard Deck
```
/flashcards/deck/456?mode=study
```
Opens deck in study mode

## Error Handling

### 401 Unauthorized
```
→ Redirect to /auth/login
```

### 403 Forbidden
```
→ Show error message
→ Redirect to appropriate page (admin-only pages → /dashboard)
```

### 404 Not Found
```
→ Render NotFound.jsx
```

### 500 Server Error
```
→ Show error banner
→ Offer retry/home navigation
```

## Troubleshooting

### Redirect Loop
**Symptom:** Page redirects continuously

**Check:**
- Is token valid in localStorage?
- Does /api/auth/me/ return success?
- Is ProtectedRoute checking correctly?

### Page Not Rendering
**Symptom:** Route works but page shows blank

**Check:**
- Is component properly exported?
- Are imports correct?
- Check browser console for errors

### Auth State Not Updating
**Symptom:** Login succeeds but page doesn't update

**Check:**
- Is AuthContext properly wrapped?
- Are components using useAuth hook?
- Check Redux DevTools (if using Redux)

## See Also
- [AUTHENTICATION_SETUP.md](../setup-configuration/AUTHENTICATION_SETUP.md) - Auth system
- [ARCHITECTURE.md](../architecture-design/ARCHITECTURE.md) - System overview
- [FRONTEND_INTEGRATION.md](../architecture-design/FRONTEND_INTEGRATION.md) - Frontend-backend integration
