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

Anonymous sessions are supported through a generated session id.

## File Upload

- Supported in Django extraction pipeline for chat/file endpoint.
- Extracted text is added as context in prompt construction before proxying to FastAPI.

## Streaming

`/api/chat/stream/` currently performs chunked response streaming from Django after a full FastAPI response arrives.

This gives a typewriter UX even without provider-native streaming.
