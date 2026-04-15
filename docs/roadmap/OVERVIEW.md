# Lamla AI — Intelligent EdTech Roadmap

> Goal: Build a platform that doesn't just quiz students — one that knows them as learners,
> identifies exactly where they struggle, and focuses every session on the highest-leverage
> thing to study next. A personal tutor for every student.

---

## Current State

| Feature | Status | Gap |
|---|---|---|
| Quiz generation (MCQ + short answer) | ✅ Live | Static difficulty |
| AI chatbot tutor with file context | ✅ Live | — |
| Flashcards with SM-2 spaced repetition | ✅ Live | — |
| Community material sharing | ✅ Live | Not indexed by concept |
| Study streak tracking | ✅ Live | No meaningful milestones |
| Admin dashboard + analytics | ✅ Live | — |
| Weak Area Detection Engine | ✅ Live | — |
| Spaced Quiz Scheduling (SM-2 on topics) | ✅ Live | — |
| Chatbot user performance awareness | ✅ Live | — |
| Exam Simulation Mode (flag) | ✅ Live (backend) | Frontend UX not built yet |

---

## The Roadmap

### Tier 1 — Low/No LLM Cost, High Impact
*Build first. Pure database and logic work. No API spend.*

- **Weak Area Detection Engine** — topic-level performance map per user
- **Spaced Quiz Scheduling** — SM-2 applied to quiz topics, not just flashcards
- **Daily Study Plan** — computed recommendations at login, zero LLM cost
- **Milestone & Badge System** — XP tied to real learning milestones
- **Weekly Progress Email Digest** — Celery task, no LLM, keeps users returning
- **Exam Simulation Mode** — timed full-length mock exams from existing quiz engine

→ See `TIER1_LOW_COST_HIGH_IMPACT.md`

---

### Tier 2 — Moderate LLM Cost, High Leverage
*LLM calls that are batched, cached, or one-time — controlled spend.*

- **Post-Quiz Mistake Analysis** — one LLM call per quiz session, cached
- **Smart Material Summarizer** — one-time call per upload, shared across all downloaders
- **Socratic Tutor Mode** — prompt engineering toggle, no architecture change
- **AI Mistake Patterns (Weekly)** — batched background job, one call per user per week

→ See `TIER2_MODERATE_LLM.md`

---

### Tier 3 — Architecture Investments
*Makes everything else scale without burning money.*

- **Celery Task Queue** — async LLM calls, no timeouts, controlled throughput
- **Per-User Daily LLM Budget** — Redis counter, graceful degradation, cost control
- **Concept Tagging on Materials** — searchable by idea, not just filename
- **Content Intelligence Layer** — link quiz sessions to materials, build platform-wide knowledge

→ See `TIER3_ARCHITECTURE.md`

---

### Tier 4 — Social & Community
*Plant seeds now, harvest later. Requires careful design.*

- **Study Groups** — small cohorts, shared materials, group challenges
- **Peer Quiz Challenges** — same quiz, scores revealed after, organic virality
- **Material Quality Ratings** — surface best community content over time

→ See `TIER4_SOCIAL_COMMUNITY.md`

---

### Tier 5 — Real-Time Multiplayer
*Build after Tier 4 ships and concurrent usage is established.*

- **Quiz Battle** — live competitive quiz between friends; same questions, shared timer, winner ranked in real-time

The infrastructure (Django Channels + Redis channel layer) is already installed.
This tier unlocks when friends can reliably find each other online at the same time.
Requires 200+ MAU and an active social graph from Tier 4.

→ See `TIER5_REALTIME_MULTIPLAYER.md`

---

## Voluntary Support Model

Before any of the above — ship a "Support Our Work" page:
- Single one-time Paystack payment (any amount)
- No feature gating, no paywalls
- Donor badge visible on their profile
- One-time implementation, zero ongoing maintenance

This funds the API costs while the platform grows.

---

## The Closed Learning Loop (North Star)

```
Student uploads syllabus / study material
  → Platform extracts key concepts (one-time LLM call)
  → Generates targeted flashcards and quizzes
  → Tracks exactly what they know vs. don't know
  → Surfaces the highest-leverage thing to study next
  → After each session, explains their specific mistakes
  → Adjusts next week's plan based on performance
  → Weekly digest shows progress trends and motivates return
```

This loop — fully closed — is what turns a quiz tool into a tutor.

---

## Build Sequence

```
Week 1–2    Weak area detection + topic tagging
Week 3      Spaced quiz scheduling
Week 4      Daily study plan + weekly email digest
Week 5      Milestone / badge system
Week 6      Exam simulation mode
Week 7      Post-quiz mistake analysis (LLM, cached)
Week 8      Smart material summarizer (LLM, one-time per upload)
Week 9      Celery queue + per-user daily LLM budget
Week 10     Socratic tutor mode toggle
Ongoing     Concept tagging, peer challenges, study groups
After 200 MAU  Quiz Battle (Tier 5)
```
