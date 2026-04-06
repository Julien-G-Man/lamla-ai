# MCP Implementation Design — Lamla AI

This document describes how to integrate MCP (Model Context Protocol) principles into the existing Lamla AI architecture. It is grounded in the actual codebase.

---

## 1. What MCP Means Here

MCP is a protocol for AI models to interact with capabilities (tools) in a structured way. In practice for Lamla, this means:

- The AI receives a list of available tools with typed schemas.
- The AI can request to call a tool instead of generating a final response.
- The backend executes the tool call and returns the result to the AI.
- The AI continues reasoning until it produces a final response.

This is not a different backend. It is an orchestration layer added on top of what already exists.

---

## 2. Current Architecture vs MCP-Oriented Architecture

### Current Flow

```
React → Django (auth, validation) → FastAPI (LLM call) → Django → React
```

Each feature has a **fixed pipeline**:
- Quiz: extract text → FastAPI `POST /quiz/` → score submission
- Flashcards: extract text → FastAPI `POST /flashcards/generate` → save deck
- Chatbot: retrieve KB → FastAPI `POST /chatbot/` → return response

The AI is a black box at the end of a hardcoded chain. It cannot change what tools it uses or in what order.

### MCP-Oriented Flow

```
React → Django (auth, validation) → FastAPI MCP Orchestrator
         ↓                              ↓
    [persist, score]           [tool registry + executor]
                                        ↓
                                [AI ←→ tool loop]
                                        ↓
                                [final response]
```

The chatbot becomes an AI orchestrator. It receives available tools (quiz generator, flashcard generator, transcript extractor, etc.) and decides what to call based on user intent. Quiz and flashcard generation remain directly callable by Django for their dedicated endpoints — no breakage.

---

## 3. Architectural Boundaries (Unchanged)

The Django/FastAPI split is **correct and should not change**. Each layer's responsibilities:

| Layer | Responsibility | Examples |
|---|---|---|
| Django | Auth, DB, routing, file I/O | Token validation, saving QuizSession, extracting PDFs |
| FastAPI | AI execution, tool orchestration | LLM calls, tool registry, MCP executor loop |
| MCP tools | Atomic capabilities | generate_quiz, summarize_text, explain_concept |

**Django does not know about MCP tools.** Django knows about FastAPI endpoints. FastAPI exposes MCP tools internally.

---

## 4. Where the MCP Layer Lives

Inside `backend/fastapi_service/`, add a new `mcp/` module:

```
backend/fastapi_service/
├── core/
│   ├── ai_client.py          ← existing, extend for tool use
│   ├── config.py
│   └── ...
├── mcp/                      ← NEW
│   ├── __init__.py
│   ├── registry.py           ← tool definitions (schemas + handlers)
│   ├── executor.py           ← dispatches tool_call → result
│   ├── schemas.py            ← ToolCall, ToolResult, OrchestratorRequest/Response
│   └── router.py             ← GET /mcp/tools, POST /mcp/call, POST /mcp/orchestrate
├── services/
│   ├── quiz/                 ← existing
│   ├── flashcards/           ← existing
│   └── chatbot/              ← upgrade to use MCP orchestrator
```

Django does not need a new directory. Django calls `POST /mcp/orchestrate` the same way it calls `POST /chatbot/`.

---

## 5. Tool Definitions

Tools are derived from existing FastAPI capabilities. Each tool has: name, description, input schema, and a Python handler.

### 5.1 Core Tools

#### `generate_quiz`
Wraps existing `services/quiz/routes.py`.

```python
name: "generate_quiz"
description: "Generate a quiz from a body of study text. Returns MCQ and short-answer questions."
inputs:
  study_text: str          # The content to generate from (max ~16K chars)
  subject: str             # Topic label for prompt context
  difficulty: "easy" | "medium" | "hard"
  num_mcq: int             # 1–30
  num_short: int           # 0–10
output:
  mcq_questions: list      # [{question, options, answer, explanation}]
  short_questions: list    # [{question, answer, explanation}]
```

**Handler:** calls `quiz_endpoint()` logic directly (not via HTTP — same process).

---

#### `generate_flashcards`
Wraps existing `services/flashcards/routes.py`.

