# Frontend Integration Guide

## Overview

This document describes how the React frontend (`frontend/src/pages/Chatbot.jsx`) integrates with the Django REST API backend (`backend/apps/chatbot/views.py`) and FastAPI worker (`backend/fastapi_service/`).

---

## Architecture Flow

```
┌─────────────┐
│   React UI  │ (http://localhost:3000)
│ Chatbot.jsx │
└──────┬──────┘
       │ HTTP POST
       ▼
┌──────────────────────┐
│  Django REST API     │ (http://localhost:8000)
│  chatbot/views.py    │
└──────┬───────────────┘
       │ HTTP POST (sync via requests.post)
       ▼
┌──────────────────────┐
│  FastAPI Worker      │ (http://localhost:8001)
│  /chatbot endpoint   │ (async LLM processing)
└──────┬───────────────┘
       │ async httpx.AsyncClient
       ▼
┌──────────────────────┐
│  LLM Provider        │ (Azure OpenAI / DeepSeek / Gemini / HuggingFace)
└──────────────────────┘
```

---

## API Endpoints

All endpoints are relative to `http://localhost:8000/api` (configured in `frontend/src/services/api.js`).

### 1. Standard Chat API

**Endpoint**: `POST /chat/`

**Purpose**: Send a message and get AI response (stored in DB)

**Request Body**:
```json
{
  "message": "What is photosynthesis?",
  "search_mode": "disabled"
}
```

**Response**:
```json
{
  "response": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
}
```

**Flow**:
1. Frontend calls `POST /api/chat/` with user message
2. Django creates `ChatSession` (or retrieves existing for user)
3. Django saves `ChatMessage` with `sender="user"`
4. Django builds conversation history (last 7 messages)
5. Django calls FastAPI `POST http://localhost:8001/chatbot` with full prompt
6. FastAPI calls LLM provider (async)
7. Django saves AI response as `ChatMessage` with `sender="ai"`
8. Django returns `{"response": "..."}` to frontend

