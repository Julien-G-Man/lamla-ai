# Lamla AI – Architecture & Deployment Guide

## Overview

This project uses:
- **Django**: REST API gateway + database (single source of truth)
- **FastAPI**: Stateless async worker for high-concurrency LLM tasks
- **React**: Frontend (separate deployment)
- **PostgreSQL**: Database for both development and production (database: `lamla_db`)

### Key Design Principles
1. **FastAPI is stateless**: No database, no state persistence. Only processes prompts and calls LLM providers.
2. **Django owns persistence**: All chat history, user data, and sessions stored in Django's DB.
3. **React calls Django**: Frontend communicates with Django REST API (CORS-enabled).
4. **Django calls FastAPI**: When a user message arrives, Django posts the prompt to FastAPI and awaits the AI response.
5. **High concurrency**: FastAPI handles multiple requests concurrently; Django can delegate heavy async work.

---

## Getting Started (Development)

### Prerequisites
- Python 3.10+
- PostgreSQL (see `backend/SETUP_POSTGRES.md` for setup)
- Node.js + npm (for React)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp ../.env.example ../.env
# Edit .env with your API keys and FASTAPI_BASE_URL

# Setup PostgreSQL database (see SETUP_POSTGRES.md)
# For local dev: CREATE DATABASE lamla_db; (using psql)
# For production: python manage.py setup_postgres (reads from .env)

# Run Django migrations
python manage.py migrate

# (Optional) Create Django superuser
python manage.py createsuperuser

# (Optional) Load sample knowledge base data
python manage.py loaddata apps/chatbot/fixtures/knowledge_base.json
```

### 2. Start Django (API Gateway)

**IMPORTANT**: Use ASGI server (uvicorn) for async support, not `runserver`:

```bash
# From backend directory
# Windows:
.\run_django.bat
# Or manually:
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload

# Linux/Mac:
./run_django.sh
# Or manually:
uvicorn lamla.asgi:application --host 0.0.0.0 --port 8000 --reload
```

Django will listen on `http://localhost:8000`.

### 3. Start FastAPI (Async Worker)

In a separate terminal:

```bash
# From backend directory
cd fastapi_service

# Option A: Development (with auto-reload)
FASTAPI_RELOAD=true python run.py

# Option B: Production-ready (with multiple workers)
FASTAPI_WORKERS=4 python run.py

# Option C: Using Gunicorn (production)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker fastapi_service.main:app
```

FastAPI will listen on `http://localhost:8001`.

### 4. Start React Frontend

```bash
cd frontend
npm install
npm start
```

React will run on `http://localhost:3000`.

---

## API Endpoints

### Django (React-facing)
- `POST /api/chat/` – Send a message
  ```json
  {
    "message": "Hello!"
  }
  ```
  Returns:
  ```json
  {
    "response": "AI response here"
  }
  ```

- `POST /api/chat/file/` – Upload file + message (multipart)
  ```
  file_upload: <binary>
  message: "Analyze this document"
  ```

- `POST /api/chat/stream/` – Streaming response (SSE)

### FastAPI (Django-facing, internal)
- `POST /chatbot` – Process prompt (async)
  ```json
  {
    "prompt": "You are Lamla AI Tutor...\n\nUser: Hello\nAI:",
    "max_tokens": 400
  }
  ```
  Returns:
  ```json
  {
    "response": "AI response text"
  }
  ```

- `GET /health` – Health check

---

## High-Concurrency Setup

### FastAPI Workers
FastAPI uses **Uvicorn** with multiple worker processes for high concurrency:

```bash
# 4 workers (typical for 2-core systems)
FASTAPI_WORKERS=4 python run.py

# 8 workers (for 4-core+ systems)
FASTAPI_WORKERS=8 python run.py
```

Each worker handles requests asynchronously using `asyncio`, enabling true high concurrency.

### Django ASGI (Optional)
For even higher concurrency, run Django with Daphne (ASGI server):

```bash
pip install daphne
daphne -b 0.0.0.0 -p 8000 lamla.asgi:application
```

---

## Database: PostgreSQL

### Local Setup
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Windows: Download from postgresql.org

# Create database
createdb lamla_db

# Update .env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/lamla_db

