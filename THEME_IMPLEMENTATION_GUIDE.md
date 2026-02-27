# Theme System Implementation Guide

## Quick Start

### Using the Theme Hook

```javascript
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {theme === 'dark' ? 'light' : 'dark'} mode
      </button>
    </div>
  );
}
```

### Theme Values
- `theme`: `'dark'` | `'light'`
- `toggleTheme()`: Function to toggle between themes

---

## CSS Variables Reference

### Colors

```css
/* Primary Colors */
--primary-color        /* Main brand color */
--primary-dark         /* Darker shade for hover states */
--primary-light        /* Lighter shade for backgrounds */

/* Text Colors */
--text-primary         /* Main text color */
--text-secondary       /* Secondary text (lower contrast) */
--text-muted           /* Muted text (lowest contrast) */

/* Background Colors */
--background-dark      /* Main background */
--background-gray      /* Alternative background */
--surface              /* Card/surface background */

/* Border Colors */
--border               /* Primary border color */
--border-light         /* Secondary border color */

/* Shadows */
--shadow-sm            /* Small shadow */
--shadow-md            /* Medium shadow */
--shadow-lg            /* Large shadow */
--shadow-xl            /* Extra large shadow */
--shadow-navbar        /* Navbar-specific shadow */
--shadow-sidebar       /* Sidebar-specific shadow */
```

### Sizing & Spacing

```css
--sidebar-width        /* 280px */
--navbar-height        /* 72px (default) */

--radius-sm            /* 6px */
--radius-md            /* 12px */
--radius-lg            /* 16px */
--radius-xl            /* 24px */
```

### Transitions

```css
--transition           /* 0.3s cubic-bezier(0.4, 0, 0.2, 1) */
--transition-fast      /* 0.15s cubic-bezier(0.4, 0, 0.2, 1) */
```

---

## Theme Color Values

### Dark Theme
```
Primary: #FFD600 (Golden Yellow)
Primary Dark: #E6C200
Primary Light: #FFF3A0
Secondary: #1a1a1a
Text Primary: #f0f4f8
Text Secondary: #a0aec0
Text Muted: #718096
Background: #121212
Surface: #1e1e1e
Border: #333333
Border Light: #444444
```

### Light Theme
```
Primary: #2563eb (Blue)
Primary Dark: #1d4ed8
Primary Light: #dbeafe
Secondary: #ffffff
Text Primary: #1f2937
Text Secondary: #4b5563
Text Muted: #9ca3af
Background: #f9fafb
Surface: #ffffff
Border: #e5e7eb
Border Light: #d1d5db
```

---

## Implementing Themed Components

### Basic Component
```javascript
import './MyComponent.css';

function MyComponent() {
  return (
    <div className="my-component">
      <h2>Themed Component</h2>
      <p>This uses CSS variables for theming</p>
    </div>
  );
}
```

### CSS
```css
.my-component {
  background: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}

.my-component:hover {
  background: var(--background-gray);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-lg);
}
```

### Advanced: Conditional Styling (if needed)

If you need to apply different styles based on theme (rare):

```javascript
import { useTheme } from '../context/ThemeContext';

function ConditionalComponent() {
  const { theme } = useTheme();
  
  return (
    <div className={`component ${theme}`}>
      Content here
    </div>
  );
}
```

```css
.component {
  /* Base styles */
}

.component.dark {
  /* Dark theme specific overrides if needed */
}

.component.light {
  /* Light theme specific overrides if needed */
}
```

---

## Layout Alignment Guide

### Left-Aligned Sections
Use these classes/styles for left-aligned content:

```css
text-align: left;
justify-content: flex-start;  /* For flex containers */
```

### Centered Elements (if needed)
```css
text-align: center;
justify-content: center;  /* For flex containers */
```

### Card Layouts
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 32px;
```

---

## Responsive Design

### Mobile-First Approach
```css
/* Default: Mobile styles (< 480px) */
.component {
  font-size: 1rem;
  padding: 12px;
}

/* Tablet (480px - 768px) */
@media (min-width: 480px) {
  .component {
    font-size: 1.1rem;
    padding: 16px;
  }
}

/* Desktop (768px+) */
@media (min-width: 768px) {
  .component {
    font-size: 1.2rem;
    padding: 24px;
  }
}
```

### Breakpoints
- Small Mobile: < 480px
- Mobile: 480px - 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## Common Patterns

### Button Styling
```css
.btn {
  padding: 12px 24px;
  border-radius: var(--radius-md);
  background: var(--primary-color);
  color: var(--secondary-color);
  border: none;
  cursor: pointer;
  transition: var(--transition);
}

.btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Card Styling
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}

.card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-lg);
}
```

### Text Hierarchy
```css
h1 { font-size: clamp(2rem, 5vw, 3rem); }
h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); }
h3 { font-size: clamp(1.2rem, 3vw, 1.8rem); }
p { font-size: 1rem; color: var(--text-secondary); }
```

---

## Accessibility Considerations

### Focus States
```css
.interactive-element:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Contrast
- Dark theme: Light text (#f0f4f8) on dark background (#121212)
- Light theme: Dark text (#1f2937) on light background (#f9fafb)

---

## Debugging

### Check Current Theme
Open browser console and run:
```javascript
document.documentElement.getAttribute('data-theme')
// Returns: 'dark' or 'light'
```

### Check CSS Variables
```javascript
getComputedStyle(document.documentElement)
  .getPropertyValue('--primary-color')
// Returns: '#FFD600' (dark) or '#2563eb' (light)
```

### localStorage Check
```javascript
localStorage.getItem('theme')
// Returns: 'dark' or 'light'
```

---

## Best Practices

1. **Always use CSS variables** - Never hardcode colors
2. **Use responsive units** - `clamp()`, `rem`, `%`, `vw` instead of px
3. **Maintain contrast** - Ensure text is readable in both themes
4. **Test both themes** - Check every component in dark and light modes
5. **Use semantic HTML** - Helps with accessibility
6. **Keep animations smooth** - Use `--transition` variable
7. **Mobile first** - Start with mobile styles, enhance for larger screens
8. **Avoid theme-specific logic** - Use CSS variables instead of JS conditionals

---

## Common Issues & Solutions

### Issue: Colors not changing when theme toggles
**Solution**: Ensure you're using `var(--color-name)` in CSS, not hardcoded colors

### Issue: Navbar theme toggle not working
**Solution**: Check that App.jsx wraps entire app with `<ThemeProvider>`

### Issue: Theme resets on page refresh
**Solution**: ThemeContext loads from localStorage, check if localStorage is enabled

### Issue: Light theme text is hard to read
**Solution**: Verify text color is set to `--text-primary` which is dark in light theme

---

## Future Enhancements

- [ ] Add system theme detection (`prefers-color-scheme`)
- [ ] Add more theme options (sepia, high contrast)
- [ ] Allow custom color customization
- [ ] Add theme transition animations
- [ ] Store theme with user preferences in backend

---

## Support

For issues or questions about the theme system:
1. Check the CSS variables in App.css
2. Review ThemeContext.jsx for provider setup
3. Ensure component imports useTheme hook correctly
4. Check browser console for errors

