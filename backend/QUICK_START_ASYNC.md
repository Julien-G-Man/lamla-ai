# Quick Start: Async Proxy Pattern

## Prerequisites

1. **Django 5.1+** (supports async views)
2. **ASGI Server** (Uvicorn or Daphne) - **Required** for async support
3. **PostgreSQL** - Database for bot memory (last 5 conversations per user)
4. **httpx** (already in requirements.txt)

## Setup Steps

### 0. Setup PostgreSQL Database

**Local Development (Manual):**
```bash
# Create database (as postgres user)
psql -U postgres
CREATE DATABASE lamla_db;
\q
```

**Production (Automated - reads from .env):**
```bash
# Configure .env with POSTGRES_ADMIN_PASSWORD and POSTGRES_DB_PASSWORD
python manage.py setup_postgres
```

See `SETUP_POSTGRES.md` for detailed instructions.

### 1. Configure Environment Variables

**Django (.env or environment):**
```bash
# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lamla_db

# FastAPI Configuration
FASTAPI_BASE_URL=http://localhost:8001
FASTAPI_SECRET=your-secret-key-here-change-in-production
```

**FastAPI (.env or environment):**
```bash
FASTAPI_SECRET=your-secret-key-here-change-in-production  # Must match Django
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8001
```

### 2. Run Database Migrations

```bash
cd backend
python manage.py migrate
```

This creates all tables in the `lamla_db` database.

### 3. Run Django with ASGI Server

**Development:**
```bash
cd lamla/backend
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload
```

**Production:**
```bash
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --workers 4
```

### 4. Run FastAPI Service

```bash
cd lamla/backend/fastapi_service
python run.py
```

### 5. Test the Endpoints

**Chatbot (async):**
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what is Lamla AI?"}'
```

**Quiz (async):**
```bash
curl -X POST http://localhost:8000/api/quiz/generate/ \
  -H "Content-Type: application/json" \
  -d '{"topic": "photosynthesis", "num_questions": 5, "difficulty": "medium"}'
```

## Verification

1. **Check Django logs** - Should see "Initialized persistent AsyncClient for FastAPI"
2. **Check FastAPI logs** - Should see requests with X-Internal-Secret header
3. **Test concurrency** - Use a tool like `ab` or `wrk` to test multiple concurrent requests

## Troubleshooting

### "RuntimeError: This event loop is already running"
→ Django must run with ASGI server (uvicorn/daphne), not WSGI (gunicorn without uvicorn workers)

### FastAPI returns 401/403
→ Check that `FASTAPI_SECRET` matches in both Django and FastAPI environments

### Slow performance
→ Ensure Django is using ASGI server, not WSGI
→ Check network latency between Django and FastAPI
→ Verify connection pooling is working (check logs)

## Performance Benefits

- **Non-blocking**: Django workers handle thousands of concurrent connections
- **Zero-copy streaming**: LLM responses stream directly without buffering
- **Connection pooling**: Reuses TCP connections for better performance
- **HTTP/2 support**: Better multiplexing and compression

## Next Steps

See `ASYNC_PROXY_SETUP.md` for detailed documentation.

