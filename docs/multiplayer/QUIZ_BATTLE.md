# Quiz Battle — Real-Time Competitive Quiz

> A live, synchronised multiplayer quiz where friends compete on the same topic
> at the same time. One winner. Everyone ranked. Built on Django Channels + WebSockets.

---

## What It Does

A host creates a battle room and chooses a topic or pastes study material.
Friends join using a 6-character room code. When the host starts, every
participant sees the same question at the same time with a shared countdown.
Answers are locked in as submitted. After each question the correct answer
is revealed and a live leaderboard updates. At the end, the winner is
celebrated and all participants are ranked.

**The flow from a student's perspective:**

```
Host                                   Friends
─────────────────────────────────────────────────────────
Choose topic / paste text
Generate questions (existing pipeline)
Room created → 6-char code displayed
Share code with friends ──────────────→ Enter code → Join lobby
See participants joining live          See other participants
Press "Start Battle" ─────────────────→ All see 3-2-1 countdown
                                       All see Question 1 + timer
Submit answer (locked in)              Submit answer (locked in)
Timer expires
← Correct answer revealed to all →
← Mini leaderboard shown to all →
Question 2 auto-advances
... (repeats for all questions)
← Full results: winner + ranked list →
```

---

## Architecture

```
Next.js Clients
    │
    ├─ REST (room create / join)
    │       ↓
    │   Django REST endpoints
    │       ↓
    │   PostgreSQL (room + participant records)
    │
    └─ WebSocket (live game state)
            ↓
        Django Channels Consumer
            ↓
        Redis Channel Layer (pub/sub)
        (one channel group per room: "quiz_battle_{room_code}")
```

The server is the single source of truth for all game state.
No client can advance questions, extend timers, or modify scores.

---

## Data Models

```python
# apps/quiz_battle/models.py

class BattleRoom(models.Model):
    room_code = models.CharField(max_length=6, unique=True, db_index=True)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name="hosted_rooms")
    topic = models.CharField(max_length=300, blank=True)
    source_text = models.TextField(blank=True)   # extracted from file or pasted
    questions = models.JSONField(default=list)    # generated once, same for all
    question_count = models.PositiveIntegerField(default=10)
    time_per_question = models.PositiveIntegerField(default=20)  # seconds
    status = models.CharField(
        max_length=20,
        choices=[
            ("lobby",      "Lobby"),
            ("countdown",  "Countdown"),
            ("active",     "Active"),
            ("finished",   "Finished"),
        ],
        default="lobby",
    )
    current_question_index = models.IntegerField(default=-1)
    question_start_time = models.DateTimeField(null=True)   # server timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["room_code", "status"])]


class BattleParticipant(models.Model):
    room = models.ForeignKey(BattleRoom, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="battle_rooms")
    score = models.IntegerField(default=0)
    answers = models.JSONField(default=dict)   # {question_index: {answer, correct, points, ms}}
    rank = models.PositiveIntegerField(null=True)
    is_ready = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True)

    class Meta:
        unique_together = ("room", "user")
        indexes = [models.Index(fields=["room", "score"])]
```

---

## WebSocket Events

### Client → Server

| Event | Payload | When |
|---|---|---|
| `join_room` | `{room_code, token}` | Player connects |
| `host_start` | `{}` | Host starts the game |
| `submit_answer` | `{question_index, answer}` | Player submits answer |
| `host_abort` | `{}` | Host cancels before start |

### Server → Client (broadcast to all in room)

| Event | Payload | When |
|---|---|---|
| `room_state` | full room snapshot | On join |
| `player_joined` | `{user, participant_count}` | Someone joins lobby |
| `player_left` | `{user}` | Someone disconnects from lobby |
| `countdown_started` | `{seconds: 3}` | Host pressed start |
| `question_started` | `{index, question, total, server_time, duration}` | Each new question |
| `answer_locked` | `{user, question_index}` | Confirm to submitter only |
| `question_ended` | `{correct_answer, explanation, scores}` | Timer expired or all answered |
| `quiz_finished` | `{leaderboard: [{rank, user, score, accuracy}]}` | All questions done |
| `room_aborted` | `{reason}` | Host aborted |
| `error` | `{code, message}` | Invalid actions |

---

## Server-Side State Machine

```
LOBBY
  │  host_start received
  ↓
COUNTDOWN (3 seconds, server sleeps asyncio)
  │  countdown expires
  ↓
ACTIVE — question loop:
  │  broadcast question_started
  │  server sets question_start_time
  │  wait time_per_question seconds (asyncio.sleep)
  │     ↳ if all players answered early → advance immediately
  │  broadcast question_ended with correct answer + scores
  │  loop for next question
  │
  │  last question done
  ↓
FINISHED
  broadcast quiz_finished with full leaderboard
  persist ranks to BattleParticipant
```

