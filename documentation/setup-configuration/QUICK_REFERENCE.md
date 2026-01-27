# Quick Reference

## Common Commands

### Start Development Server
```bash
# Terminal 1: Django API Gateway
cd backend && python run_django.py

# Terminal 2: FastAPI Async Worker
cd backend/fastapi_service && python run.py

# Terminal 3: React Frontend
cd frontend && npm start
```

### Test Endpoints
```bash
# Send chat message
curl -X POST http://localhost:8000/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Check conversation history
curl http://localhost:8000/api/chat/history/

# Upload file
curl -X POST http://localhost:8000/api/chat/file/ \
  -F "file_upload=@file.pdf" \
  -F "message=Analyze this"

# Clear history
curl -X DELETE http://localhost:8000/api/chat/history/clear/

# Stream response
curl -X POST http://localhost:8000/api/chat/stream/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?"}'

# Health check
curl http://localhost:8001/health
```

### Database
```bash
# Migrate
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Open shell
python manage.py dbshell
```

---

## Environment Files

### Create `.env` in backend/
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lamla_db
FASTAPI_BASE_URL=http://localhost:8001
FASTAPI_SECRET=dev-secret-key-change-in-production
DEBUG=True
SECRET_KEY=your-django-secret-key
```

### Create `.env` in backend/fastapi_service/
```
FASTAPI_PORT=8001
FASTAPI_WORKERS=4
FASTAPI_RELOAD=false
FASTAPI_SECRET=dev-secret-key-change-in-production
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment
```

---

## Ports & URLs

| Service | URL | Port | Type |
|---------|-----|------|------|
| Django API | http://localhost:8000 | 8000 | ASGI |
| FastAPI | http://localhost:8001 | 8001 | ASGI |
| React Frontend | http://localhost:3000 | 3000 | SPA |
| PostgreSQL | localhost | 5432 | DB |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat/` | Send message |
| POST | `/api/chat/stream/` | Stream response |
| POST | `/api/chat/file/` | Upload file |
| GET | `/api/chat/history/` | Get messages |
| DELETE | `/api/chat/history/clear/` | Clear history |

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "Event loop is closed" | Use `python run_django.py` not `manage.py runserver` |
| FastAPI 503 | Check FastAPI is running: `curl localhost:8001/health` |
| CORS errors | Verify `FASTAPI_SECRET` matches in Django and FastAPI |
| Messages not saving | Check logs for "Failed to save" errors |
| File upload fails | Ensure file < 10MB and format is PDF/DOCX/PPTX/TXT |
| Azure safety block | User should rephrase their message |

---

## Key Files

- `run_django.py` - Django ASGI server runner
- `fastapi_service/run.py` - FastAPI server runner
- `apps/chatbot/async_views.py` - API endpoints
- `apps/chatbot/urls.py` - URL routing
- `fastapi_service/routes/chatbot.py` - FastAPI chatbot route
- `fastapi_service/core/ai_client.py` - LLM provider integration

---

## Documentation

- [GETTING_STARTED.md](GETTING_STARTED.md) - Full setup guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [CONVERSATION_SAVE_FIXES.md](CONVERSATION_SAVE_FIXES.md) - Database fixes
- [AZURE_SAFETY_BLOCK_FIX.md](AZURE_SAFETY_BLOCK_FIX.md) - Content filter handling