```python
name: "generate_flashcards"
description: "Generate study flashcards from a body of text."
inputs:
  text: str
  subject: str
  num_cards: int           # default 10
  difficulty: "easy" | "medium" | "hard"
  prompt: str | None       # optional user instruction
output:
  cards: list              # [{question, answer}]
```

**Handler:** calls `generate_flashcards()` logic directly.

---

#### `explain_concept`
Wraps existing `services/flashcards/routes.py` (`explain_flashcard` endpoint).

```python
name: "explain_concept"
description: "Generate a detailed explanation for a concept given a question and its answer."
inputs:
  question: str
  answer: str
output:
  explanation: str
```

**Handler:** calls `explain_flashcard()` logic directly.

---

#### `summarize_text`
New shared tool. Reuses the existing `ai_client` — no new AI wiring.

```python
name: "summarize_text"
description: "Summarize a body of text into key points. Useful before flashcard or quiz generation."
inputs:
  text: str
  max_words: int           # default 300
  focus: str | None        # optional framing ("focus on definitions", etc.)
output:
  summary: str
```

**Handler:** new function in `mcp/tools/summarize.py` — calls `ai_service.generate_content()` with a tight summarization prompt.

---

#### `evaluate_answer`
Wraps the short-answer evaluation logic currently embedded in `apps/quiz/async_views.py` (`_evaluate_short_answer`). This logic currently calls FastAPI `/flashcards/explain` as a proxy — that should become this tool directly.

```python
name: "evaluate_answer"
description: "Evaluate a user's short-answer response against the correct answer. Returns a score (0–1) and feedback."
inputs:
  question: str
  correct_answer: str
  user_answer: str
output:
  is_correct: bool
  score: float             # 0.0–1.0
  feedback: str
```

**Handler:** new function in `mcp/tools/evaluate.py` — calls `ai_service.generate_content()` with an evaluation prompt.

---

#### `extract_youtube_transcript`
Moves transcript extraction logic to FastAPI so the AI can use it as a tool. The existing logic in `apps/quiz/youtube_api.py` uses only `youtube-transcript-api` and `httpx` — no Django dependencies. It can be copied into `fastapi_service/mcp/tools/youtube.py` without modification.

```python
name: "extract_youtube_transcript"
description: "Fetch the transcript and title from a YouTube video URL."
inputs:
  url: str                 # Any YouTube URL format
output:
  text: str                # Full transcript
  title: str               # Video title
  video_id: str
```

**Handler:** `mcp/tools/youtube.py` — same logic as `apps/quiz/youtube_api.py`.

---

#### `search_web`
Wraps the existing `search_engine.search()` already used in the chatbot.

```python
name: "search_web"
description: "Search the web for current information. Use when the user asks about recent events or general knowledge not in the platform KB."
inputs:
  query: str
  num_results: int         # default 3
output:
  results: list            # [{title, snippet, url}]
```

**Handler:** thin wrapper over the existing `search_engine` from `apps/chatbot/`.

> **Note:** `search_web` is called via Django's chatbot service today. For the MCP executor in FastAPI, either move the search logic to FastAPI or expose a Django internal endpoint `POST /internal/search/` that FastAPI calls back. The Django-internal approach is simpler and avoids moving SerpAPI configuration.

---

### 5.2 Tool Ownership Summary

| Tool | Handler Location | Deterministic? |
|---|---|---|
| `generate_quiz` | fastapi_service/services/quiz | No (LLM) |
| `generate_flashcards` | fastapi_service/services/flashcards | No (LLM) |
| `explain_concept` | fastapi_service/services/flashcards | No (LLM) |
| `summarize_text` | fastapi_service/mcp/tools/summarize.py | No (LLM) |
| `evaluate_answer` | fastapi_service/mcp/tools/evaluate.py | No (LLM) |
| `extract_youtube_transcript` | fastapi_service/mcp/tools/youtube.py | Yes |
| `search_web` | Django internal endpoint or fastapi_service | Yes |

---

## 6. MCP Layer Implementation

### 6.1 `mcp/schemas.py`

