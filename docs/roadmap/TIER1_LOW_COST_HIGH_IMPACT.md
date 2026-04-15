# Tier 1 — Low/No LLM Cost, High Impact

> These features are pure database logic and Django ORM work.
> Zero LLM API calls. Build these first — they deliver the most learning value
> per engineering hour and cost nothing to run at scale.

## Status

| Feature | Status |
|---|---|
| Weak Area Detection Engine | ✅ Built |
| Spaced Quiz Scheduling | ✅ Built |
| Exam Simulation Mode | ✅ Backend built — frontend UX pending |
| Daily Study Plan | ⏳ Not started |
| Milestone & Badge System | ⏳ Not started |
| Weekly Progress Email Digest | ⏳ Not started |

---

## 1. Weak Area Detection Engine

### What It Does
After every quiz, each wrong answer is tagged with the concept/topic it tests.
Over time, the system builds a per-user performance map: a live picture of
exactly what each student knows and where they consistently struggle.

The student sees something like:
> "You've answered 18 questions on Thermodynamics. You get 38% right.
> You've answered 12 questions on Cell Biology. You get 91% right.
> [Take a focused quiz on Thermodynamics →]"

This is not a dashboard vanity metric. It directly drives what the system
recommends next. It is the foundation every other intelligent feature builds on.

### Why It Matters
Most edtech platforms tell students their overall score. That is not useful.
A student who scores 70% overall might be failing one critical subtopic
and acing everything else. This feature finds that subtopic.

### Data Model

New model: `TopicPerformance`

```python
class TopicPerformance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="topic_performance")
    topic = models.CharField(max_length=200, db_index=True)
    subject = models.CharField(max_length=200, db_index=True)
    total_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    accuracy = models.FloatField(default=0.0)  # recomputed on each update
    last_attempted = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "topic")
        indexes = [models.Index(fields=["user", "accuracy"])]
```

### How Topics Are Extracted
Each question already has a subject field on QuizSession. The question JSON
also carries the question text. Extract topic from two sources:

1. **Subject-level** (free, immediate): Use the quiz subject as the topic.
   This works out of the box with zero changes to question generation.

2. **Concept-level** (better, requires one LLM call at quiz generation time):
   When generating questions, ask the LLM to tag each question with a
   subtopic (e.g., subject="Chemistry", subtopic="Le Chatelier's Principle").
   Store this in the question JSON. One extra field, no extra API call since
   the LLM is already generating the question.

Start with option 1. Migrate to option 2 when the batch LLM pipeline exists.

### Implementation Strategy

**Step 1 — Create the model and migration** ✅
**Step 2 — Hook into quiz submission** ✅
**Step 3 — Weak areas API endpoint** ✅
**Step 4 — Surface in dashboard** ✅
**Step 5 — Drive quiz generation** ✅

---

## 2. Spaced Quiz Scheduling

### What It Does
Applies the SM-2 spaced repetition algorithm (already used for flashcards)
to quiz *topics*. Topics the student has mastered are scheduled less
frequently. Topics they struggle with surface more often.

The system tells them:
> "You're due to review Organic Chemistry today. You last practised it
> 4 days ago and scored 55%."

### Why It Matters
Students naturally avoid what they find hard and over-practice what they
already know. This feature inverts that instinct automatically.

### Data Model

New model: `QuizTopicSchedule`

```python
class QuizTopicSchedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.CharField(max_length=200)
    subject = models.CharField(max_length=200)

    # SM-2 fields (mirrors Flashcard model)
    repetitions = models.IntegerField(default=0)
    interval = models.IntegerField(default=1)       # days until next review
    ease_factor = models.FloatField(default=2.5)
    next_review = models.DateTimeField(default=timezone.now)
    last_review = models.DateTimeField(null=True)

    class Meta:
        unique_together = ("user", "topic")
        indexes = [models.Index(fields=["user", "next_review"])]
```

### Implementation Strategy

**Step 1 — Reuse existing SM-2 logic** ✅
**Step 2 — Map quiz score to SM-2 quality rating** ✅
**Step 3 — Update schedule on submission** ✅
**Step 4 — Due topics API** ✅ (`GET /api/quiz/due-topics/` live)
**Step 5 — Integrate with Daily Study Plan** ⏳ (Daily Study Plan not yet built)

---

## 3. Daily Study Plan

