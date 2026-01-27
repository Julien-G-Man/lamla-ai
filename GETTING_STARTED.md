# Setup Guide - Running Django & FastAPI

## Quick Start

### Terminal 1 - Django (API Gateway)
```bash
cd backend
python run_django.py
```

**Options:**
```bash
python run_django.py --port 8000 --reload              # Dev mode (default)
python run_django.py --port 8000 --no-reload --workers 4  # Production mode
```

### Terminal 2 - FastAPI (Async Worker)
```bash
cd backend/fastapi_service
python run.py
```

**Options:**
```bash
FASTAPI_PORT=8001 FASTAPI_WORKERS=4 FASTAPI_RELOAD=false python run.py
```

### Terminal 3 - React Frontend
```bash
cd frontend
npm start
```

---

## Environment Variables

### Django (.env in backend/)
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lamla_db

# FastAPI Configuration
FASTAPI_BASE_URL=http://localhost:8001
FASTAPI_SECRET=your-secret-key-here-change-in-production

# Debug
DEBUG=True
```

### FastAPI (.env in backend/fastapi_service/)
```bash
# Server
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8001
FASTAPI_WORKERS=4
FASTAPI_RELOAD=false

# Security
FASTAPI_SECRET=your-secret-key-here-change-in-production

# LLM Providers
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-12-01-preview

DEEPSEEK_API_KEY=your-key
GEMINI_API_KEY=your-key
HUGGING_FACE_API_TOKEN=your-token
```

---

## Database Setup

### First Time Setup
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser  # Optional
```

### PostgreSQL Setup (Windows)
```bash
# Create database
psql -U postgres
CREATE DATABASE lamla_db;
\q
```

---

## Testing

### Manual Testing with curl

**Send a message:**
```bash
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

**Check conversation history:**
```bash
curl http://localhost:8000/api/chat/history/
```

**Clear conversation:**
```bash
curl -X DELETE http://localhost:8000/api/chat/history/clear/
```

**Upload file:**
```bash
curl -X POST http://localhost:8000/api/chat/file/ \
  -F "file_upload=@document.pdf" \
  -F "message=Summarize this"
```

### Streaming Response
```bash
curl -X POST http://localhost:8000/api/chat/stream/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?"}'
```

---

## Troubleshooting

### Django won't start
**Error:** `Event loop is closed` or `cannot be called from a running event loop`

**Fix:** Make sure you're using the ASGI server:
```bash
python run_django.py  # Correct ✓
python manage.py runserver  # Wrong ✗
```

### FastAPI 503 errors
**Error:** `AI service temporarily unavailable`

**Check:**
```bash
curl http://localhost:8001/health
```

If 404, FastAPI isn't running. Start it:
```bash
cd backend/fastapi_service
python run.py
```

### Conversation not saving
**Check database:**
```bash
curl http://localhost:8000/api/chat/history/
```

If empty, check Django logs for `Failed to save` errors.

### Azure Safety Block
**Message:** `[Safety Block] This request was flagged by Azure's content filter...`

This is **not an error** - it's Azure detecting inappropriate content. The user should rephrase their message.

### CORS Errors
**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Fix:** Check `FASTAPI_SECRET` is set and matches in both Django and FastAPI:
```bash
# Both should be the same
echo $FASTAPI_SECRET
```

---

## File Uploads

### Supported Formats
- PDF (.pdf)
- Word (.docx)
- PowerPoint (.pptx)
- Text (.txt)

### Limits
- Max file size: 10 MB
- Max extracted text: 50,000 characters (longer files are truncated)

---

## Performance Tips

### Development Mode
```bash
python run_django.py --reload          # Auto-reload on code changes
```

### Production Mode
```bash
python run_django.py --no-reload --workers 4  # 4 worker processes
FASTAPI_WORKERS=8 python fastapi_service/run.py  # 8 FastAPI workers
```

For production, use a process manager like Gunicorn or systemd.

---

## Next Steps

1. ✓ Install dependencies: `pip install -r requirements.txt`
2. ✓ Setup database: `python manage.py migrate`
3. ✓ Configure environment: Create `.env` files
4. ✓ Start services: `python run_django.py` & `python run.py`
5. ✓ Test endpoints: See testing section above
6. ✓ Access frontend: http://localhost:3000

---

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [ASYNC_PROXY_SETUP.md](backend/ASYNC_PROXY_SETUP.md) - Async proxy pattern
- [QUICK_START_ASYNC.md](backend/QUICK_START_ASYNC.md) - Async quick start
- [CONVERSATION_SAVE_FIXES.md](CONVERSATION_SAVE_FIXES.md) - Conversation persistence fixes
- [AZURE_SAFETY_BLOCK_FIX.md](AZURE_SAFETY_BLOCK_FIX.md) - Safety filter handling