```python
from pydantic import BaseModel
from typing import Any

class ToolDefinition(BaseModel):
    name: str
    description: str
    input_schema: dict          # JSON Schema for inputs

class ToolCall(BaseModel):
    name: str
    input: dict

class ToolResult(BaseModel):
    name: str
    output: Any
    error: str | None = None

class OrchestratorRequest(BaseModel):
    messages: list[dict]        # Chat history: [{role, content}]
    tools: list[str] | None     # Restrict to specific tools (None = all)
    max_iterations: int = 5     # Prevent infinite loops
    max_tokens: int = 2048

class OrchestratorResponse(BaseModel):
    response: str
    tool_calls_made: list[str]  # Names of tools called during reasoning
    iterations: int
```

---

### 6.2 `mcp/registry.py`

```python
from fastapi_service.mcp.schemas import ToolDefinition
from fastapi_service.mcp.tools import youtube, summarize, evaluate
from fastapi_service.services.quiz.routes import quiz_endpoint
from fastapi_service.services.flashcards.routes import generate_flashcards, explain_flashcard

TOOL_REGISTRY: dict[str, dict] = {
    "generate_quiz": {
        "definition": ToolDefinition(
            name="generate_quiz",
            description="Generate a quiz from a body of study text. Returns MCQ and short-answer questions.",
            input_schema={
                "type": "object",
                "properties": {
                    "study_text": {"type": "string"},
                    "subject": {"type": "string"},
                    "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
                    "num_mcq": {"type": "integer", "minimum": 1, "maximum": 30},
                    "num_short": {"type": "integer", "minimum": 0, "maximum": 10},
                },
                "required": ["study_text", "subject"],
            },
        ),
        "handler": ...,  # reference to quiz generation function
    },
    "generate_flashcards": { ... },
    "explain_concept": { ... },
    "summarize_text": { ... },
    "evaluate_answer": { ... },
    "extract_youtube_transcript": { ... },
    "search_web": { ... },
}

def get_tool_definitions(names: list[str] | None = None) -> list[ToolDefinition]:
    registry = TOOL_REGISTRY if names is None else {k: v for k, v in TOOL_REGISTRY.items() if k in names}
    return [v["definition"] for v in registry.values()]

def get_handler(name: str):
    if name not in TOOL_REGISTRY:
        raise KeyError(f"Unknown tool: {name}")
    return TOOL_REGISTRY[name]["handler"]
```

---

### 6.3 `mcp/executor.py`

```python
from fastapi_service.mcp.registry import get_handler
from fastapi_service.mcp.schemas import ToolCall, ToolResult

async def execute_tool(call: ToolCall) -> ToolResult:
    handler = get_handler(call.name)
    try:
        output = await handler(**call.input)
        return ToolResult(name=call.name, output=output)
    except Exception as e:
        return ToolResult(name=call.name, output=None, error=str(e))
```

Handlers can be sync or async — the executor handles both via `asyncio.to_thread()` for sync handlers.

---

### 6.4 `mcp/router.py`

```python
from fastapi import APIRouter
from fastapi_service.mcp.registry import get_tool_definitions
from fastapi_service.mcp.executor import execute_tool
from fastapi_service.mcp.schemas import OrchestratorRequest, OrchestratorResponse, ToolCall

router = APIRouter(prefix="/mcp")

@router.get("/tools")
async def list_tools():
    """Return all registered tool definitions. Used for debugging and future frontends."""
    return {"tools": [t.model_dump() for t in get_tool_definitions()]}

@router.post("/call")
async def call_tool(call: ToolCall):
    """Execute a single tool by name. Direct use — no AI reasoning."""
    result = await execute_tool(call)
    return result.model_dump()

@router.post("/orchestrate")
async def orchestrate(request: OrchestratorRequest) -> OrchestratorResponse:
    """AI-driven orchestration loop. AI reasons over tools and calls them as needed."""
    # See Section 7 for full implementation
    ...
```

---

## 7. The Orchestration Loop

This is the core of MCP: the AI reasons and uses tools in a loop until it produces a final response.

### 7.1 How Claude Tool Use Works

Claude's API supports native tool use. When tools are provided:

