# About Section Documentation

## Overview

The About section features a modern two-column layout with an image on the left and text content on the right. It appears directly below the hero section and uses a clean, professional design aesthetic.

## Layout Structure

### Grid System

```css
.principles-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;  /* Equal width columns */
    gap: 60px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    align-items: center;  /* Vertical centering */
}
```

**Behavior:**
- Two equal-width columns on desktop
- Stacks to single column on tablets and below
- Gap of 60px for breathing room
- Centered alignment for both columns

## Image Column (Left)

### Container Styling

```css
.principle-card:first-child {
    position: relative;
    background: var(--surface);
    border: none;
    border-radius: 20px;
    padding: 0;
    overflow: hidden;
    height: 100%;
}
```

### Image Properties

```html
<div className="principle-card">
  <img 
    src="image-url.png" 
    alt="Excellence in Science Education" 
  />
  <div className="principle-icon">Label Text</div>
</div>
```

**CSS:**
```css
.principle-card:first-child img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 20px;
}
```

### Label Overlay

The label appears at the bottom-left of the image:

```css
.principle-card:first-child .principle-icon {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 12px 20px;
    border-radius: 50px;
    font-size: 1rem;
    margin-bottom: 0;
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Image Specifications

- **Aspect Ratio**: Square (1:1) recommended for best results
- **Min Width**: 300px
- **Size**: ~500x500px optimal
- **Format**: WebP, PNG, or JPG
- **Optimization**: Compress for faster loading

### Hover Effect

```css
.principle-card:first-child:hover {
    transform: none;
    border-color: transparent;
    box-shadow: 0 10px 30px rgba(255, 214, 0, 0.1);
}
```

## Text Column (Right)

### Container Styling

```css
.principle-card:nth-child(2) {
    background: transparent;
    border: none;
    padding: 0;
}
```

### Heading

```html
<h3>Excellence in Science Education & Research</h3>
```

**Styling:**
```css
.principle-card h3 {
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 24px;
    text-align: left;
    line-height: 1.2;
}
```

### Paragraphs

```html
<p>The College of Science at Kwame Nkrumah University...</p>
<p>Our commitment to academic excellence...</p>
<p>With state-of-the-art facilities...</p>
```

**Styling:**
```css
.principle-card p {
    color: var(--text-secondary);
    line-height: 1.8;
    margin-bottom: 16px;
    text-align: left;
    font-size: 1rem;
}
```

### Button Group

```html
<div className="hero-btns">
  <a href="#read-more" className="hero-btn primary">Read More About Us →</a>
  <a href="#research" className="hero-btn secondary">Our Research</a>
</div>
```

**Primary Button:**
- Solid background with gradient
- Full color on hover
- Padding: 14px 32px

**Secondary Button:**
```css
.hero-btn.secondary {
    background: transparent;
    border: 2px solid var(--border-light);
    color: var(--text-primary);
}
```

- Outlined style
- Border color changes on hover
- Maintains consistent padding

## Responsive Behavior

### Desktop (1024px+)
- Two-column grid layout
- Image: 50% width
- Text: 50% width
- 60px gap between columns
- Full heading size (2.2rem)
- All content visible

### Tablet (768px - 1023px)
- Single column layout
- Image above text
- Image height auto-adjusts
- Reduced heading size (1.8rem)
- Full paragraph text

### Mobile (480px - 767px)
- Full-width single column
- Image first, text below
- Reduced gap to 32px
- Heading size 1.8rem
- Smaller font for paragraphs

### Small Mobile (< 480px)
- Single column
- Minimal padding (24px)
- Heading auto-scales
- Responsive button sizing
- Full-width layout

**Media Query Implementation:**
```css
@media (max-width: 992px) {
    .principles-grid {
        grid-template-columns: 1fr;  /* Stack columns */
        gap: 40px;
    }
}

@media (max-width: 768px) {
    .principles-grid {
        grid-template-columns: 1fr;
        gap: 32px;
    }
    
    .principles-section {
        padding: 60px 0;
    }
    
    .principle-card h3 {
        font-size: 1.8rem;
    }
}
```

## Animation & Interactions

### Hover Effect on Image

```css
.principle-card:first-child:hover {
    box-shadow: 0 10px 30px rgba(255, 214, 0, 0.1);
}
```

- Subtle shadow increase
- Smooth transition (0.3s)
- No transform or scale
- Professional, understated effect

### Button Hover States

**Primary Button:**
```css
.hero-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

**Secondary Button:**
```css
.hero-btn.secondary:hover {
    background: rgba(255, 214, 0, 0.1);
    border-color: var(--primary-color);
}
```

## Content Best Practices

### Heading
- Clear, benefit-focused
- 2-3 words max for emphasis
- Use strong keywords

### Paragraphs
- 3-4 sentences each
- Clear value proposition
- Action-oriented language
- Digestible chunks

### Buttons
- Action verbs (Read, Learn, Explore)
- Arrow indicators (→) for external links
- Clear hierarchy (primary vs secondary)

## Customization

### Change Image
```javascript
<img 
  src="new-image-url.png" 
  alt="Descriptive alt text" 
/>
```

### Update Label Text
```javascript
<div className="principle-icon">Your Label Here</div>
```

### Modify Heading Size
```css
.principle-card h3 {
    font-size: 2.5rem;  /* Increase from 2.2rem */
}
```

### Adjust Column Gap
```css
.principles-grid {
    gap: 80px;  /* Increase from 60px */
}
```

### Change Button Style
```javascript
className="hero-btn primary"  /* or 'secondary' */
```

## Theme Adaptation

### Dark Theme
- Image: Natural colors with slight overlay
- Text: Light gray (#f0f4f8)
- Buttons: Yellow primary accent
- Label: Semi-transparent white with blur

### Light Theme
- Image: Maintains natural colors
- Text: Dark gray (#1f2937)
- Buttons: Blue primary accent
- Label: Semi-transparent white with blur

Both themes automatically apply via CSS variables.

## Performance Considerations

- **Image Lazy Loading**: Not needed as about section is visible on scroll
- **Optimization**: Use WebP format for faster loading
- **Dimensions**: 500x500px optimal for both display and load time
- **Alt Text**: Always include for accessibility
- **Fallback**: Text content provides info if image fails

## Testing Checklist

- [ ] Image displays correctly in both themes
- [ ] Label overlay is readable on image
- [ ] Text column has good contrast
- [ ] Layout stacks properly on mobile
- [ ] Buttons are clickable and responsive
- [ ] Image aspect ratio is correct
- [ ] No layout shift on load
- [ ] Responsive at all breakpoints
- [ ] Animations are smooth
- [ ] Both button styles work

## Common Issues

### Image Not Displaying
- Check image URL is correct
- Verify image format is supported
- Ensure image dimensions match expectations
- Use absolute path or public URL

### Text Not Aligned
- Check grid column settings
- Verify padding/margin values
- Ensure no overflow issues
- Test on mobile devices

### Buttons Not Responding
- Check href/onClick handlers
- Verify button classes applied
- Test click area size
- Check z-index conflicts

## Accessibility

- Semantic heading (h3) structure
- Image alt text descriptive
- Sufficient color contrast
- Button labels clear
- Keyboard navigable
- Touch targets 44px minimum
- ARIA labels on links if needed

## SEO Considerations

- Use descriptive heading text
- Include keyword-rich content
- Alt text includes main keywords
- Proper heading hierarchy (h3)
- Link text is descriptive
- Page structure is semantic
