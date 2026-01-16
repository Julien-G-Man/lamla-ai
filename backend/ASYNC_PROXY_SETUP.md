# High-Performance Async Proxy Pattern Implementation

This document describes the Asynchronous Proxy Pattern implementation for high-concurrency Django-to-FastAPI communication.

## Architecture Overview

```
┌─────────────┐
│   React UI  │ (http://localhost:3000)
│             │
└──────┬──────┘
       │ HTTP POST
       ▼
┌──────────────────────┐
│  Django (ASGI)       │ (http://localhost:8000)
│  - Auth/Session      │ ← Fast (synchronous DB operations)
│  - Async Proxy Views │ ← Non-blocking async HTTP client
└──────┬───────────────┘
       │ Async HTTPX (streaming)
       │ X-Internal-Secret header
       ▼
┌──────────────────────┐
│  FastAPI Service     │ (http://localhost:8001)
│  - LLM Processing    │ ← I/O-heavy async operations
│  - Internal Auth     │ ← Verifies secret header
└──────────────────────┘
```

## Key Features

### 1. **Non-Blocking Architecture**
- Django uses `await` on FastAPI calls, releasing worker threads to handle other users
- A small number of Django workers can manage thousands of concurrent connections

### 2. **Zero-Copy Streaming**
- LLM responses stream directly from FastAPI through Django to React
- No buffering of entire responses in Django's memory
- Uses `StreamingHttpResponse` with `aiter_bytes()`

### 3. **Connection Pooling**
- Persistent `httpx.AsyncClient` with connection reuse
- HTTP/2 support for better performance
- Configurable connection limits and keepalive

### 4. **Security**
- Internal secret header (`X-Internal-Secret`) for FastAPI authentication
- Django signs requests instead of forwarding full session data
- FastAPI middleware verifies all requests (except `/health`)

## Configuration

### Django Settings (`lamla/settings.py`)

```python
FASTAPI_BASE_URL = os.getenv("FASTAPI_BASE_URL", "http://localhost:8001")
FASTAPI_SECRET = os.getenv("FASTAPI_SECRET", "change-me-in-production-secret-key")
```

### FastAPI Environment Variables

Set these in your FastAPI service environment:

```bash
FASTAPI_SECRET=change-me-in-production-secret-key  # Must match Django's FASTAPI_SECRET
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8001
FASTAPI_WORKERS=4
```

## Running Django with ASGI

**Critical**: Django must run with an ASGI server (not WSGI) to support async views.

### Development
```bash
# Using Uvicorn
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload

# Or using Daphne
daphne -b 0.0.0.0 -p 8000 lamla.asgi:application
```

### Production
```bash
# Using Uvicorn with multiple workers
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --workers 4

# Or using Gunicorn with Uvicorn workers
gunicorn lamla.asgi:application -w 4 -k uvicorn.workers.UvicornWorker
```

## API Endpoints

### Chatbot Endpoints

**POST `/api/chat/`** - Async proxy for chatbot
- Handles session/auth in Django
- Proxies to FastAPI `/chatbot/`
- Returns JSON response

**POST `/api/chat/stream/`** - Streaming async proxy
- Streams LLM response chunks directly to client
- Zero-copy streaming for optimal performance

**POST `/api/chat/file/`** - File upload (still sync, can be converted later)

### Quiz Endpoints

**POST `/api/quiz/generate/`** - Async proxy for quiz generation
- Proxies to FastAPI `/quiz/`
- Returns quiz JSON

## Performance Tuning

### Connection Pool Settings

Edit `apps/core/async_client.py`:

```python
_async_client = httpx.AsyncClient(
    base_url=fastapi_base,
    timeout=timeout,
    limits=httpx.Limits(
        max_keepalive_connections=20,  # Adjust based on load
        max_connections=100,            # Max concurrent connections
        keepalive_expiry=30.0           # Keep connections for 30s
    ),
    http2=True,
)
```

### Timeout Configuration

```python
timeout = httpx.Timeout(
    connect=5.0,      # Connection timeout
    read=60.0,        # Read timeout (for LLM responses)
    write=5.0,        # Write timeout
    pool=5.0         # Pool timeout
)
```

## Monitoring

### Key Metrics to Monitor

1. **Django Worker Utilization**
   - Low worker count with high concurrency = success
   - Monitor active connections per worker

2. **FastAPI Response Times**
   - Track LLM generation latency
   - Monitor FastAPI worker utilization

3. **Connection Pool Usage**
   - Monitor connection pool exhaustion
   - Track connection reuse rate

4. **Streaming Performance**
   - Measure time-to-first-byte (TTFB)
   - Track streaming throughput

## Troubleshooting

### Issue: "RuntimeError: This event loop is already running"

**Solution**: Ensure Django is running with ASGI server, not WSGI.

### Issue: FastAPI returns 401/403

**Solution**: Verify `FASTAPI_SECRET` matches in both Django and FastAPI environments.

### Issue: High memory usage

**Solution**: 
- Ensure streaming is enabled (`stream=True`)
- Check connection pool limits
- Monitor for connection leaks

### Issue: Slow responses

**Solution**:
- Verify FastAPI is running with multiple workers
- Check network latency between Django and FastAPI
- Ensure connection pooling is working (check logs)

## Migration from Sync to Async

The async proxy views are drop-in replacements for the sync views:

1. **Old sync views** are still available in `views.py` for backward compatibility
2. **New async views** are in `async_views.py` and wired up in `urls.py`
3. **Gradual migration**: You can test async endpoints alongside sync ones

## Security Considerations

1. **Secret Management**: Use environment variables or secret management service
2. **Network Security**: Use private networking (VPC/Docker network) for Django↔FastAPI
3. **Rate Limiting**: Consider adding rate limiting middleware
4. **Request Validation**: Validate all inputs before proxying to FastAPI

## Next Steps

1. **Load Testing**: Test with high concurrency (1000+ concurrent requests)
2. **Monitoring**: Set up APM (Application Performance Monitoring)
3. **Scaling**: Scale FastAPI independently based on LLM traffic
4. **Caching**: Consider adding Redis cache for common queries

## Files Modified/Created

### New Files
- `apps/core/async_client.py` - Persistent async HTTP client
- `apps/core/proxy_views.py` - Generic proxy view utilities
- `apps/chatbot/async_views.py` - Async chatbot proxy views
- `apps/quiz/async_views.py` - Async quiz proxy views
- `fastapi_service/core/middleware.py` - Internal auth middleware

### Modified Files
- `apps/core/apps.py` - Client initialization/cleanup
- `apps/chatbot/urls.py` - Routes to async views
- `apps/quiz/urls.py` - Routes to async views
- `lamla/settings.py` - Added FASTAPI_SECRET
- `fastapi_service/main.py` - Added auth middleware