1. Claude returns either a `text` response or a `tool_use` block.
2. If `tool_use`: we execute the tool and send the result back as `tool_result`.
3. Claude continues with the result and may call another tool or produce text.
4. Loop ends when Claude produces a `text` block with no tool calls, or when `max_iterations` is reached.

### 7.2 Multi-Provider Consideration

Tool use with structured schemas works natively with:
- **Claude** (Anthropic SDK — `tools=` parameter): Full support, primary provider.
- **OpenAI / Azure** (`tools=` parameter, `tool_choice`): Full support.
- **NVIDIA-hosted models**: Depends on the model. NVIDIA DeepSeek supports function calling.

The current `ai_client.py` normalizes all provider calls to `generate_content(prompt, max_tokens)`. For MCP orchestration, we need a new method: `generate_with_tools(messages, tools, max_tokens)` that uses the native tool-use API for supported providers and falls back to text-based orchestration for others.

### 7.3 `generate_with_tools` in `core/ai_client.py`

Add alongside the existing `generate_content` method:

```python
async def generate_with_tools(
    self,
    messages: list[dict],
    tools: list[dict],          # Claude-format tool definitions
    max_tokens: int = 2048,
) -> dict:
    """
    Returns:
        {
            "stop_reason": "tool_use" | "end_turn",
            "content": list,       # Claude content blocks
            "tool_calls": list,    # Parsed [{name, input}] if stop_reason == tool_use
            "text": str | None     # Final text if stop_reason == end_turn
        }
    """
    # Primary: Claude — native tool use via Anthropic SDK
    # Fallback: OpenAI/Azure — native tool use
    # Last resort: text-mode orchestration (less reliable, but functional)
```

The text-mode fallback works by embedding the tool schemas in the system prompt and parsing structured JSON output. This is less reliable than native tool use but covers providers that don't support the `tools=` parameter.

### 7.4 The Orchestrate Loop

```python
async def orchestrate(request: OrchestratorRequest) -> OrchestratorResponse:
    tool_defs = get_tool_definitions(request.tools)
    # Convert to Claude-format schema for ai_client
    claude_tools = [format_for_claude(t) for t in tool_defs]

    messages = list(request.messages)    # copy
    calls_made = []
    iterations = 0

    while iterations < request.max_iterations:
        result = await ai_service.generate_with_tools(
            messages=messages,
            tools=claude_tools,
            max_tokens=request.max_tokens,
        )
        iterations += 1

        if result["stop_reason"] == "end_turn":
            return OrchestratorResponse(
                response=result["text"],
                tool_calls_made=calls_made,
                iterations=iterations,
            )

        # AI wants to call tool(s)
        for tool_call in result["tool_calls"]:
            calls_made.append(tool_call["name"])
            call = ToolCall(name=tool_call["name"], input=tool_call["input"])
            tool_result = await execute_tool(call)

            # Append assistant message + tool result to history
            messages.append({"role": "assistant", "content": result["content"]})
            messages.append({
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": tool_call["id"],
                    "content": str(tool_result.output) if not tool_result.error else f"Error: {tool_result.error}",
                }]
            })

    # Max iterations hit — return whatever the AI last said
    return OrchestratorResponse(
        response="[Max tool iterations reached. Partial response.]",
        tool_calls_made=calls_made,
        iterations=iterations,
    )
```

---

## 8. Upgrading the Chatbot to Use MCP

The chatbot in `apps/chatbot/services.py` currently calls `POST /chatbot/` (one-shot generation). Upgrade it to call `POST /mcp/orchestrate` for AI-driven sessions.

### 8.1 New Chatbot Call in `ChatbotService.generate_response()`

Replace:
```python
# Current — one-shot
response = await call_fastapi("POST", "/chatbot/", json={"prompt": full_prompt})
```

With:
```python
# MCP-oriented — tool loop
response = await call_fastapi("POST", "/mcp/orchestrate", json={
    "messages": conversation_history,    # last 6 turns + system context
    "tools": ["search_web", "summarize_text", "explain_concept"],
    "max_tokens": 1024,
    "max_iterations": 4,
})
```

The key change: instead of building a huge monolithic prompt in Django and sending it to FastAPI, send the raw conversation history and let the AI decide what context to retrieve.