The auto-advance loop runs in the consumer's async context using
`asyncio.sleep`. This means the server controls timing absolutely —
a slow client, a dropped connection, or a cheating attempt cannot
interfere with question progression for other players.

---

## Scoring Algorithm

```python
BASE_POINTS = 1000
TIME_BONUS_MAX = 500

def calculate_points(is_correct: bool, time_taken_ms: int, time_limit_ms: int) -> int:
    if not is_correct:
        return 0
    speed_ratio = max(0, 1 - (time_taken_ms / time_limit_ms))
    time_bonus = int(TIME_BONUS_MAX * speed_ratio)
    return BASE_POINTS + time_bonus
```

- Correct answer within the time limit: **1000 + up to 500 speed bonus**
- Wrong answer or no answer: **0 points**
- Maximum per question: **1500 points**
- A 10-question battle has a maximum possible score of **15,000 points**

Speed bonus rewards decisive, confident answers without punishing
slightly slower but still correct submissions.

---

## REST API Endpoints

These run before the WebSocket connection is established.

```
POST   /api/battle/create/         Create room, generate questions
                                   Body: {topic, source_text?, question_count?, time_per_question?}
                                   Returns: {room_code, room_id, expires_at}

POST   /api/battle/join/           Validate room code and join
                                   Body: {room_code}
                                   Returns: {room_code, room_id, host, participant_count}

GET    /api/battle/{code}/         Get room info (for lobby page load)
                                   Returns: full room state + participants

GET    /api/battle/{code}/results/ Final leaderboard after game ends
                                   Returns: {leaderboard, room summary, your rank}
```

Question generation reuses the existing FastAPI pipeline.
The host triggers generation on room creation. Questions are stored in
`BattleRoom.questions` and served identically to every participant —
one LLM call, N players.

---

## Frontend Pages

### `/quiz/battle/`
Landing page. Two actions: **Create Battle** (host) or **Join Battle** (friend).

**Create Battle flow:**
1. Choose topic — paste text, type subject, or select from existing quiz history
2. Set options — question count (5 / 10 / 15) and time per question (10 / 20 / 30s)
3. Generate questions (loading state, reuses existing quiz API)
4. Room created → large room code displayed with share button

**Join Battle flow:**
1. Enter 6-character code
2. Validate code → redirect to lobby

---

### `/quiz/battle/lobby/[code]`
Waiting room. Updates in real-time via WebSocket.

```
┌─────────────────────────────────────────────────┐
│  Battle Room: XK7F2P                            │
│  Topic: Thermodynamics                          │
│                                                 │
│  Players (3/10)                                 │
│  ● Kofi (HOST)                                  │
│  ● Ama                                          │
│  ● Yaw                                          │
│                                                 │
│  Share code: XK7F2P  [Copy link]               │
│                                                 │
│  [Start Battle ▶]   ← host only               │
└─────────────────────────────────────────────────┘
```

Player avatars animate in as friends join. The Start button is only visible
to the host and activates when at least 2 players are present.

---

### `/quiz/battle/play/[code]`
The live quiz. Server controls everything. Client is display-only.

```
┌─────────────────────────────────────────────────┐
│  Question 3 of 10          ⏱ 14s               │
│  [═══════════════════░░░░░░░░░░░░░░░░]          │
│                                                 │
│  Which of the following best describes          │
│  Le Chatelier's Principle?                      │
│                                                 │
│  [A] A system at equilibrium resists change     │
│  [B] Reactions always favour the products      │
│  [C] Temperature determines reaction rate      │
│  [D] Entropy always increases                  │
│                                                 │
│  Kofi ✓  Ama ✓  Yaw ...                        │
└─────────────────────────────────────────────────┘
```

After answer submitted: selected option highlighted, others dimmed, locked.
After timer: correct answer turns green, wrong answers turn red, scores flash.
Mini leaderboard shown for 3 seconds before next question advances.

---

### `/quiz/battle/results/[code]`
Final results page.

```
┌─────────────────────────────────────────────────┐
│              🏆 BATTLE COMPLETE                 │
│                                                 │
│  1st   Ama          12,400 pts   ████████████  │
│  2nd   Kofi         10,850 pts   ██████████    │
│  3rd   Yaw           8,200 pts   ████████      │
│                                                 │
│  You answered 8/10 correctly (80%)             │
│  Your fastest answer: 2.3s                     │
│                                                 │
│  [Play Again — Same Topic]  [New Topic]        │
│  [Challenge Someone Else →]                    │
└─────────────────────────────────────────────────┘
```

Ranking is animated in from bottom to top. Winner gets a brief
celebration moment (confetti, sound optional). Each player's row
shows score, accuracy, and their personal stats for the session.

---

## WebSocket Hook (Frontend)