**Implementation**:
- Django view: `chatbot_api()` in [views.py](backend/apps/chatbot/views.py#L24-L72)
- Frontend call: [Chatbot.jsx streaming endpoint](frontend/src/pages/Chatbot.jsx#L145-L175)

---

### 2. File Upload API

**Endpoint**: `POST /chat/file/`

**Purpose**: Upload document and get AI analysis (file context included)

**Request Format**: `multipart/form-data`

**Request Fields**:
```
file_upload: <binary file content>
message: "Summarize this document"
```

**Response**:
```json
{
  "response": "Document Summary:\n...",
  "filename": "document.pdf"
}
```

**Flow**:
1. Frontend collects file via `<input type="file">`
2. Frontend calls `POST /api/chat/file/` with FormData (multipart)
3. Django extracts text from file (PDF, DOCX, PPTX, TXT)
4. Django appends file context to prompt: `"original_message (Context from file: filename)"`
5. Django calls FastAPI with full context
6. FastAPI processes with document context
7. Django saves message with file reference
8. Django returns response with filename

**Implementation**:
- Django view: `chatbot_file_api()` in [views.py](backend/apps/chatbot/views.py#L76-L128)
- Frontend handler: [Chatbot.jsx file upload section](frontend/src/pages/Chatbot.jsx#L120-L140)
- File extraction: [file_extractor.py](backend/apps/chatbot/file_extractor.py)

---

### 3. Streaming Chat API

**Endpoint**: `POST /chat/stream/`

**Purpose**: Stream AI response character-by-character for real-time UX

**Request Body**:
```json
{
  "message": "What is machine learning?",
  "search_mode": "disabled"
}
```

**Response**: Server-Sent Events (chunks of 10 characters)

**Flow**:
1. Frontend opens streaming connection via `fetch()` with streaming response body
2. Django generates full response synchronously (calls FastAPI)
3. Django streams response in 10-character chunks
4. Frontend reads stream in a loop with `response.body.getReader()`
5. Frontend accumulates chunks into full message
6. Frontend renders message character-by-character for typewriter effect

**Implementation**:
- Django view: `chatbot_stream()` in [views.py](backend/apps/chatbot/views.py#L131-L180)
- Frontend streaming reader: [Chatbot.jsx fetch + getReader](frontend/src/pages/Chatbot.jsx#L145-L175)

---

## Frontend Configuration

### API Client Setup

**File**: [frontend/src/services/api.js](frontend/src/services/api.js)

```javascript
import axios from "axios";

const BASE_API_URL = "http://localhost:8000/api";
const djangoApi = axios.create({
  baseURL: BASE_API_URL,
  headers: { "Content-Type": "application/json" },
});

export default djangoApi;
```

**Environment Variable** (for production):
```bash
REACT_APP_DJANGO_API_URL=https://api.lamla.com/api
```

### Chatbot Component State

**File**: [frontend/src/pages/Chatbot.jsx](frontend/src/pages/Chatbot.jsx)

**Key State Variables**:
- `messageInput`: Current user input text
- `attachedFile`: Selected file for upload
- `isProcessing`: Boolean flag preventing multiple simultaneous requests
- `history`: Array of message objects `{ id, text, type, sender }`
- `currentSearchMode`: "disabled" | "web_search" | "deep_research"

---

## Frontend-Backend Data Contract

### Session Management

**Authenticated Users**:
- Django creates `ChatSession` with `user=request.user`
- All messages linked to user's session
- Session persists across page refreshes

**Anonymous Users**:
- Django creates `ChatSession` with `session_id` (Django session key or UUID)
- Session stored in browser cookies
- Backend retrieves session via Django middleware

### Message Structure

**Frontend Message Object**:
```javascript
{
  id: 1734434567890,           // Unique timestamp-based ID
  text: "Hello AI!",            // Message content
  type: "user" | "ai",          // Sender type
  sender: "AI Tutor" | null     // Optional display name
}
```

**Backend ChatMessage Model**:
```python
class ChatMessage(models.Model):
    session = ForeignKey(ChatSession)
    sender = CharField(choices=["user", "ai"])  # Message type
    content = TextField()                        # Message text
    created_at = DateTimeField(auto_now_add=True)
```

**API Response Format**:
```json
{
  "response": "AI response text",
  "filename": "optional_filename.pdf",
  "error": "error message (if error)"
}
```

---

## Error Handling

### Frontend Error Handling

**File Upload Validation**:
```javascript
if (file.size > 10 * 1024 * 1024) { 
  alert(`File ${file.name} is too large. Max size is 10MB.`);
  return;
}
```

**Accepted File Types**: `.pdf`, `.docx`, `.pptx`, `.txt`

**API Response Error Handling**:
```javascript
try {
  const res = await djangoApi.post(endpoint, data);
  // Process response
} catch (err) {
  const errorMsg = err.response?.data?.error || "Network error";
  // Display error in UI
}
```

### Django Error Responses

| Status | Scenario | Response |
|--------|----------|----------|
| 200 | Success | `{"response": "...", "filename": "..."}` |
| 400 | Invalid JSON | `{"error": "Invalid JSON"}` |
| 400 | Missing file | `{"error": "No file uploaded"}` |
| 400 | File extraction failed | `{"error": "PDF parsing failed..."}` |
| 500 | Server error | `{"error": "Internal server error"}` |

---

## CORS Configuration

**Django CORS Setup** ([backend/lamla/settings.py](backend/lamla/settings.py)):

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be before SessionMiddleware
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add production URLs here
]
```

**Environment Variable**:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.lamla.com
```

---

## Wiring Checklist

- ✅ API base URL correctly configured (`http://localhost:8000/api`)
- ✅ Endpoint paths match Django URLs:
  - `/chat/` (standard chat)
  - `/chat/file/` (file upload)
  - `/chat/stream/` (streaming response)
- ✅ Request body fields match Django expectations:
  - `message` (not `user_message`)
  - `search_mode` (optional)
- ✅ Response field names match frontend parsing:
  - `response` (not `response_message`)
- ✅ File upload uses `multipart/form-data`
- ✅ Streaming endpoint uses `fetch()` with streaming response body
- ✅ CORS headers configured for React origin
- ✅ Session management working (cookies passed automatically via axios)
- ✅ Error responses parsed and displayed in UI
- ✅ File size validation (10MB max)
- ✅ Processing state prevents duplicate requests

---

## Testing the Integration

### 1. Manual Testing

**Standard Chat**:
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?", "search_mode": "disabled"}'
```

**File Upload**:
```bash
curl -X POST http://localhost:8000/api/chat/file/ \
  -F "file_upload=@document.pdf" \
  -F "message=Summarize this"
```

**Streaming**:
```bash
curl -X POST http://localhost:8000/api/chat/stream/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Test streaming", "search_mode": "disabled"}' \
  --no-buffer
```

### 2. Frontend Console Tests

Open browser DevTools (F12) and:

```javascript
// Test API connectivity
import api from './services/api.js';
api.post('/chat/', { message: 'Hello' }).then(r => console.log(r.data));

// Check CORS headers
fetch('http://localhost:8000/api/chat/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Test' })
}).then(r => r.json()).then(d => console.log(d));
```

---

## High-Concurrency Considerations

### Frontend Concurrency Limits

- **Single Request Constraint**: `isProcessing` state prevents overlapping requests
- **Benefit**: Prevents duplicate messages, maintains clean conversation flow
- **Trade-off**: Users can't send multiple messages simultaneously (acceptable for chat UX)

### Backend Concurrency Support

**Django**:
- Thread pool executor for handling multiple requests
- Configurable workers via `gunicorn --workers N`
- Non-blocking I/O to FastAPI via `requests.post()`

**FastAPI**:
- Async request handling (default 4 Uvicorn workers)
- Each worker handles ~1000+ concurrent requests
- Environment variable: `FASTAPI_WORKERS=8` (for high load)

**Overall Throughput**:
- Frontend: 1 message per session at a time
- Backend: 4+ concurrent message processing (Uvicorn workers)
- Supports multiple simultaneous users without blocking

---

## Deployment Checklist

### Development (Local)

```bash
# Terminal 1: React
cd frontend && npm start

# Terminal 2: Django
cd backend && python manage.py runserver

# Terminal 3: FastAPI
cd backend/fastapi_service && python run.py
```

### Production

1. **React**: Build static bundle, serve via CDN or nginx
   ```bash
   cd frontend && npm run build
   ```

2. **Django**: Use gunicorn with multiple workers
   ```bash
   gunicorn --workers 4 lamla.wsgi:application
   ```

3. **FastAPI**: Use Uvicorn with multiple workers
   ```bash
   FASTAPI_WORKERS=8 python fastapi_service/run.py
   ```

4. **Environment Variables**:
   ```bash
   # .env for backend
   FASTAPI_BASE_URL=http://fastapi:8001
   CORS_ALLOWED_ORIGINS=https://app.lamla.com,https://www.lamla.com
   DATABASE_URL=postgresql://user:password@postgres:5432/lamla_db
   ```

5. **Docker Deployment**:
   ```bash
   docker-compose up -d
   ```
   - React served on port 3000
   - Django served on port 8000
   - FastAPI served on port 8001
   - PostgreSQL on port 5432

---

## Troubleshooting

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Check `CORS_ALLOWED_ORIGINS` includes React URL
2. Verify `corsheaders` middleware is installed
3. Restart Django server

```bash
# Check Django logs
python manage.py runserver --verbosity 2
```

### 404 Errors

**Error**: `POST /api/chat/ 404 Not Found`

**Solution**:
1. Verify Django urls.py includes chatbot app
2. Check URL path matches exactly (`/api/chat/` not `/ai/chatbot/`)
3. Verify `@csrf_exempt` decorator is applied

### File Upload Failures

**Error**: `No file uploaded. Please select a file.`

**Solution**:
1. Check file input `name="file_upload"` matches backend expectation
2. Verify Content-Type is `multipart/form-data`
3. Check file size < 10MB
4. Verify `file_extractor.py` handles file type

### Streaming Not Working

**Error**: `Stream API Connection Error: 500`

**Solution**:
1. Verify FastAPI is running (`http://localhost:8001/docs`)
2. Check FastAPI error logs for LLM provider issues
3. Test streaming endpoint manually with curl
4. Verify `StreamingHttpResponse` returns valid chunks

---

## Next Steps

1. **Add unit tests** for API endpoints
2. **Add rate limiting** to prevent abuse
3. **Add authentication** (JWT/OAuth2)
4. **Add message persistence** to local storage (offline support)
5. **Add typing indicators** (show when AI is processing)
6. **Add conversation history UI** (list past conversations)