# Run migrations
python manage.py migrate
```

### Production
Use a managed PostgreSQL service (AWS RDS, Azure Database, Heroku Postgres, etc.):

```bash
DATABASE_URL=postgresql://user:pass@host:5432/lamla_db
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SECRET_KEY` | (required) | Django secret key |
| `DEBUG` | `True` | Django debug mode |
| `DATABASE_URL` | `sqlite:///db.sqlite3` | DB connection string |
| `FASTAPI_BASE_URL` | `http://localhost:8001` | Django→FastAPI URL |
| `FASTAPI_PORT` | `8001` | FastAPI port |
| `FASTAPI_WORKERS` | `4` | Uvicorn worker count |
| `FASTAPI_RELOAD` | `false` | Auto-reload on code change |
| `CORS_ALLOWED_ORIGINS` | (env) | CORS origins for React |
| `AZURE_OPENAI_API_KEY` | (env) | Azure LLM key |
| `DEEPSEEK_API_KEY` | (env) | DeepSeek LLM key |

---

## Docker Deployment

### Build & Run with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lamla_db
      POSTGRES_USER: lamla
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"

  django:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    environment:
      DATABASE_URL: postgresql://lamla:secure_password@postgres:5432/lamla_db
      FASTAPI_BASE_URL: http://fastapi:8001
      SECRET_KEY: your_secret_key
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  fastapi:
    build: ./backend
    command: python fastapi_service/run.py
    environment:
      FASTAPI_WORKERS: 4
    ports:
      - "8001:8001"

  react:
    build: ./frontend
    ports:
      - "3000:3000"
```

Run:
```bash
docker-compose up -d
```

---

## Troubleshooting

### FastAPI not responding
- Check `FASTAPI_BASE_URL` in Django `.env`
- Ensure FastAPI is running: `curl http://localhost:8001/health`

### CORS errors
- Verify React origin in `CORS_ALLOWED_ORIGINS` and `FASTAPI_ALLOWED_ORIGINS`
- Check browser console for specific origin rejected

### Chat history not persisting
- Check Django database connection: `python manage.py dbshell`
- Verify `ChatSession` and `ChatMessage` tables exist: `python manage.py migrate`

### LLM provider failures
- Check API keys in `.env`
- Verify provider endpoints are reachable
- FastAPI logs will show which provider failed

---

## Security

**⚠️ CRITICAL: Never commit secrets to version control!**

### Best Practices

1. **Environment Variables**: Store all secrets in `.env` files (already in `.gitignore`)
2. **Database Passwords**: Use strong passwords, never hardcode in SQL scripts
3. **API Keys**: Store in environment variables, not in source code
4. **Production**: Use secrets management services (AWS Secrets Manager, Azure Key Vault, etc.)

### Quick Security Checklist

- [ ] `.env` file is in `.gitignore` ✅ (already configured)
- [ ] No passwords in SQL scripts (use placeholders)
- [ ] No API keys in source files
- [ ] Strong passwords for production databases
- [ ] Different credentials for dev/staging/prod

See `backend/SECURITY.md` for detailed security guidelines.

---

## Production Deployment

### Checklist
- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY` (generate with: `openssl rand -hex 32`)
- [ ] Configure PostgreSQL with strong passwords
- [ ] **Never hardcode credentials** - use environment variables or secrets manager
- [ ] Enable SSL/TLS for database connections
- [ ] Set `FASTAPI_SECRET` to a strong random value
- [ ] Configure CORS properly for production domains
- [ ] Use managed PostgreSQL service (AWS RDS, Azure Database, etc.)
- [ ] Set all LLM provider keys
- [ ] Configure CORS origins (production URLs only)
- [ ] Run behind a reverse proxy (Nginx, CloudFront)
- [ ] Enable HTTPS (SSL certificates)
- [ ] Set up monitoring/logging (Sentry, CloudWatch)
- [ ] Configure auto-scaling for FastAPI workers

### Recommended Stack
- **Django**: Gunicorn + Nginx
- **FastAPI**: Gunicorn with Uvicorn workers + Nginx
- **Database**: AWS RDS / Azure Database / Managed PostgreSQL
- **Frontend**: Vercel / Netlify

---

## License

See [LICENSE](LICENSE).