### What It Does
Every time a student opens the app, a computed recommendation appears:

> "Your plan for today:
> • Review 12 overdue flashcards (Mole Calculations deck)
> • Take a 5-question quiz on your weakest topic: Thermodynamics
> • You haven't chatted with your tutor in 4 days — try asking it
>   to explain Le Chatelier's Principle"

No LLM. Pure logic from existing data. Computed fresh on each dashboard load
or cached in Redis for 6 hours per user.

### Why It Matters
Students don't know what to study next. Decision fatigue is real. A clear,
personalised directive — even a simple one — significantly increases
session start rate and depth of engagement.

### Implementation Strategy

**Step 1 — Build a `StudyPlanBuilder` utility class** ⏳
**Step 2 — Add to dashboard endpoint** ⏳
**Step 3 — Redis caching** ⏳
**Step 4 — Frontend CTA buttons** ⏳

---

## 4. Milestone & Badge System

### What It Does
Students earn badges and XP for real learning milestones — not arbitrary
clicks. Badges appear on their profile. XP is a cumulative score reflecting
total effort.

Example badges:
| Badge | Trigger |
|---|---|
| First Step | Complete first quiz |
| Sharp | Score 90%+ on 5 different quizzes |
| Consistent | 7-day study streak |
| Dedicated | Review 100 flashcards total |
| Deep Diver | Complete a quiz longer than 15 questions |
| Community Builder | Share 5 materials downloaded by others |
| Comeback | Return after a 7-day absence |
| Tutor's Favourite | Send 50 chat messages |
| Exam Ready | Complete an Exam Simulation mode quiz |
| Supporter | Make a voluntary donation |

No XP unlocks anything. There is no paywall. XP is purely a mirror of effort —
students should feel proud of it, not transactional about it.

### Data Model

```python
class Badge(models.Model):
    slug = models.CharField(max_length=50, unique=True)  # e.g. "sharp"
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=300)
    xp_value = models.PositiveIntegerField(default=10)
    icon = models.CharField(max_length=50)  # icon name for frontend

class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="badges")
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "badge")  # earn each badge once

class UserXP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="xp")
    total_xp = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
```

### Implementation Strategy

**Step 1 — Seed Badge table** ⏳
**Step 2 — Badge checker service** ⏳
**Step 3 — Hook into action endpoints** ⏳
**Step 4 — Profile API** ⏳
**Step 5 — In-app notification** ⏳

---

## 5. Weekly Progress Email Digest

### What It Does
Every Sunday at 8am Ghana time, each active user receives a personalised
email summarising their week:

- Quizzes taken and average score vs. last week
- Flashcards reviewed
- Streak status and milestone progress
- Their single weakest topic with a "Practice it now" link
- One encouraging, personalised message

No LLM. Data pulled from existing models. Rendered from an email template.

### Why It Matters
Most users who stop using a product simply forget it exists. A well-crafted
weekly email is the cheapest possible re-engagement mechanism.
Your email system is already configured (SMTP, Resend, Brevo).

### Implementation Strategy

**Step 1 — Celery beat schedule** ⏳
**Step 2 — Digest task** ⏳
**Step 3 — Email template** ⏳
**Step 4 — Opt-out** ⏳
**Step 5 — Only send to active users** ⏳

---

## 6. Exam Simulation Mode

### What It Does
A timed, full-length mock exam experience built on the existing quiz engine.
No pausing. No hints. No AI assistance during the exam.
Graded at the end with full question-by-question breakdown.

The student selects: subject, difficulty, number of questions (up to 40),
and time limit (e.g., 60 or 90 minutes). The system generates the quiz
exactly as it does today, but the UI enforces exam conditions.

### Why It Matters
Ghana's education system is heavily exam-oriented (WASSCE, BECE,
university mid-sems and finals). Realistic mock exams under timed
conditions are one of the most effective study techniques that exist.
This meets students where their real anxiety is.

### Implementation Strategy

**Step 1 — Add exam_mode flag to QuizSession** ✅ (`exam_mode`, `time_limit_minutes` added in migration `0002`)
**Step 2 — No backend changes to generation** ✅ (`exam_mode` recorded on session creation)

**Step 3 — Exam results page** ⏳ (frontend UI not built)
**Step 4 — Exam badge** ⏳ (badge system not yet built)
**Step 5 — Exam history** ⏳ (frontend exam history view not built)
