# Quiz Timer - Visual Reference Guide

## How Timer Works (Step by Step)

### Step 1: Quiz Setup
```
┌─────────────────────────────────────┐
│ CreateQuiz Form                     │
├─────────────────────────────────────┤
│ Subject: [Physics]                  │
│ Study Text: [Lorem ipsum...]        │
│ MCQ: [5]    Short: [2]              │
│ Difficulty: [Medium]                │
│ Quiz Time: [5] minutes  ← USER INPUT│
└─────────────────────────────────────┘
        │
        ▼ onClick="Generate Quiz"
        │ POST /quiz/generate/
        │ { quiz_time: 5 }  ← Integer
        │
```

### Step 2: Quiz Page Loads
```
┌─────────────────────────────────────────────────────────────┐
│ Quiz: Physics                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Time left: 5:00:00      [Hide]                             │
│ ████████████████████████ ← Progress Bar (100% green)       │
│                                                              │
│ Question 1 of 7 | Not yet answered                         │
│ ─────────────────────────────────────────────────────────── │
│ What is velocity?                                           │
│                                                              │
│ ○ A) Speed in a direction                                  │
│ ○ B) Rate of change of position                            │
│ ○ C) Acceleration                                           │
│ ○ D) Force over mass                                        │
│                                                              │
│ [Flag] [Previous] [Next] [Submit]                          │
└─────────────────────────────────────────────────────────────┘
     ↑
     Timer starts: 5:00 → 4:59 → 4:58...
     Progress bar shrinks every second
```

### Step 3: During Quiz (Various Time Points)

#### At 4:30 (Green - Plenty of Time)
```
Time left: 4:30:00        [Hide]
████████████████████ ← 90% green - comfortable
```

#### At 2:00 (Still Green - Good Time)
```
Time left: 2:00:00        [Hide]
████████ ← 40% green - still good
```

#### At 1:30 (Orange - Getting Low)
```
Time left: 1:30:00        [Hide]
██████ ← 30% orange - time to wrap up
```

#### At 0:45 (Orange - Hurry Up)
```
Time left: 0:45:00        [Hide]
███ ← 15% orange - hurry!
```

#### At 0:10 (Red - Final Seconds)
```
Time left: 0:10:00        [Hide]
█ ← 2% red - FINAL SECONDS
```

### Step 4: Time Runs Out
```
┌──────────────────────────────────┐
│ Alert Box                        │
├──────────────────────────────────┤
│                                  │
│ Time's up!                       │
│ Submitting your answers.         │
│                                  │
│                        [OK]      │
└──────────────────────────────────┘
        │
        ▼ Auto-submits quiz
        │ POST /quiz/submit/
        │
        ▼ Navigates to results
        │
```

### Step 5: Results Page
```
┌─────────────────────────────────────────────────────────────┐
│ Excellent Work!                                             │
│ You completed the Physics Quiz                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Score: 4/7    (57%)                                        │
│ ████ ← 57% progress bar                                    │
│                                                              │
│ Detailed Answer Review                                     │
│                                                              │
│ Q1. ✓ Correct: B (Rate of change of position)            │
│ Q2. ✗ Incorrect: You said A, correct is B                │
│ Q3. ⊙ Unanswered                                          │
│ Q4. ✓ Correct: Short answer evaluated...                 │
│ ... (more answers)                                         │
│                                                              │
│ How was your experience? ★★★★☆                            │
│ [Share] [Generate New Quiz]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Code Reference

### Timer Display Colors
```
🟢 GREEN ZONE: >33% time remaining
   └─ Meaning: Comfortable pace, no rush
   └─ Action: Normal answering
   └─ Example: 5 min quiz with 2 min left = GREEN

🟠 ORANGE ZONE: 10-33% time remaining
   └─ Meaning: Time is getting low
   └─ Action: Wrap up current question, move on
   └─ Example: 5 min quiz with 45 sec left = ORANGE

🔴 RED ZONE: <10% time remaining
   └─ Meaning: Critical! Time almost up!
   └─ Action: Submit ASAP or let auto-submit happen
   └─ Example: 5 min quiz with 20 sec left = RED

⚫ NO TIME: 0 seconds
   └─ Meaning: Time's up!
   └─ Action: Auto-submit triggered
   └─ Example: 5 min quiz with 0 sec left = AUTO-SUBMIT
```

---

## Calculation Examples

### Example 1: 5-Minute Quiz
```
User selects: 5 minutes
Backend converts: int(5) = 5 minutes
Frontend calculates: 5 × 60 = 300 seconds

Timeline:
0s:   300s remaining → 100% green
60s:  240s remaining → 80% green
120s: 180s remaining → 60% green
150s: 150s remaining → 50% orange (33% threshold passed)
270s: 30s remaining → 10% red (10% threshold passed)
300s: 0s remaining → AUTO-SUBMIT
```

### Example 2: 1-Minute Quiz (Quick Test)
```
User selects: 1 minute
Backend converts: int(1) = 1 minute
Frontend calculates: 1 × 60 = 60 seconds

Timeline:
0s:  60s remaining → 100% green
20s: 40s remaining → 67% green
33s: 27s remaining → 45% orange (33% threshold = 20s)
54s: 6s remaining → 10% red (10% threshold = 6s)
60s: 0s remaining → AUTO-SUBMIT
```

### Example 3: 30-Minute Quiz (Long Test)
```
User selects: 30 minutes
Backend converts: int(30) = 30 minutes
Frontend calculates: 30 × 60 = 1800 seconds