```typescript
// src/hooks/useQuizBattle.ts

interface BattleState {
  status: 'lobby' | 'countdown' | 'active' | 'finished'
  participants: Participant[]
  currentQuestion: Question | null
  questionIndex: number
  totalQuestions: number
  timeLeft: number
  serverTimeOffset: number   // clock sync delta
  leaderboard: LeaderboardEntry[]
  myAnswer: string | null
  myScore: number
}

export function useQuizBattle(roomCode: string) {
  // Connects to ws://.../ws/battle/{roomCode}/?token={authToken}
  // Manages reconnection (max 3 attempts, exponential backoff)
  // Returns: state + actions (submitAnswer, startBattle)
}
```

**Clock synchronisation:**
On `question_started`, the payload includes `server_time` (UTC ISO string).
The frontend computes `offset = Date.now() - Date.parse(server_time)` and
uses `timeLeft = duration - (Date.now() - Date.parse(server_time) - offset)`.
This ensures all players see the same timer regardless of network latency.

---

## Authentication Over WebSocket

Django Channels cannot read HTTP-only cookies. Pass the DRF token
as a query parameter on connection:

```
ws://api.lamla.com/ws/battle/XK7F2P/?token=abc123
```

In the consumer's `websocket_connect` handler, extract and validate
the token before accepting the connection. Reject unauthenticated
connections immediately.

```python
class BattleConsumer(AsyncWebsocketConsumer):
    async def websocket_connect(self, message):
        token = self.scope["query_string"].decode().split("token=")[-1]
        user = await self.authenticate_token(token)
        if not user:
            await self.close(code=4001)
            return
        self.user = user
        await self.accept()
```

---

## Infrastructure Requirements

| Component | Requirement | Status |
|---|---|---|
| Django Channels | `channels==4.3.2` | Already installed |
| Redis channel layer | `channels-redis==4.3.0` | Already installed |
| ASGI server (Uvicorn) | Required for WebSockets | Already installed |
| Redis server | Shared with existing cache | Must be running |
| ASGI routing | Add battle URLs to `asgi.py` | Needs adding |
| WebSocket CSP | `ws://` allowlisted | Already configured |

No new infrastructure purchases needed.

---

## Implementation Phases

### Phase 1 — Room Management (REST only, no WebSocket)
- `BattleRoom` and `BattleParticipant` models + migration
- Create room endpoint (generates questions via existing pipeline)
- Join room endpoint (validates code, creates participant row)
- Room detail endpoint
- Frontend: create/join page + lobby page (static, no live updates)

*Deliverable: Friends can create and join rooms. No live game yet.*

### Phase 2 — Live Lobby (WebSocket, no gameplay)
- `BattleConsumer` WebSocket consumer
- Channel group routing in `asgi.py`
- Handle `join_room`, `player_joined`, `player_left` events
- Frontend lobby updates live as players join
- Host can see participant count in real-time

*Deliverable: The lobby feels alive. Joining is exciting.*

### Phase 3 — Synchronised Gameplay
- Server state machine (countdown → question loop → finished)
- `submit_answer` handler with scoring
- `asyncio.sleep`-based auto-advance
- `question_ended` broadcast with answer reveal + mini leaderboard
- `quiz_finished` broadcast
- Frontend play page + results page
- Persist final scores and ranks

*Deliverable: Full end-to-end battle works.*

### Phase 4 — Polish
- Clock synchronisation for timer accuracy
- Reconnection handling (player drops mid-game → rejoin → resume)
- Spectator mode (join after game started, view only)
- Room expiry (clean up abandoned lobbies after 30 minutes)
- Battle history in user profile

---

## Prerequisites

This feature **requires** the following to be in place before building:

1. **Redis** — must be running (needed for channel layer pub/sub)
2. **Celery** (Tier 3) — question generation should be async before launch,
   otherwise room creation blocks for 10–20 seconds during peak load
3. **At minimum 200 MAU** — an empty battle lobby is demoralising.
   The feature only delivers value when friends can actually find each other.
   See Tier 4 threshold guidance.

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Host disconnects mid-game | Longest-connected player is promoted to host. If no one remains, room aborted. |
| Player disconnects mid-game | Marked as disconnected. Existing answers and score preserved. Reconnect resumes. |
| All players answer before timer | Server advances early (no need to wait full duration). |
| Only 1 player left | Game continues solo. Results shown normally. |
| Room code collision | `room_code` is generated with retry-until-unique logic. Collision probability at scale is negligible with 6 alphanumeric chars (2.1 billion combinations). |
| LLM generation fails | Room creation returns error before any WebSocket connection is opened. No zombie rooms. |

---

## Related Documents

- `../roadmap/TIER5_REALTIME_MULTIPLAYER.md` — where this fits in the build roadmap
- `../roadmap/TIER4_SOCIAL_COMMUNITY.md` — social prerequisites (study groups, peer challenges)
- `../features/QUIZ.md` — the solo quiz engine this feature builds on
- `../architecture-design/ARCHITECTURE.md` — overall system architecture
