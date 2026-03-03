# Dashboard & Profile Layout Architecture

## Overview

The dashboard system provides a clean, organized layout for three main pages:
- **Dashboard** (`src/pages/Dashboard/Dashboard.jsx`) — User learning overview
- **AdminDashboard** (`src/pages/Dashboard/AdminDashboard.jsx`) — System administration
- **Profile** (`src/pages/UserProfile/Profile.jsx`) — User account settings

All three share a common layout pattern with a desktop sidebar and responsive mobile nav.

---

## Layout Structure

### Desktop (>768px)
```
┌──────────────────────────────────────────────────┐
│           Navbar (hamburger hidden)              │
├──────────────┬──────────────────────────────────┤
│              │                                   │
│   Sidebar    │           Main Content           │
│   (260px)    │          (flex: 1)               │
│              │                                   │
│   Fixed      │   Scrollable with padding        │
│   Left Side  │   36px padding (desktop)         │
│              │   18px padding (mobile)          │
└──────────────┴──────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────────────────────────────┐
│  Navbar + Hamburger (sidebar hidden)             │
├──────────────────────────────────────────────────┤
│                                                   │
│           Main Content                          │
│           (full width)                          │
│           18px padding                          │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## Component Structure

### `db-container` (Root)
- **Purpose**: Full-height container with dark background
- **Properties**: `min-height: 100vh`, background theme

### `db-wrapper` (Flexbox Layout)
- **Purpose**: Flexbox container for sidebar + main
- **Properties**: `display: flex; gap: 0;`
- **Desktop**: Sidebar fixed left, main takes remaining space
- **Mobile**: Sidebar hidden, main takes full width

### `db-sidebar` (Desktop only)
- **Purpose**: Fixed vertical navigation bar
- **Width**: 260px (desktop), 220px (1024px and below)
- **Position**: Fixed left, scrollable height
- **Mobile**: `display: none;` at <768px
- **Features**:
  - User card with avatar, name, email, role badge
  - Navigation items with icons
  - Logout button
  - User/Admin theme variants

### `db-main` (Flexible content area)
- **Purpose**: Primary scrollable content area
- **Properties**: `flex: 1; overflow-y: auto;`
- **Padding**: 36px 40px (desktop), 28px 22px (1024px), 18px 14px (mobile)

---

## Styling System

### Design Tokens (CSS Variables)
All spacing and radius values use consistent tokens:

```css
/* Spacing scale */
--spacing-xs: 4px;      /* gaps, margins, tiny padding */
--spacing-sm: 8px;      /* small components */
--spacing-md: 12px;     /* medium components */
--spacing-lg: 16px;     /* standard component spacing */
--spacing-xl: 20px;     /* cards, sections */
--spacing-2xl: 24px;    /* card padding */
--spacing-3xl: 28px;    /* page padding, sidebar padding */
--spacing-4xl: 36px;    /* page margins, main padding */

/* Corner radius scale */
--radius-sm: 7px;       /* small buttons, inputs */
--radius-md: 9px;       /* form inputs */
--radius-lg: 10px;      /* nav items, buttons */
--radius-xl: 11px;      /* cards, activity items */
--radius-2xl: 14px;     /* large cards */
```

### Color Variants
- **User Variant** (Yellow): `variant="user"` on Sidebar
  - Primary: `#FFD600`
  - Dark: `#e6c000`
  - Light bg: `rgba(255, 214, 0, 0.1)`
  
- **Admin Variant** (Red): `variant="admin"` on Sidebar
  - Primary: `#ef4444`
  - Dark: `#dc2626`
  - Light bg: `rgba(239, 68, 68, 0.1)`

---

## Key Components

### Sidebar (`src/components/sidebar/Sidebar.jsx`)
- Props:
  - `user` — Auth user object
  - `navItems` — Navigation item config array
  - `activeId` — Currently active nav item
  - `onNavigate` — Navigation handler
  - `onLogout` — Logout handler
  - `variant` — `'user'` or `'admin'` for color theming

### Card Styles
- `.db-card` — Standard container with border/bg
- `.db-card.danger` — Red-themed danger zone section

### Buttons
- `.db-btn-primary` — Yellow/red primary button
- `.db-btn-ghost` — Transparent with border
- `.db-btn-danger` — Red danger action button
- `.db-btn-sm` — Small button variant

### Forms
- `.db-form` — Flex column container
- `.db-form-row` — 2-column grid (responsive)
- `.db-field` — Label + input wrapper
- `.db-feedback-ok` / `.db-feedback-err` — Validation messages

### Grids & Lists
- `.db-stats-grid` — Auto-fit responsive stats card grid
- `.db-actions-grid` — Quick action cards grid
- `.db-activity-list` — Vertical activity feed
- `.db-quiz-row` — Horizontal quiz history row

---

## Responsive Breakpoints

| Breakpoint | Changes |
|-----------|---------|
| **1024px** | Sidebar width: 260px → 220px; padding reduces |
| **768px** | Sidebar hidden; main full width; nav to hamburger |
| **480px** | Stats grid: 2x2 → 2x2; headers smaller |

---

## File Organization

```
src/
├── components/
│   └── sidebar/
│       ├── Sidebar.jsx         — Sidebar component
│       └── Sidebar.css         — Sidebar styles + desktop/mobile
├── pages/
│   ├── Dashboard/
│   │   ├── Dashboard.jsx       — User dashboard
│   │   ├── Dashboard.css       — Page-specific (imports shared)
│   │   ├── AdminDashboard.jsx  — Admin dashboard
│   │   ├── AdminDashboard.css  — Admin-specific styles
│   │   └── dashboard-shared.css — Shared layout + components
│   └── UserProfile/
│       ├── Profile.jsx         — Profile page
│       └── Profile.css         — Profile-specific styles
```

---

## Migration from Old Layout

### Changes Made
1. **Grid → Flexbox**: Changed from CSS Grid to Flexbox for cleaner layout
2. **Removed redundancy**: Eliminated `grid-template-columns + margin-left` duplication
3. **Mobile sidebar**: Changed from horizontal transform to hidden with navbar hamburger
4. **Spacing tokens**: All hardcoded values now use CSS variables
5. **CSS consolidation**: Removed duplicate styles in AdminDashboard.css

### Breaking Changes
- Mobile sidebar no longer visible as horizontal nav bar
- All hardcoded pixel values replaced with variables
- Some class name organization improved

### Benefits
- Cleaner, more maintainable CSS
- Easier responsive adjustments
- Consistent spacing throughout
- Better mobile UX with navbar/hamburger pattern
- Reduced CSS size through consolidation
