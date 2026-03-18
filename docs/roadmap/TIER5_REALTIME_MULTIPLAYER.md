# Tier 5 — Real-Time Multiplayer

> Build this after Tier 4 has been shipped and the platform has meaningful
> concurrent usage. Real-time features require both a technical foundation
> and an active user base to justify the infrastructure cost and complexity.
> Without concurrent users, a live quiz room is just a solo quiz.

---

## Why a Separate Tier

Tiers 1–4 are all stateless or eventually-consistent features.
A student's quiz session, flashcard review, and peer challenge are all
independent HTTP requests. They do not require the server to maintain
live connections.

Tier 5 is categorically different:

1. **Stateful connections** — the server must hold an open WebSocket for
   every connected player for the duration of a game.
2. **Sub-second synchronisation** — all players must see the same question
   at the same time. Clock drift matters.
3. **Server-side game state** — the server runs the game loop. A crash mid-game
   is disruptive in a way that a failed quiz submission is not.
4. **Horizontal scaling complexity** — multiple Uvicorn workers must share
   game state via Redis pub/sub (Django Channels channel layer). This works,
   but requires Redis to be reliable, not just fast.

None of this is insurmountable. Django Channels handles it well.
But the operational complexity is higher than anything in Tiers 1–4,
which is why it belongs here.

---

## Prerequisites

Do not start Tier 5 until all of these are true:

| Requirement | Why |
|---|---|
| Tier 3 complete (Celery + Redis) | Channels needs a reliable Redis channel layer. Celery workers share the same Redis. Both must be stable. |
| Tier 4 shipped (study groups, peer challenges) | Social graph exists. Players have friends to invite. Empty lobbies are the death of multiplayer features. |
| 200+ monthly active users | You need concurrent users for live games. Specifically, you need clusters of friends who are online at the same time. |
| Redis uptime > 99.5% | A Redis restart kills all active game rooms. Reliability matters more here than anywhere else. |

---

## Feature: Quiz Battle

A live, synchronised competitive quiz between friends.
All players see the same question at the same time.
A shared countdown timer creates urgency.
Faster correct answers score more points.
Winner announced. Everyone ranked.

**Full specification:** `../multiplayer/QUIZ_BATTLE.md`

---

## The Technical Foundation

### Django Channels (already installed)

`channels==4.3.2` and `channels-redis==4.3.0` are already in
`requirements.txt`. The ASGI application is configured.
The channel layer infrastructure is sitting unused, waiting for this tier.

What needs adding:

```python
# lamla/asgi.py — extend existing config
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.quiz_battle.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

```python
# settings.py — extend existing config
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [env("REDIS_URL")]},
    }
}
```

### Room State in Redis

Each active game room has its state mirrored in Redis for fast reads
by any Uvicorn worker instance:

```
Key: battle_room:{room_code}
TTL: 2 hours (auto-expires abandoned rooms)
Value: {status, current_question_index, question_start_time, participant_scores}
```

PostgreSQL holds the persistent record. Redis holds the live game state.
On game finish, the Redis state is written back to PostgreSQL and the key expires.

---

## Scaling Considerations

**At low traffic (< 50 concurrent games):**
A single Uvicorn worker handles everything.
No special configuration needed beyond what's already in place.

**At moderate traffic (50–500 concurrent games):**
Run 2–4 Uvicorn workers behind a load balancer.
Django Channels channel layer (Redis pub/sub) ensures all workers
share the same channel groups. Players in the same room will receive
broadcasts regardless of which worker they're connected to.
This requires `sticky sessions` disabled — Redis handles the routing.

**At high traffic (500+ concurrent games):**
Redis becomes the bottleneck before Uvicorn does.
Consider Redis Cluster at that point.
This is a problem worth having.

---

## Build Sequence

### Step 1 — Data Models
Add `BattleRoom` and `BattleParticipant` to a new `quiz_battle` Django app.
Run migrations. No WebSocket work yet.

### Step 2 — REST Endpoints
- `POST /api/battle/create/` — generate questions, create room
- `POST /api/battle/join/` — validate code, create participant
- `GET /api/battle/{code}/` — room info
- `GET /api/battle/{code}/results/` — final leaderboard

At this point the lobby page can render (static, no live updates).

### Step 3 — WebSocket Consumer + Channel Routing
Write `BattleConsumer` in `apps/quiz_battle/consumers.py`.
Add channel routing to `routing.py`.
Register WebSocket URLs in `asgi.py`.
Handle `join_room` → `player_joined` broadcast.
Lobby is now live.

### Step 4 — Game Loop
Implement the server-side state machine:
- Countdown on host start
- Question broadcast with `question_start_time`
- `asyncio.sleep(time_per_question)` auto-advance
- Scoring on `submit_answer`
- `question_ended` broadcast
- `quiz_finished` broadcast and DB write

### Step 5 — Frontend
Build the 4 pages: create/join → lobby → play → results.
Implement `useQuizBattle` WebSocket hook.
Add clock synchronisation from `server_time` in payloads.

### Step 6 — Resilience
- Disconnection handling (promote host, preserve scores)
- Reconnection flow (rejoin in-progress game)
- Room expiry (Celery task to clean up abandoned lobbies)
- Graceful consumer shutdown (close rooms cleanly on server restart)

---

## When This Becomes Transformative

The Quiz Battle feature has a specific unlock condition beyond user count.

**It becomes valuable when friend groups are large enough to have 3+ people
online at the same time in the evenings.**

In the Ghanaian student context, this means:
- Students in the same school, polytechnic, or university cohort
- Study groups (built in Tier 4) that have an established study rhythm
- Exam season (WASSCE, mid-semester periods) when students cluster online

Target this launch timing deliberately. A soft launch during exam prep season
with existing Tier 4 study groups will generate far more engagement than a
quiet feature drop on a random Tuesday.

---

## Impact on Existing Features

| Existing Feature | Impact |
|---|---|
| Solo quiz generation | No change — battle reuses the same FastAPI pipeline |
| Quiz history | Battle sessions are tagged `is_battle=True`, appear in history |
| Badge system (Tier 1) | Add battle-specific badges (first win, perfect score, host a battle) |
| XP system (Tier 1) | Award XP for battles: participation + win bonus |
| Peer challenges (Tier 4) | Battle is live version; peer challenge is async version — both coexist |
| Study groups (Tier 4) | Group members can launch battles directly from group page |

---

## New Badges (Added to Tier 1 Badge System)

| Badge | Trigger |
|---|---|
| First Blood | Win your first battle |
| Battle Tested | Complete 10 battles |
| Flawless | Score 100% in a battle (all correct) |
| Speed Demon | Win a battle by speed bonus alone (scores tied on correct answers) |
| Host | Host 5 battles |
| Undefeated | Win 5 battles in a row |

---

## Summary

Tier 5 is one feature done extremely well: Quiz Battle.

It is the live, competitive version of what Tier 4's Peer Challenge does
asynchronously. It requires more infrastructure, but delivers a fundamentally
different experience — shared urgency, real-time tension, immediate results.

The infrastructure (Django Channels, Redis channel layer) is already installed.
The quiz generation pipeline is already built.
The social graph (friends, study groups) is built in Tier 4.

When those pieces are in place and the user base is active, Tier 5 is
the feature that turns Lamla from a study tool into a study event.

→ See `../multiplayer/QUIZ_BATTLE.md` for full technical specification.
