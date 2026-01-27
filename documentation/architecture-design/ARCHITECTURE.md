# Lamla AI – Architecture Summary & Endpoint Reference

## What We've Accomplished

### ✅ Async-First, High-Concurrency Backend
1. **Django (Async API Gateway + Database)**
   - Runs on an **ASGI server (Uvicorn)** for native async performance.
   - Manages DB models, sessions, and chat history.
   - **Proxies** requests to FastAPI using a persistent `httpx.AsyncClient` for high throughput and connection pooling.
   - Supports **zero-copy streaming** to the client.
   - Secured internal endpoints with a shared secret (`FASTAPI_SECRET`).

2. **FastAPI (Stateless Async Worker)**
   - Handles LLM provider orchestration (Azure, DeepSeek, Gemini, HuggingFace).
   - No database access—purely async request/response.
   - High-concurrency support (Uvicorn with multi-worker mode).
   - Middleware to authenticate internal requests from Django.

3. **Data Flow**
   ```
   React Frontend (http://localhost:3000)
        ↓ (REST POST)
   Django Async Gateway (http://localhost:8000)
        ↓ (Async HTTP POST with secret header)
   FastAPI Worker (http://localhost:8001)
        ↓ (async LLM call)
   LLM Provider (Azure OpenAI, DeepSeek, etc.)
   ```

4. **Removed Legacy Code**
   - ❌ Deleted `apps/core/ai_client_legacy.py` (sync client).
   - ✅ Django uses a dedicated, persistent `httpx.AsyncClient` (`apps/core/async_client.py`).
   - ✅ FastAPI owns all LLM interactions.

5. **Documentation & Deployment**
   - New `ASYNC_PROXY_SETUP.md` and `QUICK_START_ASYNC.md`.
   - `Dockerfile` and `docker-compose.yml` for containerization.

---

## React-Facing Django API Endpoints

All endpoints are prefixed with `/api/` and are now served by **async views**.

### **1. Chat Message Endpoint**
`POST /api/chat/`
**Flow:**
1. React sends message to an **async** Django view.
2. Django saves user message to DB.
3. Django constructs prompt and **asynchronously POSTs** it to FastAPI.
4. FastAPI calls LLM provider and returns the full response.
5. Django saves AI message to DB.
6. Django returns response to React.

---

### **2. File Upload Endpoint**
`POST /api/chat/file/`
**Flow:**
- Same as the Chat Message endpoint, but the async view first extracts text from the uploaded file to include in the prompt.

---

### **3. Streaming Chat Endpoint**
`POST /api/chat/stream/`
**Response:** Server-Sent Events (SSE) stream.
**Flow (Corrected Implementation):**
1. React sends message to the async streaming view.
2. Django saves the user's message to the DB.
3. Django constructs a prompt and awaits the **full response** from FastAPI.
4. Django uses `StreamingHttpResponse` to send the received response back to the client in small, non-blocking chunks. This provides a responsive UX even though the LLM response is not streamed end-to-end.
5. After the response has been fully streamed to the client, the AI's message is saved to the database.

---

## FastAPI Routes & Security

### Routes
```
/health                          → Health check (GET) - Bypasses auth
/chatbot                         → Process prompt (POST)
/quiz/                           → Quiz route (placeholder)
/flashcards/                     → Flashcards route (placeholder)
```

### Security
- **Secret Header Authentication**: A middleware (`fastapi_service/core/middleware.py`) is active on all routes except `/health`.
- It verifies that every request contains a valid `X-Internal-Secret` header.
- This ensures that only trusted services (i.e., the Django gateway) can access the FastAPI worker.

---

## Configuration & Environment

### Environment Variables (.env)
```
# Django
SECRET_KEY=...
FASTAPI_BASE_URL=http://localhost:8001
FASTAPI_SECRET=your-secret-key-here # Add this!

# FastAPI
FASTAPI_PORT=8001
FASTAPI_WORKERS=4
FASTAPI_RELOAD=false
FASTAPI_SECRET=your-secret-key-here # Must match Django

# LLM Providers
AZURE_OPENAI_API_KEY=...
DEEPSEEK_API_KEY=...
GEMINI_API_KEY=...

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,...
FASTAPI_ALLOWED_ORIGINS=http://localhost:8000,...
```

---

## Running the Stack

### Development (3 terminals)

**Terminal 1 – Django (ASGI):**
```bash
# Make sure to set FASTAPI_SECRET in your environment
cd backend
python manage.py migrate
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 – FastAPI:**
```bash
# Make sure to set FASTAPI_SECRET in your environment
cd backend
FASTAPI_RELOAD=true python fastapi_service/run.py
```

**Terminal 3 – React:**
```bash
cd frontend
npm start
```

### Production (Docker)
```bash
docker-compose up -d
```

---

## High-Concurrency Architecture

### Django Async Gateway
- **ASGI Native**: Runs on Uvicorn, allowing it to handle thousands of concurrent connections without blocking.
- **Persistent HTTP Client**: A single, application-scoped `httpx.AsyncClient` instance (`apps/core/async_client.py`) is used for all outgoing calls to FastAPI. This enables:
  - **Connection Pooling**: Reuses TCP connections to reduce latency.
  - **HTTP/2 Support**: Improves performance for high-volume requests.
  - **Non-Blocking I/O**: Frees up worker processes while waiting for FastAPI's response.

### FastAPI Worker Model
- **Uvicorn Multi-Worker**: Scales horizontally across CPU cores.
- **Stateless & Secure**: No DB access and all internal requests are authenticated.

### Separation Benefits
- **Django handles**: DB I/O (async), session management, and business logic. It no longer blocks while waiting for AI responses.
- **FastAPI handles**: Purely CPU-bound async tasks and LLM provider orchestration.
- **Scalability**: The async-to-async communication between Django and FastAPI creates a fully non-blocking pipeline, allowing the system to scale efficiently.

---

## Wiring Verification Checklist

✅ **Module Imports**
- Django `async_views` import the persistent `async_client`.
- FastAPI uses middleware to protect routes.

✅ **Request/Response Flow**
- React POST → Django **async view**.
- Django uses `httpx.AsyncClient` to POST to FastAPI with a secret header.
- FastAPI validates the secret and returns a full JSON response.
- For streaming, Django chunks the response for the client *before* saving the AI message.

✅ **Security**
- Communication between Django and FastAPI is secured via a shared secret (`FASTAPI_SECRET`) passed in the `X-Internal-Secret` header.

✅ **Database Persistence**
- The AI message is saved **after** the streaming response is complete to prevent partial data writes. For non-streaming endpoints, it's saved immediately.

✅ **Environment Configuration**
- `FASTAPI_BASE_URL` and `FASTAPI_SECRET` are correctly configured in Django.

---

## Summary

✅ **Fully Asynchronous Stack**: Django (ASGI Gateway), FastAPI (Async Worker), and React (UI).
✅ **High-concurrency ready**: Uvicorn, `httpx.AsyncClient`, and connection pooling are used throughout.
✅ **Secure by Default**: Internal service-to-service communication is authenticated.
✅ **Improved UX**: "Fake" streaming provides a responsive feel even for non-streaming backend services.
✅ **Clean architecture**: Clear separation of concerns, stateless services, and a non-blocking request pipeline.
