# Tier 4 — Social & Community

> Build these last. Social features require critical mass to be valuable —
> they are useless with 10 users and transformative with 1,000.
> Plant the data model seeds now. Harvest when the user base is ready.

---

## The Right Sequencing

Do not build social features early. The mistake most edtech platforms make
is building community features before there is a community. An empty
leaderboard is demoralising. An empty study group is abandoned.

The rule: when your monthly active user count crosses 200, revisit Tier 4.
Until then, plant the seeds (data model scaffolding only) and focus on
making individual learning deeply valuable.

What to do now: add foreign keys and model stubs. No views, no endpoints.
Migrations are cheap. Ripping out half-built social features is not.

---

## 1. Study Groups

### What It Does
Small cohorts of 5–10 students studying the same subject.
A group has:
- A shared materials library (curated subset of community materials)
- A group quiz challenge (everyone takes the same quiz, scores revealed after all submit)
- A group streak (the group's collective consecutive study days)
- A simple leaderboard (XP earned this week within the group)

Groups are invite-only or join-by-code. No open groups at launch —
open groups attract spam and require moderation infrastructure you
don't want to build early.

### Why It Matters
Accountability is one of the strongest predictors of habit formation.
Students in a study group study more consistently than students studying
alone, even when group interaction is minimal. The existence of peers
who can see your progress is sufficient.

In the Ghanaian education context specifically, collaborative study
(group learning) is already a cultural norm — the platform is meeting
students where they already are.

### Data Model Seed (Plant Now)

```python
class StudyGroup(models.Model):
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=200)
    invite_code = models.CharField(max_length=12, unique=True)  # random alphanumeric
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    max_members = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class StudyGroupMember(models.Model):
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="study_groups")
    role = models.CharField(max_length=20, choices=[("admin", "Admin"), ("member", "Member")])
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("group", "user")
```

### Implementation Strategy (When Ready)

**Phase 1 — Core group management**
- Create group (generates unique invite code)
- Join by code
- Leave group
- Group detail: member list with XP and streak data
- Group admin can remove members

**Phase 2 — Group quiz challenge**
- Admin creates a challenge: picks subject + difficulty
- System generates one quiz
- All members have 24 hours to take it
- After deadline (or all members submit), scores revealed
- Results page shows ranking within group

**Phase 3 — Group streak**
- Group has a collective streak counter
- Increments if at least 80% of members study on a given day
- Resets if fewer than 50% are active
- Displayed on group page and in member dashboards

**Moderation considerations:**
- Groups are named by creator — add basic profanity filter on name
- Report mechanism: flag a group to admins (simple email to ADMIN_EMAIL)
- Admins can deactivate groups from existing admin dashboard

---

## 2. Peer Quiz Challenges

### What It Does
A student challenges another student (by username) to a quiz.
Both students take the same quiz independently, without seeing each other's
answers. After both submit (or after 48 hours), scores are revealed
side by side.

The challenged student receives an in-app notification (and optionally
an email): *"@kofi challenged you to a Chemistry quiz. Accept?"*

### Why It Matters
This is the lowest-cost social feature with the highest viral potential.
Students talk. "I just beat Ama on the Thermodynamics quiz" is the kind
of thing that gets shared. It drives new signups without a marketing budget.

It also drives depth of use — students retake topics they were beaten on.

### LLM Cost Control
The quiz is generated once. The same question set is served to both
participants. One generation call, two uses.
The quiz is cached until both participants submit.

### Data Model Seed (Plant Now)

```python
class QuizChallenge(models.Model):
    challenger = models.ForeignKey(User, on_delete=models.CASCADE, related_name="challenges_sent")
    challenged = models.ForeignKey(User, on_delete=models.CASCADE, related_name="challenges_received")
    quiz_session_challenger = models.ForeignKey(
        QuizSession, null=True, on_delete=models.SET_NULL, related_name="challenge_as_challenger"
    )
    quiz_session_challenged = models.ForeignKey(
        QuizSession, null=True, on_delete=models.SET_NULL, related_name="challenge_as_challenged"
    )
    subject = models.CharField(max_length=200)
    difficulty = models.CharField(max_length=20)
    shared_questions = models.JSONField()         # same questions for both
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("completed", "Completed"),
            ("declined", "Declined"),
            ("expired", "Expired"),
        ],
        default="pending"
    )
    expires_at = models.DateTimeField()           # 48 hours from creation
    created_at = models.DateTimeField(auto_now_add=True)
```

### Implementation Strategy (When Ready)

**Step 1 — Challenge flow**
1. Challenger sends challenge: `POST /api/challenges/` with username + subject
2. System generates quiz, stores questions in `shared_questions`
3. In-app notification to challenged user
4. Challenged user accepts or declines

**Step 2 — Parallel quiz taking**
Each participant is served the same question set from `shared_questions`.
They submit independently. Their `QuizSession` FK is set on submission.

**Step 3 — Results reveal**
Once both have submitted (or 48h expires), `status` is set to `completed`.
Results page shows both scores, question-by-question comparison
(who got what right), and a "Rematch" button.

**Step 4 — Challenge leaderboard**
On user profiles, show: Challenges sent / Challenges won / Win rate.
This is a filter on existing QuizChallenge data. No new models.

---

## 3. Material Quality Ratings

### What It Does
Students rate community materials after downloading them.
A simple 1–5 star rating with an optional one-line comment.

Over time, highly-rated materials surface at the top of search results.
Low-rated materials (consistently below 2 stars) are flagged for admin review.

The uploader sees aggregate ratings on their materials.
Students see average ratings before downloading.

### Why It Matters
Currently, all materials are equal in the search results regardless of quality.
A well-structured, comprehensive PDF uploaded by a top student sits alongside
a blurry scan of half a textbook. Ratings fix this.

This also creates a reputation system for contributors. Students who
consistently share high-quality materials earn higher XP and
a "Top Contributor" badge. This incentivises quality uploads.

### Data Model Seed (Plant Now)

```python
class MaterialRating(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()   # 1–5
    comment = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("material", "user")   # one rating per user per material
```

You already have a `QuizExperienceRating` model in the dashboard app
with aggregation helpers. Mirror that pattern exactly.

### Implementation Strategy (When Ready)

**Step 1 — Rating endpoint**
`POST /api/materials/{id}/rate/` — requires download history
(only users who downloaded can rate, prevents vote manipulation).

**Step 2 — Aggregate on Material**
Add `avg_rating` and `rating_count` as cached fields on `Material`.
Update them via a signal on `MaterialRating` save.
Do not compute on every list request — too expensive.

**Step 3 — Sort by rating**
Extend material list view: `?sort=rating` orders by `avg_rating DESC`.
Default sort remains by `download_count` until ratings have enough volume.

**Step 4 — Auto-flag low-quality materials**
A weekly Celery task checks for materials with:
- 5+ ratings and average below 2.0
- Flag them with `needs_review=True`
- Admin dashboard surfaces them for inspection

**Step 5 — Top Contributor badge and XP**
Add to the badge system:
- "Rising Star" — first material rated 4+ stars
- "Top Contributor" — 3+ materials with average 4+ stars
- Bonus XP when a material crosses 10 downloads with 4+ star rating

---

## Community Health Principles

These are non-negotiable for any community feature you build:

**1. Pseudonymity is default**
Students display their username, not their real name.
Profile images are optional.
This reduces social anxiety about being seen to fail.

**2. Positive-sum competition only**
Leaderboards show improvement over time (XP gained this week),
not absolute rankings. Absolute rankings demotivate students at the bottom.
"You moved up 12 positions this week" is encouraging.
"You're ranked 847th overall" is not.

**3. Opt-out of social features**
A user should be able to make their profile private:
- Not appear in leaderboards
- Not receive challenge requests
- Not have their ratings attributed to their username

This is both ethical and legally important for privacy compliance.

**4. No public chat or messaging**
A general-purpose chat feature between students is a moderation
nightmare at any scale. All AI interaction is with the Lamla tutor,
not between students. Study group interaction is limited to
challenges and shared materials — no freeform messaging.

**5. Report everything**
Every piece of user-generated content (materials, comments, group names)
has a report button that sends an email to the admin.
Keep it simple. A complex reporting workflow is a feature you don't
have time to build. An email to ADMIN_EMAIL is fine at this scale.
