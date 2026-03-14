# Tier 1 — Low/No LLM Cost, High Impact

> These features are pure database logic and Django ORM work.
> Zero LLM API calls. Build these first — they deliver the most learning value
> per engineering hour and cost nothing to run at scale.

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

**Step 1 — Create the model and migration**
Add `TopicPerformance` to the quiz app models.

**Step 2 — Hook into quiz submission**
In `QuizSession` save logic (post-submission), iterate over each question
and its user answer. For each wrong answer, call:
```python
TopicPerformance.objects.update_or_create(
    user=user, topic=subject,
    defaults={...}  # increment totals, recompute accuracy
)
```
Use `F()` expressions to avoid race conditions on concurrent submissions.

**Step 3 — Weak areas API endpoint**
`GET /api/quiz/weak-areas/` returns the bottom 5 topics by accuracy for
the authenticated user. Minimum 3 questions attempted to qualify
(avoids noise from single-question topics).

**Step 4 — Surface in dashboard**
Add weak areas to the existing `DashboardStatsView` response.
Frontend renders them as highlighted cards with a "Practice this" CTA.

**Step 5 — Drive quiz generation**
On the quiz generation form, pre-fill the subject field with the user's
weakest topic. The student sees their weak spot suggested before they even
think about what to study.

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

**Step 1 — Reuse existing SM-2 logic**
The flashcards app already has `scheduling.py` with the full SM-2
implementation. Import and call it from the quiz submission handler.
Do not duplicate code.

**Step 2 — Map quiz score to SM-2 quality rating**
After quiz submission, convert score percentage to the 0–5 SM-2 quality scale:
```
score >= 90%  → quality 5
score >= 75%  → quality 4
score >= 60%  → quality 3
score >= 40%  → quality 2
score >= 20%  → quality 1
score <  20%  → quality 0
```

**Step 3 — Update schedule on submission**
After each quiz submission, update or create a `QuizTopicSchedule` row
for the quiz subject using the mapped quality rating.

**Step 4 — Due topics API**
`GET /api/quiz/due-topics/` returns topics where `next_review <= now`
for the authenticated user, ordered by most overdue first.

**Step 5 — Integrate with Daily Study Plan** (see feature 3 below)
The daily plan pulls from this endpoint to recommend what to study today.

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

**Step 1 — Build a `StudyPlanBuilder` utility class** in `dashboard/helpers.py`

Inputs (all from existing DB queries):
- Overdue flashcard count (next_review <= now) and which deck
- Due quiz topics from `QuizTopicSchedule`
- Weakest topic from `TopicPerformance`
- Days since last chat session
- Days since last material upload/download
- Current streak status

Output: a JSON structure with 2–4 recommended actions, each with:
- action type (quiz / flashcard / chat / read)
- display message
- pre-filled parameters (e.g., subject to quiz on)
- urgency level (due_today / suggested / optional)

**Step 2 — Add to dashboard endpoint**
Extend `DashboardStatsView` to include a `study_plan` array in its response.
No new endpoint needed.

**Step 3 — Redis caching**
Cache the computed plan per user for 6 hours. Invalidate on quiz submission,
flashcard review, or chat message sent. Prevents redundant DB queries on
every page load.

**Step 4 — Frontend CTA buttons**
Each plan item links directly to the relevant feature with parameters
pre-filled. "Practice Thermodynamics" opens quiz generation with subject
already set.

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

**Step 1 — Seed Badge table**
Create a data migration that inserts all badge definitions.
Badge logic lives in code; the DB just stores definitions and awards.

**Step 2 — Badge checker service**
Create `dashboard/badges.py` with a `check_and_award_badges(user)` function.
It queries the user's stats and awards any newly earned badges.
Idempotent — safe to call repeatedly. `unique_together` constraint prevents
double-awarding.

**Step 3 — Hook into action endpoints**
Call `check_and_award_badges.delay(user.id)` (async Celery task) after:
- Quiz submission
- Flashcard review session end
- Chat message sent
- Material uploaded
- Streak update

**Step 4 — Profile API**
Add `badges` and `total_xp` to the profile endpoint response.
Frontend renders badge icons in the profile page.

**Step 5 — In-app notification**
When a badge is newly awarded, the next API response (dashboard or profile)
includes a `new_badges` array. Frontend shows a celebration moment.
No push notifications needed at this stage.

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

**Step 1 — Celery beat schedule**
Add to `settings.py` CELERY_BEAT_SCHEDULE:
```python
"weekly-digest": {
    "task": "apps.dashboard.tasks.send_weekly_digest",
    "schedule": crontab(hour=8, minute=0, day_of_week="sunday"),
}
```

**Step 2 — Digest task**
`send_weekly_digest` task:
1. Queries all active, verified users
2. For each user, fetches last 7 days of activity
3. Computes delta vs. previous 7 days
4. Renders HTML email template
5. Sends via existing email backend
6. Processes in batches of 50 with small delays to avoid SMTP rate limits

**Step 3 — Email template**
Plain, clean HTML. No heavy design. Data-forward. One clear CTA button:
"Continue studying →" that deep-links back to the app.

**Step 4 — Opt-out**
Add `email_digest_enabled` boolean to User model (default True).
Unsubscribe link in email footer sets it to False via a signed URL.
No account login required to unsubscribe.

**Step 5 — Only send to active users**
Only email users who have taken at least one action in the last 30 days.
Avoids spamming dormant accounts and keeps sender reputation healthy.

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

**Step 1 — Add exam_mode flag to QuizSession**
```python
exam_mode = models.BooleanField(default=False)
time_limit_minutes = models.PositiveIntegerField(null=True)
```

**Step 2 — No backend changes to generation**
The quiz generation endpoint already accepts `time_limit` and question counts.
Exam mode is a frontend experience constraint, not a backend one.
Pass `exam_mode=True` in the session creation payload so it's recorded.

**Step 3 — Exam results page**
After submission, show a dedicated results view:
- Overall score with pass/fail indicator (configurable threshold, default 50%)
- Time taken vs. time allowed
- Question-by-question breakdown with correct answers and explanations
- Weak areas identified from this exam (feeds into TopicPerformance)

**Step 4 — Exam badge**
Award the "Exam Ready" badge on first exam completion.
Award "Distinction" badge for scoring 80%+ in exam mode.

**Step 5 — Exam history**
Filter `QuizSession` by `exam_mode=True` for a dedicated exam history view.
Students track their mock exam performance over time.
