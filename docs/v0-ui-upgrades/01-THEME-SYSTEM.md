# Theme System Documentation

## Overview

The Lamla AI platform implements a comprehensive dual-theme system supporting dark and light modes. The system uses CSS variables for efficient theme switching and provides instant visual feedback without page reloads.

## Architecture

### Components

1. **ThemeContext.jsx** - React Context for global theme state management
2. **App.css** - CSS variables and theme-specific styles
3. **Navbar.jsx** - Theme toggle button with scroll detection

### Theme Variables

#### Dark Theme (Default)
```css
:root {
    --primary-color: #FFD600;
    --primary-dark: #E6C200;
    --primary-light: #FFF3A0;
    --secondary-color: #1a1a1a;
    --text-primary: #f0f4f8;
    --text-secondary: #a0aec0;
    --text-muted: #718096;
    --background-dark: #121212;
    --background-gray: #1e1e1e;
    --surface: #1e1e1e;
    --border: #333333;
    --border-light: #444444;
}
```

#### Light Theme
```css
[data-theme="light"] {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --primary-light: #dbeafe;
    --secondary-color: #ffffff;
    --text-primary: #1f2937;
    --text-secondary: #4b5563;
    --text-muted: #9ca3af;
    --background-dark: #f9fafb;
    --background-gray: #f3f4f6;
    --surface: #ffffff;
    --border: #e5e7eb;
    --border-light: #d1d5db;
}
```

## Implementation Details

### ThemeContext.jsx

Provides three main exports:

```javascript
export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Returns: { theme, toggleTheme }
}
```

**State Management:**
- Reads initial theme from localStorage
- Falls back to 'dark' if not set
- Persists preference on toggle

**DOM Updates:**
- Sets `data-theme="light"` or `data-theme="dark"` on html element
- Triggers CSS variable switch via attribute selector
- Smooth transitions via CSS

### Navbar Theme Toggle

Located in top-right of navbar:
- Sun icon in dark mode
- Moon icon in light mode
- Smooth 20-degree rotation on hover
- Accessible with ARIA labels

**Styling:**
```css
.theme-toggle-btn {
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 1.3rem;
    cursor: pointer;
    padding: 8px;
    border-radius: var(--radius-sm);
    transition: var(--transition);
    width: 40px;
    height: 40px;
}

.theme-toggle-btn:hover {
    background: rgba(255, 214, 0, 0.1);
    color: var(--primary-color);
    transform: rotate(20deg);
}
```

## Usage

### Using in Components

```javascript
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

### Adding Theme-Aware Styles

All CSS should use variables:

```css
/* Good */
.my-element {
    background: var(--surface);
    color: var(--text-primary);
    border: 1px solid var(--border);
}

/* Avoid */
.my-element {
    background: #ffffff;
    color: #000000;
    border: 1px solid #ccc;
}
```

## Persistence

Theme preference is saved to localStorage:
```javascript
localStorage.setItem('theme', 'light');
// or
localStorage.setItem('theme', 'dark');
```

Loaded on app initialization:
```javascript
const savedTheme = localStorage.getItem('theme') || 'dark';
```

## Performance

- **CSS Variable Approach**: No JavaScript painting needed for most changes
- **Minimal Repaints**: Only affected elements re-render
- **Hardware Acceleration**: Transitions use GPU when possible
- **Transition Duration**: 0.3s for smooth but responsive feel

## Accessibility

- Both themes meet WCAG AA contrast ratios
- Theme toggle has aria-label and title
- Keyboard accessible (Tab + Enter)
- No color-only information conveyance

## Browser Compatibility

- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+
- Mobile browsers (full support)

## Common Issues and Solutions

### Theme Not Persisting
**Issue**: Theme resets on page reload
**Solution**: Check localStorage is enabled and the context provider wraps the entire app

### Inconsistent Colors
**Issue**: Some elements don't change when toggling theme
**Solution**: Ensure all colors use CSS variables, not hard-coded hex values

### Transitions Too Fast/Slow
**Issue**: Theme change feels jarring or slow
**Solution**: Adjust transition duration in --transition variable (default 0.3s)

## Testing Checklist

- [ ] Theme toggles with button click
- [ ] Theme persists after page reload
- [ ] All text has sufficient contrast in both themes
- [ ] Images and icons visible in both themes
- [ ] Transitions are smooth (no flickering)
- [ ] Mobile theme toggle works
- [ ] Color-dependent information is accessible

## Future Enhancements

- System theme preference detection (prefers-color-scheme)
- Per-component theme overrides
- Custom theme creator
- Scheduled theme switching (dark at night)
