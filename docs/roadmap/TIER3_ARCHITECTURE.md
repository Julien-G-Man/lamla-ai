# Tier 3 — Architecture Investments

> These are not features students see directly. They are the infrastructure
> changes that make every other feature reliable, fast, and affordable at scale.
> Build these in parallel with Tier 2 — they are the foundation Tier 2 depends on.

---

## Why Architecture Matters Here

The current platform makes LLM calls synchronously in Django views.
This works for low traffic, but breaks under three conditions:

1. **Timeouts** — LLM calls regularly take 10–40 seconds.
   Gunicorn workers time out. Users see errors.

2. **Cost unpredictability** — Without budgets, a single power user
   can exhaust the monthly API budget in an afternoon.

3. **Coupling** — If the AI provider is slow or down, every feature
   that touches it is broken. Users cannot even load their dashboard.

These three investments fix all of that.

---

## 1. Celery Task Queue

### What It Does
Moves all LLM calls off the HTTP request/response cycle into a background
queue. The user gets an immediate response. The AI work happens separately.

**Before:**
```
User submits quiz → Django waits 20s for LLM → Response returned
(if LLM times out, user sees 500 error)
```

**After:**
```
User submits quiz → Django returns score immediately (< 200ms)
→ Celery task queued → LLM called in background
→ Analysis ready 15s later → User polls or WebSocket delivers it
```

### Why It Matters
This changes the perceived performance of the entire platform.
Users never wait for AI. They also never see AI errors — if a task fails,
it retries silently. The HTTP layer is always fast and reliable.

### You Already Have Redis
Redis is already in the stack (used for caching and throttling).
Celery with Redis as the broker requires no new infrastructure.

### Implementation Strategy

**Step 1 — Install and configure Celery**
```python
# lamla/celery.py
from celery import Celery
app = Celery("lamla")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

```python
# settings.py additions
CELERY_BROKER_URL = env("REDIS_URL")
CELERY_RESULT_BACKEND = env("REDIS_URL")
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TASK_TIME_LIMIT = 120          # hard kill after 2 min
CELERY_TASK_SOFT_TIME_LIMIT = 90      # graceful timeout at 90s
CELERY_WORKER_MAX_TASKS_PER_CHILD = 50  # prevent memory leaks
```

**Step 2 — Convert LLM calls to tasks**
For each LLM-heavy view, extract the AI call into a `@shared_task`:

```python
# apps/quiz/tasks.py
@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def generate_mistake_analysis(self, quiz_session_id):
    try:
        # ... fetch session, call LLM, save result
    except SoftTimeLimitExceeded:
        logger.warning("Mistake analysis timed out for session %s", quiz_session_id)
    except Exception as exc:
        raise self.retry(exc=exc)
```

**Step 3 — Task status polling**
For features where the user waits for a result, return a `task_id` immediately:
```json
{"status": "processing", "task_id": "abc-123", "poll_url": "/api/quiz/tasks/abc-123/"}
```

A lightweight `GET /api/tasks/{task_id}/` endpoint queries Celery's result
backend and returns `pending`, `success`, or `failure`.

**Step 4 — Celery Beat for scheduled tasks**
All weekly batch jobs (digest emails, mistake pattern analysis) run via
Celery Beat, the periodic task scheduler. It runs as a separate process
alongside the Celery worker.

**Step 5 — Worker deployment**
On Render (your existing deployment): add a second service of type "Background Worker"
running `celery -A lamla worker --loglevel=info`.
Celery Beat runs as a third service: `celery -A lamla beat --loglevel=info`.
Both share the same Redis instance already in use.

**Retry strategy:**
- Max 2 retries for LLM tasks (exponential backoff: 10s, 20s)
- No retries for weekly batch tasks (they wait until next week)
- Dead letter queue logging for tasks that exhaust retries

---

## 2. Per-User Daily LLM Budget

### What It Does
Each user has a daily token/call budget tracked in Redis.
When the budget is exhausted, AI features degrade gracefully — they
don't fail, they queue for tomorrow.

Free users get a standard daily budget.
Users who have made a voluntary donation get a higher budget.
Admins are exempt.

The student sees:
> "You've used today's AI analysis quota. Your mistake analysis will
> be ready tomorrow, or donate to unlock more — it directly funds
> our server costs."

### Why It Matters
Without this, a small number of heavy users can consume most of the
monthly API budget. With it, the spend is predictable and fair.
It also creates a natural, non-coercive path to donation.

### Implementation Strategy

**Step 1 — Budget configuration in SystemSettings**
Add to the existing SystemSettings model:
```python
daily_llm_calls_free = models.IntegerField(default=10)
daily_llm_calls_donor = models.IntegerField(default=30)
```
Admins set this from the existing admin dashboard. No redeploy needed.

**Step 2 — Redis budget tracker**
```python
# apps/core/llm_budget.py

def get_budget_key(user_id):
    today = date.today().isoformat()
    return f"llm_budget:{user_id}:{today}"

def check_and_consume_budget(user_id, is_donor=False, is_admin=False):
    """Returns True if call is allowed, False if budget exhausted."""
    if is_admin:
        return True

    limit = settings.daily_llm_calls_donor if is_donor else settings.daily_llm_calls_free
    key = get_budget_key(user_id)

    current = cache.get(key, 0)
    if current >= limit:
        return False

    cache.incr(key)                    # atomic increment
    cache.expire(key, 86400)           # TTL: 24 hours
    return True