### 8.2 What This Enables

**Before (hardcoded):**
1. Django always retrieves platform KB chunks (whether relevant or not)
2. Django always checks if web search is needed
3. Django assembles full prompt
4. AI generates response

**After (AI-driven):**
1. AI receives conversation + tool list
2. AI decides: "User asked about spaced repetition in Lamla" → calls `search_web` for external info
3. AI decides: "User uploaded a PDF and wants flashcards" → calls `generate_flashcards`
4. AI produces final response from tool results

The chatbot becomes genuinely capable of cross-feature actions. A user can say "take this YouTube video and make me flashcards" — the AI calls `extract_youtube_transcript` then `generate_flashcards` in sequence, all from one chat message.

---

## 9. What Does NOT Change

These flows remain as direct Django → FastAPI proxy calls:

| Endpoint | Why it stays hardcoded |
|---|---|
| `POST /api/quiz/generate/` | User explicitly requests quiz — no AI reasoning needed |
| `POST /api/flashcards/generate/` | Same — explicit generation request |
| `POST /api/quiz/submit/` | Deterministic MCQ scoring + persisted session |
| `POST /api/flashcards/review/` | SM-2 algorithm — purely deterministic |
| All auth endpoints | Never AI-controlled |
| Materials CRUD | Deterministic file management |

MCP orchestration is **additive**. Existing endpoints stay intact. MCP is used only where AI reasoning adds value: primarily the chatbot and future AI-driven workflows.

---

## 10. What the AI Controls vs the Backend

| Decision | Owner | Why |
|---|---|---|
| Which tool to call and when | AI | Core of MCP — reasoning over capabilities |
| What to generate (quiz content, flashcard text) | AI | Creative/generative work |
| Short-answer evaluation | AI | Semantic judgment required |
| Summarization, explanation | AI | Language task |
| Authentication | Django | Never AI-controlled |
| MCQ answer comparison | Django | Deterministic — `user_answer == correct_answer` |
| SM-2 scheduling | Django | Algorithm-based |
| DB writes (save session, save deck) | Django | Persistence is deterministic |
| Input validation | Django | Security boundary |
| YouTube transcript fetching | Tool handler | Deterministic API call, no AI |

---

## 11. Migration Plan

### Phase 1 — Extract and Isolate (No new behavior)
- Move `_evaluate_short_answer` from `apps/quiz/async_views.py` into `fastapi_service/mcp/tools/evaluate.py`
- Move `youtube_api.py` logic into `fastapi_service/mcp/tools/youtube.py`
- Existing Django endpoints still call FastAPI the same way

### Phase 2 — Build MCP Layer (Additive)
- Create `fastapi_service/mcp/schemas.py`, `registry.py`, `executor.py`
- Register all 7 tools with full input schemas
- Create `mcp/router.py` with `/mcp/tools` and `/mcp/call`
- Mount router in `fastapi_service/main.py`
- Add `generate_with_tools()` to `ai_client.py` (Claude + OpenAI implementations)

### Phase 3 — Orchestrate Endpoint
- Implement `POST /mcp/orchestrate` in `mcp/router.py`
- Unit test each tool handler in isolation
- Test the full loop: chatbot message → tool call → tool result → final response

### Phase 4 — Upgrade Chatbot
- Update `ChatbotService.generate_response()` in Django to call `/mcp/orchestrate`
- Remove the monolithic prompt assembly from Django (KB retrieval, search heuristics)
- Move search decision to the AI (it calls `search_web` if needed)
- Keep message persistence in Django (save `ChatMessage` after orchestrator returns)

