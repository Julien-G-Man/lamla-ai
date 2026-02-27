# Hero Section & Navbar Documentation

## Overview

The Lamla AI platform features a sophisticated hero section with centered content and a scrolling navbar that transitions from transparent to semi-opaque as users scroll down.

## Navbar Architecture

### Scroll Transition System

The navbar implements a smooth color transition triggered by scroll position:

#### Starting State (Top of Page)
- `background: rgba(26, 26, 26, 0)` (fully transparent)
- `backdrop-filter: blur(0px)` (no blur)
- `box-shadow: none` (no shadow)

#### Scrolled State (After 50px)
- `background: rgba(26, 26, 26, 0.85)` (85% opaque)
- `backdrop-filter: blur(20px)` (glass morphism effect)
- `box-shadow: var(--shadow-navbar)` (subtle elevation)

### Implementation

**Navbar.jsx Scroll Logic:**

```javascript
const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// Applied to header
<header className={`main-header ${isScrolled ? 'scrolled' : ''}`}>
```

**CSS Styling:**

```css
.main-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: var(--navbar-height);
    background: rgba(26, 26, 26, 0);
    backdrop-filter: blur(0px);
    box-shadow: none;
    z-index: 2000;
    transition: var(--transition);
}

.main-header.scrolled {
    background: rgba(26, 26, 26, 0.85);
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-navbar);
}
```

### Light Theme Navbar

When theme is set to light:

```css
[data-theme="light"] .main-header.scrolled {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
```

## Navbar Components

### Logo & Branding
```html
<Link to="/" className="logo">
  <img src="/assets/lamla_logo.png" alt="Lamla AI Logo" />
  <span className="brand-highlight">Lamla.ai</span>
</Link>
```

### Navigation Links
- Home
- AI Tutor
- Quiz
- Flashcards
- Theme Toggle (sun/moon icon)
- Auth Links (Login/Signup or Dashboard)

### Mobile Hamburger Menu
- Collapses on screens < 1024px
- Smooth slide-down animation
- Click-away closes menu

## Hero Section Architecture

### Layout Structure

The hero section uses centered flex layout:

```css
.hero-section {
    display: flex;
    align-items: center;
    justify-content: center;  /* Centered horizontally */
    min-height: 90vh;
    padding: 80px 16px;
    background-image: url('/assets/student_desk.webp');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
}
```

### Visual Layers

1. **Background Image** - Full screen with fixed attachment (parallax effect)
2. **Dark Overlay** - Semi-transparent dark layer for text readability
3. **Content** - Centered white text with badge, heading, description
4. **Stats** - Centered statistics with horizontal layout
5. **Buttons** - Centered CTA buttons

### Background Overlay

```css
.hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(11, 11, 11, 0.75);
    z-index: 1;
}
```

### Hero Content Box

```css
.hero-content {
    position: relative;
    z-index: 2;
    max-width: 700px;
    padding: 24px;
    margin: 0 auto;
    text-align: center;
}
```

## Hero Elements

### Badge
```html
<div className="hero-badge">
    <span className="badge-icon">🚀</span>
    <span>AI-Powered Learning Platform</span>
</div>
```

**Styling:**
```css
.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 24px;
    backdrop-filter: blur(10px);
    color: var(--text-primary);
}
```

### Main Heading
```html
<h1 className="hero-title">
    <span>Level Up Your Exam Game with</span>
    <span className="brand-highlight">Lamla AI</span>
</h1>
```

**Styling:**
```css
.hero-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 24px;
    line-height: 1.1;
    text-align: center;
}

.brand-highlight {
    display: block;
    background: linear-gradient(135deg, var(--primary-color) 0%, #FFA500 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

### Description Text
```html
<p className="hero-desc">
    Lamla AI is a smart exam preparation assistant designed to help you 
    study with intention, not panic...
</p>
```

### Statistics Section
```html
<div className="hero-stats">
    <div className="stat-item">
        <span className="stat-number">50+</span>
        <span className="stat-label">Students</span>
    </div>
    {/* More stats */}
</div>
```

### Call-to-Action Buttons
```html
<div className="hero-btns">
    <a href="/signup" className="hero-btn primary">Get Started</a>
    <a href="/custom-quiz" className="hero-btn secondary">Try Now</a>
</div>
```

## Responsive Design

### Desktop (1024px+)
- Full parallax background
- Centered single column layout
- Navbar fixed with transparency transition
- Full button size

### Tablet (768px - 1023px)
- Background still fixed
- Reduced padding (60px)
- Smaller font sizes with clamp()
- Hamburger menu visible
- Stats in single row with wrap

### Mobile (480px - 767px)
- Background image still visible
- Increased overlay opacity
- Reduced hero height (40px navbar offset)
- Stack stats vertically with flex-wrap
- Full-width buttons

### Small Mobile (< 480px)
- Minimal padding (40px 12px)
- Hero title ~1.8rem
- Stats in compact single row
- Buttons remain full width in container

## Animation & Transitions

### Scroll Transition
```css
transition: var(--transition);  /* 0.3s cubic-bezier */
```

### Hover Effects

**Buttons:**
```css
.hero-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

**Theme Toggle:**
```css
.theme-toggle-btn:hover {
    background: rgba(255, 214, 0, 0.1);
    transform: rotate(20deg);
}
```

## Performance Optimization

- **Fixed Background**: Uses `background-attachment: fixed` for parallax
- **GPU Acceleration**: Transforms and filters use GPU
- **Debounced Scroll**: Scroll listener triggers on 50px threshold
- **CSS Variables**: Efficient theme transitions
- **Lazy Loading**: Hero loads before other sections

## Common Customizations

### Change Scroll Threshold
Edit `Navbar.jsx` line 16:
```javascript
if (window.scrollY > 50) {  // Change 50 to desired pixel value
```

### Adjust Overlay Opacity
Edit `Home.css`:
```css
background-color: rgba(11, 11, 11, 0.75);  /* 75% opacity */
```

### Modify Transition Speed
Edit `App.css`:
```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
/* Adjust 0.3s to desired duration */
```

### Change Background Image
Edit `Home.jsx` or `Home.css`:
```css
background-image: url('/new-image.webp');
```

## Testing Checklist

- [ ] Navbar is transparent at page top
- [ ] Navbar transitions smoothly at 50px scroll
- [ ] Hero content is centered and readable
- [ ] Background image loads and displays properly
- [ ] Overlay provides sufficient text contrast
- [ ] Mobile menu appears and closes correctly
- [ ] Theme toggle works in both states
- [ ] Responsive layout works at all breakpoints
- [ ] Animations are smooth (60fps)
- [ ] No layout shift on scroll

## Accessibility

- Semantic header and nav elements
- Proper heading hierarchy (h1 for main title)
- ARIA labels on buttons
- Sufficient color contrast in both themes
- Keyboard navigation for all interactive elements
- Alt text for images
