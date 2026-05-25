# Agent Implementation — Lamla AI

---

## 1. What Agent Means Here

Agent is a pattern where the AI receives a typed list of capabilities (tools), can request
to call them instead of generating a final response, and continues reasoning over the results
until it produces a definitive answer.

In Lamla this means:
- The AI receives tool definitions (name, description, JSON Schema) at the start of a request.
- The AI can respond with a `tool_use` block instead of text.
- The executor runs the tool in-process and returns the result to the AI.
- The loop repeats until `stop_reason == end_turn` or `max_iterations` is hit.

---

## 2. Architecture

```
React
  │  POST /api/chat/
  ▼
Django (API Gateway)
  ├── Auth & session management
  ├── Fetch user stats from DB (compact, ~60 tokens)
  ├── Extract file text (file uploads)
  ├── Persist messages (ChatMessage)
  └── Forward to FastAPI
          │  POST /agent/chat
          ▼
       FastAPI (AI Service)
          ├── Build minimal system prompt (prompts.py)
          ├── Run agent loop (router.py)
          │     ├── kb_search  → ai_service/kb/ provider
          │     └── web_search → Tavily
          └── Return { "response": str }
```

Django owns all DB work. FastAPI owns all AI work. No prompt construction in Django.

---

## 3. Architectural Boundaries

| Layer | Responsibility |
|---|---|
| Django | Auth, session/message persistence, user stats, file extraction |
| FastAPI | System prompt, agent loop, tool orchestration, LLM calls |
| Agent tools | Atomic capabilities (kb_search, web_search, generate_quiz, …) |

Django never builds prompts. FastAPI never writes to the DB.

---

## 4. File Structure

```
ai_service/
  core/
    ai_client.py         # generate_content() + generate_with_tools()
  agent/
    prompts.py           # All system prompt construction (build_chat_system_prompt, etc.)
    schemas.py           # ToolDefinition, ToolCall, ToolResult, OrchestratorRequest/Response, ChatRequest
    registry.py          # TOOL_REGISTRY, get_definitions(), get_handler()
    executor.py          # execute_tool() — 5 error classes, per-tool timeouts, never raises
    router.py            # Route handlers only: /tools, /call, /orchestrate, /chat
    tools/
      youtube.py         # extract_youtube_transcript()
      evaluate.py        # evaluate_answer()
      summarize.py       # summarize_text()
      search.py          # search_web() via Tavily
  kb/
    base.py              # KBSearchProvider ABC
    tfidf_provider.py    # Default — token overlap + keyword/heading boost
    loader.py            # Resolves KB file path, instantiates provider, exposes kb_store singleton
  platform_kb/
    text_embeddings.json # Platform knowledge chunks (single source of truth)
  services/
    quiz/                # POST /quiz/ — standalone quiz generation
    flashcards/          # POST /flashcards/ — standalone flashcard generation

backend/apps/chatbot/
  async_views.py         # Proxy views: fetch stats, forward to /agent/chat, persist response
  helpers.py             # Session/auth/DB helpers and _fetch_user_performance_sync()
```

---

## 5. Registered Tools

All tools live in `ai_service/agent/registry.py`.
Handlers run in-process — no internal HTTP round-trips.

| Tool | Handler | Notes | Timeout |
|---|---|---|---|
| `kb_search` | `kb/loader.py` singleton | Platform knowledge retrieval | 5s |
| `search_web` | `tools/search.py` | Tavily — agent decides when to call | 12s |
| `extract_youtube_transcript` | `tools/youtube.py` | Deterministic API call | 30s |
| `summarize_text` | `tools/summarize.py` | LLM — truncation fallback on failure | 30s |
| `evaluate_answer` | `tools/evaluate.py` | LLM + string-match fallback | 25s |
| `generate_quiz` | inline in registry.py | LLM via quiz service | 90s |
| `generate_flashcards` | inline in registry.py | LLM via flashcards service | 45s |
| `explain_concept` | inline in registry.py | LLM | 20s |

### Chatbot tool subset

`POST /agent/chat` only exposes `kb_search` and `search_web` to the AI.
The other tools (quiz generation, YouTube, etc.) are available via `POST /agent/orchestrate`
when called with the appropriate tool whitelist.