```

**Step 3 — Decorator for LLM tasks**
```python
def llm_budget_required(func):
    """Decorator for Celery tasks that consume LLM budget."""
    def wrapper(user_id, *args, **kwargs):
        user = User.objects.get(id=user_id)
        if not check_and_consume_budget(user_id, is_donor=user.is_donor):
            logger.info("LLM budget exhausted for user %s", user_id)
            return {"status": "budget_exhausted"}
        return func(user_id, *args, **kwargs)
    return wrapper
```

**Step 4 — Budget status in dashboard**
Include in the dashboard response:
```json
{
  "llm_budget": {
    "used": 7,
    "limit": 10,
    "resets_in_hours": 14
  }
}
```
Frontend renders a subtle usage indicator. Not prominent — just informative.

**Step 5 — Graceful degradation, not hard blocking**
When budget is exhausted, async tasks are queued with `eta=tomorrow_8am`
rather than dropped. The student is told their analysis will arrive tomorrow.
This is more respectful than a hard error.

---

## 3. Concept Tagging on Materials

### What It Does
When a material is processed by the Smart Material Summarizer (Tier 2),
the subject tags generated are stored in a searchable, indexed structure.
The materials library becomes searchable by concept, not just filename.

Additionally, the platform links quiz sessions to their source materials.
This enables platform-wide intelligence:

> "This PDF on Cell Biology has been used by 340 students.
> Their average quiz score on it is 58%.
> The hardest question from it is about the Krebs cycle."

### Why It Matters
Without concept tagging, the materials library is a file dump.
With it, it becomes a curated, searchable knowledge base where good
materials surface naturally and poor ones sink.

### Implementation Strategy

**Step 1 — Normalise tags into a proper table**
Rather than just storing tags as JSON on `MaterialIntelligence`,
create a lightweight tag model for queryability:

```python
class ConceptTag(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)

class MaterialTag(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="tags")
    tag = models.ForeignKey(ConceptTag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("material", "tag")
```

**Step 2 — Populate tags after material intelligence runs**
When `generate_material_intelligence` completes, call a helper that
normalises each tag string (lowercase, strip), gets-or-creates `ConceptTag`,
and creates `MaterialTag` links.

**Step 3 — Update search**
Extend the material list view search to include a tag filter:
`GET /api/materials/list/?tags=cell+biology,mitosis`

The ORM query joins through `MaterialTag` to filter by concept.

**Step 4 — Tag cloud / browse by concept**
`GET /api/materials/tags/` returns the top 50 most-used tags with counts.
Frontend renders a browsable tag cloud on the materials page.

**Step 5 — Link QuizSession to Material**
Add an optional FK to `QuizSession`:
```python
source_material = models.ForeignKey(
    "materials.Material", null=True, blank=True, on_delete=models.SET_NULL
)
```
When a quiz is generated from a material (detected by the presence of
material-extracted text in the payload), set this FK.
This enables the platform intelligence described above.

---

## 4. Content Intelligence Layer

### What It Does
As data accumulates, build a read-only intelligence layer that answers
platform-wide questions:

- Which topics do students struggle with most? (across all users, not just one)
- Which materials produce the best learning outcomes?
- What is the optimal quiz length for a given subject?
- At what time of day are students most likely to complete a study session?

This data lives in the admin dashboard and informs platform decisions.
It also feeds back into content generation — if 70% of students fail
questions on the Krebs cycle, the AI knows to generate more
beginner-level questions on that topic by default.

### Why It Matters
Individual user intelligence (Tier 1) personalises the experience.
Platform intelligence improves the product for everyone.
This is how the platform gets smarter over time without additional LLM cost.

### Implementation Strategy

**Step 1 — Aggregate views (database, no LLM)**
Create DB views or materialised query results for:
- `TopicDifficulty`: average accuracy per topic, across all users
- `MaterialEffectiveness`: average quiz score for sessions linked to a material
- `SessionCompletionRate`: % of quiz sessions submitted vs. generated

These are pure SQL aggregates on existing data. No new models needed.

**Step 2 — Admin dashboard endpoints**
Add to the existing `AdminDashboardStatsView`:
```json
{
  "hardest_topics": [
    {"topic": "Krebs Cycle", "avg_accuracy": 0.34, "attempts": 892},
    ...
  ],
  "best_materials": [
    {"material_id": 12, "title": "...", "avg_score": 0.81, "quiz_count": 156},
    ...
  ]
}
```

**Step 3 — Feed back into quiz generation**
When generating a quiz for a topic known to be hard platform-wide,
bias toward `difficulty=beginner` as the default rather than `intermediate`.
This is a config change — map topic difficulty scores to default difficulty
levels without changing the generation API.

**Step 4 — Trend detection**
Extend the existing usage trends endpoint (7–90 day configurable)
to include accuracy trends per subject over time.
This tells you whether students are improving in a given subject as a cohort.

**Step 5 — Data retention policy**
Establish a clear policy now before data grows:
- Raw quiz answers: retain for 1 year, then anonymise
- Topic performance data: retain indefinitely (aggregated, not personal)
- Chat messages: retain for 90 days per user (configurable)
- Material intelligence: retain indefinitely

Document this in a PRIVACY.md file and ensure it aligns with any applicable
data protection regulations (Ghana's Data Protection Act, 2012).
