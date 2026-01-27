# Quiz Styling - Quick Reference Guide 🎨

## Color Palette (CustomQuiz Theme)

```css
/* Primary Colors */
--primary-color: #FFD600        /* Yellow - Main accent */
--background-color: #121212     /* Deep dark - Page background */
--surface: #1c1c1c              /* Lighter dark - Cards/panels */

/* Status Colors */
--timer-red: #d32f2f            /* Red - Timer urgency */
--success-green: #10b981        /* Green - Correct answers */
--error-red: #ef4444            /* Red - Incorrect answers */
--info-blue: #3b82f6            /* Blue - Unanswered questions */

/* Text Colors */
--text-primary: #f0f0f0         /* Main text */
--text-secondary: #d0d0d0       /* Secondary text */
--text-muted: #999999           /* Disabled/muted text */

/* Utilities */
--border-dark: #333             /* Dark borders */
```

## Component CSS Classes

### Quiz Page (`Quiz.css`)

#### Timer Header
```css
.topHeader              /* Sticky red timer container */
.timer                  /* Timer content wrapper */
.timerDisplay           /* Time text display */
.hideBtn                /* Toggle button */
.timerProgressContainer /* Progress bar container */
.timerProgressBar       /* Animated progress bar */
```

#### Question Display
```css
.questionCard           /* Question container */
.metaCard               /* Question number/status */
.questionBody           /* Question text wrapper */
.questionNumber         /* Question # display */
.questionStatus         /* Status indicator */
```

#### Options
```css
.optionsList            /* Options container */
.optionItem             /* Individual option */
.optionLabel            /* Option text */
.radioCircle            /* Radio button circle */
.selected               /* Selected state (class) */
```

#### Navigation
```css
.navActions             /* Bottom button container */
.actionBtn              /* Secondary button style */
.primaryBtn             /* Primary button style */
.floatBtn               /* Floating navigator button */
```

#### Sidebar Navigator
```css
.questionPanel          /* Sidebar panel */
.panelActive            /* Panel open state */
.grid                   /* Question grid */
.gridBtn                /* Individual question button */
.gridBtn.answered       /* Answered state */
.gridBtn.flagged        /* Flagged state */
.gridBtn.active         /* Current question */
```

### QuizResults Page (`QuizResults.css`)

#### Summary Card
```css
.summaryCard            /* Main results card */
.summaryHeader          /* Title section */
.summaryHeader h1       /* Title with gradient */
.scoreMetrics           /* Metrics container */
.metric                 /* Individual metric box */
.progressBarContainer   /* Progress bar wrapper */
.progressBar            /* Animated progress bar */
```

#### Answer Review
```css
.reviewSection          /* Review section header */
.questionReviewItem     /* Answer card */
.questionReviewItem.correct     /* Correct state (green) */
.questionReviewItem.incorrect   /* Incorrect state (red) */
.questionReviewItem.unanswered  /* Unanswered state (blue) */
.questionHeader         /* Question text */
.answerDetail           /* Answer details section */
.answerLine             /* Answer detail line */
.answerLabel            /* Label (User/Correct) */
.reasoning              /* Reasoning explanation */
.explanation            /* Hint/explanation */
```

#### Feedback Section
```css
.summaryCard.text-center /* Feedback card */
.stars                  /* Star rating display */
.starRated              /* Rated star (class) */
```

## Responsive Breakpoints

### Desktop (≥768px)
- Full layout with all features
- Multi-column grids
- Horizontal button layouts

### Tablet (481px - 767px)
- Adjusted spacing and padding
- 4-column question grid
- Responsive button sizing

### Mobile (≤480px)
- Stack layout (vertical)
- 3-column question grid
- Full-width buttons
- Reduced font sizes
- Touch-friendly targets (44x44px minimum)

## Using CSS Variables

All colors are CSS variables. To update colors globally:

```css
:root {
  /* Change just these values */
  --primary-color: #FFD600;
  --background-color: #121212;
  --surface: #1c1c1c;
  --timer-red: #d32f2f;
  --success-green: #10b981;
  --error-red: #ef4444;
  --info-blue: #3b82f6;
}
```

## Common Styling Patterns

### Gradient Text
```css
background: linear-gradient(135deg, #FFD600 0%, #E6C200 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Smooth Transitions
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Effect (Lift)
```css
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 214, 0, 0.3);
}
```

### Dark Card
```css
background: var(--surface);
border-radius: 8px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
border: 1px solid var(--border-dark);
```

### Status Border
```css
border-left: 5px solid var(--success-green);  /* or error-red, info-blue */
background: linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 100%);
```

## Customization Guide

### Change Primary Color
1. Update `--primary-color` in Quiz.css and QuizResults.css
2. Update gradient color in button hover states
3. Update timer text (if using different color)

### Change Timer Appearance
1. Modify `.topHeader` background color
2. Update `.timerProgressBar` color gradient
3. Adjust `.timer` font size if needed

### Adjust Responsive Breakpoints
```css
/* Change tablet breakpoint */
@media (max-width: 768px) { ... }

/* Change mobile breakpoint */
@media (max-width: 480px) { ... }
```

### Modify Animations
```css
/* Current: 0.3s cubic-bezier(0.4, 0, 0.2, 1) */
/* Fast: 0.15s ease-in-out */
/* Slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1) */
```

## Accessibility Checklist

✅ **Color Contrast**
- Text on background: AAA level (7:1 ratio)
- Borders visible: Include both color and shape indicators

✅ **Focus States**
- All buttons have visible focus outlines
- Keyboard navigation works

✅ **Touch Targets**
- Minimum 44x44px button size on mobile
- Adequate spacing between clickable elements

✅ **Motion**
- No auto-playing animations
- Can be paused/disabled

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

1. **Use CSS Variables** - Easier to maintain and update
2. **Leverage GPU** - Use transform/opacity for animations
3. **Minimize Shadows** - Use sparingly for better performance
4. **Optimize Gradients** - Keep to 2-3 colors max
5. **Mobile First** - Start with mobile styles, add complexity

## Troubleshooting

### Timer not showing red?
Check: `--timer-red: #d32f2f` in `:root`

### Options not selectable?
Check: `.optionItem` has `cursor: pointer`

### Sidebar not sliding?
Check: `.questionPanel` has `transform: translateX()`

### Mobile layout broken?
Check: Responsive media queries at 768px and 480px

### Colors not updating?
Check: CSS variables in `:root` are correct

## Files to Edit

- **Color scheme**: Both `.css` files `:root` section
- **Timer styling**: `Quiz.css` `.topHeader`, `.timerProgressBar`
- **Question cards**: `Quiz.css` `.questionCard`
- **Results display**: `QuizResults.css` `.summaryCard`, `.questionReviewItem`
- **Buttons**: `Quiz.css` `.actionBtn`, `.primaryBtn`
- **Mobile layout**: Both `.css` files media queries

## Links to Main Files

- `frontend/src/styles/Quiz.css` - Quiz page styling
- `frontend/src/styles/QuizResults.css` - Results page styling
- `frontend/src/pages/Quiz.jsx` - Quiz component
- `frontend/src/pages/QuizResults.jsx` - Results component

---

**Quick Tip**: All CSS follows a mobile-first approach. Desktop styles override mobile for larger screens!