### Input/output schemas

**kb_search**
```
query: str, top_k: int = 4
-> {chunks: [{heading, text}]}
```

**search_web**
```
query: str, num_results: int = 3
-> {results: [{title, url, snippet}]}
```

**extract_youtube_transcript**
```
url: str
-> {text: str, title: str, video_id: str}
```

**summarize_text**
```
text: str, max_words: int = 300, focus: str = ""
-> {summary: str}
```

**evaluate_answer**
```
question: str, correct_answer: str, user_answer: str
-> {is_correct: bool, score: float, reasoning: str}
```

**generate_quiz**
```
study_text: str, subject: str,
difficulty: "easy" | "medium" | "hard" = "medium",
num_mcq: int = 5, num_short: int = 0
-> {mcq_questions: list, short_questions: list, subject: str, difficulty: str}
```

**generate_flashcards**
```
text: str, subject: str, num_cards: int = 10,
difficulty: str = "intermediate", prompt: str = ""
-> {cards: [{question, answer}]}
```

**explain_concept**
```
question: str, answer: str
-> {explanation: str}
```

---

## 6. Executor

`agent/executor.py` dispatches every tool call and handles all failure modes.
It never raises — errors surface through `ToolResult.error`.

| Exception caught | Cause | Log level |
|---|---|---|
| `KeyError` | Unknown tool name | ERROR |
| `asyncio.TimeoutError` | Per-tool timeout exceeded | WARNING |
| `TypeError` | AI passed wrong argument names or types | WARNING |
| `ValueError` | Expected user-facing error (bad URL, transcript unavailable, etc.) | WARNING |
| `Exception` | Unexpected failure | EXCEPTION (full traceback) |

Both sync and async handlers are supported. Sync handlers are wrapped in `asyncio.to_thread()`.

---

## 7. generate_with_tools() in ai_client.py

```python
async def generate_with_tools(
    self,
    messages: list[dict],   # Anthropic messages format
    tools: list[dict],      # Anthropic-format tool definitions
    max_tokens: int = 1024,
    system: str = "",
    timeout: int = 60,
) -> dict:
    # Returns:
    # {
    #   stop_reason: "tool_use" | "end_turn",
    #   tool_calls:  [{id, name, input}],   # populated when stop_reason == tool_use
    #   text:        str | None,             # populated when stop_reason == end_turn
    #   raw_content: list,                  # content blocks for history reconstruction
    # }
```

**Provider cascade (in order):**
1. Claude — Anthropic SDK native tool use (most reliable)
2. NVIDIA OpenAI-compatible — OpenAI `tools=` format
3. Azure OpenAI — OpenAI `tools=` format
4. Text-mode fallback — embed schemas in system prompt, parse `{"action":"tool_call",...}` JSON

---

## 8. Agent Endpoints

### POST /agent/chat — Primary chatbot endpoint

Accepts the structured payload from Django. Builds the system prompt internally, runs the
agent loop restricted to `kb_search` + `web_search`, falls back to one-shot on failure.

```json
{
  "message": "string",
  "conversation_history": [...],
  "tutor_mode": "direct | socratic",
  "user_stats": { ... } | null,
  "file_text": "string" | null,
  "user_id": int | null
}
```

Returns `{ "response": str }`.

### POST /agent/orchestrate — Generic tool-loop endpoint

Used by quiz evaluation and other non-chatbot flows that need tool access.
Accepts `messages`, `tools` whitelist, `system_prompt`, `max_tokens`, `max_iterations`.
Returns `OrchestratorResponse`.

### GET /agent/tools, POST /agent/call

Debug/direct-call endpoints. Not called by Django in production.

---

## 9. Django Integration

`async_views.chatbot_api_async` flow:

1. Parse `message`, `session_id`, `tutor_mode` from request body.
2. Resolve auth + get/create session.
3. Save user message to DB.
4. Fetch last 20 messages from session history.
5. Fetch user stats via `_fetch_user_performance_sync()` (3 cheap DB queries).
6. `POST /agent/chat` with the structured payload.
7. On FastAPI failure: return static fallback (message not persisted).
8. Save AI response to DB, return to React.