### Phase 5 — Logging and Hardening
- Log all tool calls: name, inputs (truncated), execution time, success/failure
- Add per-tool timeouts in the executor
- Add tool-level error responses (don't let one bad tool call crash the loop)
- Monitor via existing logging infrastructure

---

## 12. File Creation Checklist

```
backend/fastapi_service/mcp/
├── __init__.py
├── schemas.py               ← ToolDefinition, ToolCall, ToolResult, OrchestratorRequest/Response
├── registry.py              ← TOOL_REGISTRY dict, get_tool_definitions(), get_handler()
├── executor.py              ← execute_tool(call: ToolCall) → ToolResult
├── router.py                ← /mcp/tools (GET), /mcp/call (POST), /mcp/orchestrate (POST)
└── tools/
    ├── __init__.py
    ├── youtube.py            ← extract_youtube_transcript() (moved from apps/quiz/youtube_api.py)
    ├── summarize.py          ← summarize_text() (new, uses ai_service)
    └── evaluate.py           ← evaluate_answer() (moved from apps/quiz/async_views._evaluate_short_answer)

backend/fastapi_service/core/
└── ai_client.py             ← add generate_with_tools() method (extend existing class)
```

**Django changes:**
- `apps/chatbot/services.py` — update to call `/mcp/orchestrate`
- `apps/quiz/async_views.py` — `_evaluate_short_answer` delegates to tool or calls new evaluate endpoint
- `apps/quiz/youtube_api.py` — keep as-is (still used by direct quiz generation endpoint), or thin wrapper over the moved logic

---

## 13. Key Design Rules

1. **Tools are async Python functions.** They are not HTTP endpoints called via httpx — they are called in-process within FastAPI. This avoids an HTTP round-trip and simplifies deployment.

2. **Tools are stateless.** They take inputs, return outputs, and do no DB work. DB writes are always Django's responsibility after the orchestrator returns.

3. **The orchestrator loop has a hard cap.** `max_iterations=5` prevents runaway chains. If the AI loops more than expected, investigate the system prompt or tool descriptions — not the cap.

4. **Schemas drive AI performance.** The quality of `description` and `input_schema` in each tool definition directly affects whether the AI calls the right tool with the right arguments. Treat schema writing the same as prompt engineering.

5. **Graceful degradation.** If `/mcp/orchestrate` fails for any reason (tool error, AI provider failure), the chatbot falls back to the existing one-shot `/chatbot/` endpoint. This is the same fallback pattern already in `ChatbotService`.

6. **Django never calls `/mcp/tools`.** That endpoint is for debugging and future frontends. Django only calls `/mcp/orchestrate` (and still calls `/quiz/`, `/flashcards/generate`, etc. for direct flows).

---

## 14. Example: "Make flashcards from this YouTube video"

**User message:** `"Can you make me flashcards from https://youtube.com/watch?v=abc123"`

**MCP orchestration trace:**

```
Iteration 1:
  AI receives: user message + [extract_youtube_transcript, generate_flashcards, ...] tool list
  AI decides: I need the transcript first
  AI outputs: tool_use { name: "extract_youtube_transcript", input: { url: "..." } }

Executor:
  Calls youtube.py handler → returns { text: "...", title: "Introduction to ML", video_id: "abc123" }

Iteration 2:
  AI receives: transcript result
  AI decides: now generate flashcards
  AI outputs: tool_use { name: "generate_flashcards", input: { text: transcript, subject: "Introduction to ML", num_cards: 10, difficulty: "medium" } }

Executor:
  Calls flashcards handler → returns { cards: [{question, answer}, ...] }

Iteration 3:
  AI receives: flashcard result
  AI decides: I have everything, write the final response
  AI outputs: end_turn { text: "Here are 10 flashcards based on 'Introduction to ML':\n\n1. ..." }

Django:
  Receives orchestrator response
  Saves ChatMessage (user) + ChatMessage (AI)
  Returns response to frontend
```

Total: 3 iterations, 2 tool calls, 1 final response. Django handles persistence after the fact.

---

## 15. Anti-Patterns to Avoid

- **Do not give the AI tools for authentication, scoring, or DB writes.** These are deterministic and must stay in Django.
- **Do not build MCP on top of the Django layer.** The orchestrator belongs in FastAPI where AI execution already lives.
- **Do not make tools call each other.** Each tool is atomic. The AI composes them — tools do not.
- **Do not over-expose tools.** A chatbot session for general Q&A does not need `generate_quiz`. Pass only tools relevant to the context via the `tools: list[str]` parameter in `OrchestratorRequest`.
- **Do not remove the direct quiz/flashcard endpoints.** The MCP orchestrator supplements them; it does not replace them. Users on the quiz page still call `POST /api/quiz/generate/` directly.