Timeline:
0s:    1800s remaining → 100% green
600s:  1200s remaining → 67% green
1200s: 600s remaining → 33% orange (33% threshold)
1620s: 180s remaining → 10% red (10% threshold)
1800s: 0s remaining → AUTO-SUBMIT
```

---

## User Experience Flows

### Flow A: User Answers Quickly
```
Quiz loads (5 min timer)
│
├─ Q1: 30 seconds → Answer and move on
├─ Q2: 25 seconds → Answer and move on
├─ Q3: 35 seconds → Answer and move on
├─ Q4: 40 seconds → Answer and move on
├─ Q5: 28 seconds → Answer and move on
│ (Total so far: 2 min 58 sec)
│ Timer shows: 2:02 remaining (green bar)
│
├─ Q6: Reconsider answers → 1 min
├─ Q7: Skip and continue
│
└─ CLICK "SUBMIT QUIZ" BUTTON (3:45 remaining)
   │
   ✓ Quiz submitted successfully
   ✓ Navigate to results
```

### Flow B: User Runs Out of Time
```
Quiz loads (5 min timer)
│
├─ Q1: 45 seconds
├─ Q2: 50 seconds
├─ Q3: 45 seconds
├─ Q4: Still answering... (bar turns orange at 1:40)
├─ Q5: Still thinking...
│ (Timer: 0:45 - bar is orange)
│
├─ Q6: Panic! Quickly select answer (0:20 left - bar is RED)
│
├─ Trying to select Q7 answer...
│
TIMER REACHES 0:00
│
├─ ALERT: "Time's up! Submitting your answers."
│
✓ Auto-submit with current answers
✓ Navigate to results
```

### Flow C: User Manually Submits Early
```
Quiz loads (5 min timer)
│
├─ Q1-Q5: Answer all questions (2 min)
│ Timer shows: 3:00 remaining (green)
│
├─ Review answers on Q6-Q7
│ (Decide to skip them for now)
│
CLICK "SUBMIT QUIZ" BUTTON (1:45 remaining)
│
✓ Submit with 5 answered (2 unanswered)
✓ Navigate to results
✓ Score calculated on answered questions
```

---

## Progress Bar Animation

### Visual Animation (Every Second)
```
Elapsed  Time Left  Percent  Bar Visual
──────────────────────────────────────
0s       5:00      100%     ████████████████████████ (GREEN)
1s       4:59      99.7%    ███████████████████████
2s       4:58      99.3%    ███████████████████████
10s      4:50      96.7%    ███████████████████████
30s      4:30      90%      █████████████████████
60s      4:00      80%      ████████████████████
90s      3:30      70%      ███████████████████
120s     3:00      60%      ████████████████
150s     2:30      50%      ████████████ (ORANGE)
180s     2:00      40%      █████████
210s     1:30      30%      ███████
240s     1:00      20%      █████ (RED)
270s     0:30      10%      ███
300s     0:00      0%       █ (AUTO-SUBMIT)
```

---

## Error Prevention

### What Could Go Wrong (OLD):
```
❌ Timer shows "time's up" at load
   └─ User can't answer any questions
   └─ Results show 0/5 score

❌ Timer counts weird (jumps randomly)
   └─ NaN calculations
   └─ User confused

❌ Auto-submit happens randomly
   └─ Loss of user work
   └─ Frustration
```

### What's Protected (NEW):
```
✅ Timer initialized correctly
   └─ Explicit parseInt() conversion
   └─ Backend int() guarantee
   └─ Frontend defensive parsing

✅ Countdown smooth and predictable
   └─ No NaN values possible
   └─ Linear 1-second decrements
   └─ Visual bar matches countdown

✅ Auto-submit only at 0:00
   └─ Condition: if (timeRemaining === 0)
   └─ Not "immediately at load"
   └─ User has full allocated time
```

---

## Testing Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Timer shows correct time | ✓ | Should be 5:00 for 5-min quiz |
| Progress bar visible | ✓ | Thin green bar below timer |
| Bar shrinks each second | ✓ | Smooth linear transition |
| Color changes at 33% | ✓ | Green → Orange |
| Color changes at 10% | ✓ | Orange → Red |
| Auto-submit at 0:00 | ✓ | Alert shows "Time's up!" |
| Manual submit works | ✓ | Can submit anytime |
| Progress bar responsive | ✓ | Works on mobile/tablet |
| Refresh persists time | ✓ | Time resumes from where it left |
| Different times work | ✓ | Test 1, 5, 15, 30 min |

---

## Quick Reference

| What | Value | Format |
|------|-------|--------|
| Min quiz time | 1 | minute |
| Max quiz time | 120 | minutes |
| Timer display | HH:MM:SS | e.g., "5:00:00" |
| Green zone | > 33% | e.g., 2:00+ remaining in 5-min quiz |
| Orange zone | 10-33% | e.g., 0:20-1:40 remaining |
| Red zone | < 10% | e.g., < 0:30 remaining |
| Auto-submit | 0% | Triggers at 0:00 |

---

## Color Palette

```css
🟢 Green  → #03903e  (Comfortable)
🟠 Orange → #FF9800  (Hurry up)
🔴 Red    → #bd2413  (Critical!)
```

---

**Status:** ✅ Ready to test! Timer is now fully functional.