There is no agent flag, no prompt building, no one-shot path in Django.
FastAPI owns the full AI decision tree.

---

## 10. Fallback Strategy (Three Layers)

1. **Tool error** — executor catches exception, returns `ToolResult.error`; agent continues reasoning.
2. **Agent loop empty/failed** — one-shot `generate_content()` call in `router.py` (no tools, just system + message).
3. **FastAPI unreachable** — Django returns a static keyword-matched response; message is not persisted.

---

## 11. System Prompt

All prompt text lives in `ai_service/agent/prompts.py`. The router never builds strings.

The chatbot system prompt (`build_chat_system_prompt`) contains:
- Platform facts (name, URLs, support contacts)
- Formatting rules (markdown links for page references)
- Tool usage rules (kb_search first, web_search for external only)
- Current date
- User stats block (injected if available)
- Socratic mode block (injected if `tutor_mode == "socratic"`)

Total: under 400 tokens without user stats + Socratic mode.

---

## 12. What Does NOT Change

| Endpoint | Why it stays hardcoded |
|---|---|
| `POST /api/quiz/generate/` | User explicitly requests quiz — no AI reasoning needed |
| `POST /api/flashcards/generate/` | Same — explicit generation request |
| `POST /api/quiz/submit/` | Deterministic MCQ scoring + persisted session |
| `POST /api/flashcards/review/` | SM-2 algorithm |
| All auth endpoints | Never AI-controlled |
| Materials CRUD | Deterministic |

---

## 13. What the AI Controls vs the Backend

| Decision | Owner |
|---|---|
| Which tool to call and when | AI |
| When to search the KB vs the web | AI |
| Quiz content, flashcard text | AI |
| Short-answer evaluation | AI |
| Summarization, explanation | AI |
| Authentication | Django |
| MCQ answer comparison | Django (deterministic) |
| SM-2 scheduling | Django (algorithm-based) |
| DB writes (sessions, decks, messages) | Django |
| Input validation | Django |

---

## 14. Key Design Rules

1. **Tools are in-process async functions.** No HTTP round-trips inside FastAPI.
2. **Tools are stateless.** No DB writes. Django persists everything after the loop returns.
3. **The agent loop has a hard cap.** Default `max_iterations=5`, max 10.
4. **Schemas drive AI performance.** Tool `description` and `input_schema` are prompt engineering.
5. **Graceful degradation at every level.** Each tool catches its own exceptions; the executor never raises; the router returns an error field; Django has a static fallback.
6. **Prompt text lives in `prompts.py`.** The router imports functions — it never builds strings itself.

---

## 15. Example Trace: YouTube video to flashcards

User: `"Make me flashcards from https://youtube.com/watch?v=abc123"`

```
Django chatbot_api_async:
  → Creates/loads session, saves user message to DB
  → Fetches user stats
  → POST /agent/chat { message, conversation_history, user_stats, tutor_mode: "direct" }

FastAPI /agent/chat:
  → Builds system prompt
  → Agent loop iteration 1:
      AI: tool_use { name: "extract_youtube_transcript", input: {url: "..."} }
      Executor: {text: "...", title: "Intro to ML", video_id: "abc123"}
  → Agent loop iteration 2:
      AI: tool_use { name: "generate_flashcards",
                     input: {text, subject: "Intro to ML", num_cards: 10} }
      Executor: {cards: [{question, answer}, ...]}
  → Agent loop iteration 3:
      AI: end_turn { text: "Here are 10 flashcards based on Intro to ML: ..." }
  → Returns { "response": "Here are 10 flashcards..." }

Django chatbot_api_async:
  → Saves AI response as ChatMessage
  → Returns JSON to React
```

---

## 16. Anti-Patterns to Avoid

- Do not add auth, scoring, or DB writes to any tool.
- Do not put prompt construction in Django — it belongs in FastAPI `prompts.py`.
- Do not let tools call each other. The AI composes them; tools do not.
- Do not expose all tools to the chatbot. Use `_CHAT_TOOLS = ["kb_search", "web_search"]`.
- Do not remove the direct quiz/flashcard endpoints. The quiz page calls them directly.
