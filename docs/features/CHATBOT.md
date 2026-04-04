# Chatbot Feature

## Frontend

- Page: `src/pages/Chatbot/Chatbot.jsx`
- Route: `/ai-tutor` (`/chatbot` redirects to `/ai-tutor`)

## Django Endpoints

From `backend/apps/chatbot/urls.py`:

- `POST /api/chat/`
- `POST /api/chat/stream/`
- `POST /api/chat/file/`
- `GET /api/chat/history/`
- `DELETE /api/chat/history/clear/`
- `GET /api/chatbot/history/` (dashboard/admin history view)

## FastAPI Endpoint

- Internal worker route: `POST /chatbot/`

## Persistence

- Session container: `ChatSession`
- Message rows: `ChatMessage` (ordered by created_at)

Authenticated users get a deterministic session keyed on `user-{id}`. Anonymous sessions are not persisted.

## Prompt Construction

`helpers._build_chatbot_prompt()` assembles the full system prompt in this order:

1. **Static core facts block** — hardcoded platform name, full URLs (`https://lamla-ai.vercel.app/...`), feature list, support contacts. Always present regardless of retrieval.
2. **Full platform knowledge base** — all content from `text_embeddings.json` via `TextKnowledgeStore.get_all_context()`. Every chunk is injected every time so the AI never has to guess platform details.
3. **Document context** — extracted file text (file upload flow only), wrapped in a clear boundary so the AI treats it as source material, not instructions.
4. **User context** — authenticated username if available.
5. **Current date/time.**
6. **Conversation history** — last 10 messages from the session.
7. **Student question.**

## Platform Knowledge Store (`text_knowledge_store.py`)

A lightweight indexed-text retrieval module. No vector math.

- **Source file:** `backend/apps/chatbot/platform_kb/text_embeddings.json`
- **Format:** JSON where each entry maps a `chunk_id` to `{ heading, source_file, keywords, text }`
- **Indexing:** On startup, builds a token index (2+ char alphanumeric tokens) over each chunk's text, heading, and keywords.
- **`search(query, top_k)`** — scores chunks by: token overlap, keyword phrase match (+3.0), substring match (+2.5), heading match (+1.5). Returns ranked results.
- **`get_context(query, top_k, max_chars)`** — returns formatted top-k chunks safe to inject into a prompt.
- **`get_all_context()`** — returns every chunk concatenated. Used by the system prompt.

The store is instantiated as a module-level singleton (`knowledge_store`) and imported in `helpers.py`.

## Platform Knowledge Base Files

Located in `backend/apps/chatbot/platform_kb/`:

| File | Content |
|---|---|
| `text_embeddings.json` | All platform knowledge — manually indexed, 37 chunks across all topics. Primary source used by `TextKnowledgeStore`. |
| `vector_embeddings.json` | Reserved for future neural vector embeddings. Used by `PlatformKnowledgeRetriever` when populated. |
| `platform_overview.md` | Platform overview, navigation, URLs, getting started |
| `learning_tools.md` | Quiz Generator, Flashcards, AI Tutor Chat, Materials Library, Dashboard |
| `accounts_and_auth.md` | Signup, login, email verification, profile, logout |
| `files_and_limits.md` | File types, size limits, text limits, errors, browser support |
| `support_and_policies.md` | Contact info, what support covers, response tips |
| `models_and_capabilities.md` | AI model routing, providers, fallback behavior |

## Legacy Retrieval (`platform_retrieval.py`)

`PlatformKnowledgeRetriever` is still present and loads the markdown files for keyword and hybrid retrieval. It will use `vector_embeddings.json` when neural embeddings are added. It is not used in the active prompt path — `TextKnowledgeStore` replaced it for platform knowledge injection.

The management command `python manage.py build_platform_kb_embeddings` generates `vector_embeddings.json` once an embedding provider (`CHATBOT_EMBEDDING_PROVIDER = openai | azure_openai`) is configured.

## File Upload

- Supported in the Django extraction pipeline for the `chat/file` endpoint.
- Extracted text is added as `document_context` in prompt construction.
- Supported formats: PDF, DOCX, PPTX, TXT (max 10 MB, max 50,000 chars after extraction).

## Streaming

`/api/chat/stream/` performs chunked response streaming from Django after a full FastAPI response arrives. This gives a typewriter UX without requiring provider-native streaming.

## Tutor Modes

The prompt builder accepts a `tutor_mode` parameter:

- `direct` (default) — answers questions clearly and concisely.
- `socratic` — guides students through questions rather than giving direct answers. Follows a strict Socratic protocol: ask what the student knows, build on correct thinking, ask one question at a time, only reveal the full answer after at least two guided exchanges.
