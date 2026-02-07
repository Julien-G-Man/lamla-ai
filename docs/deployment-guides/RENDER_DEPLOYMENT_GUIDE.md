# Render Deployment Guide - Django & FastAPI

## Overview

This guide covers the deployment of the Lamla AI backend services on Render with two separate servers:
- **Django Server** - Main API
- **FastAPI Server** - Async API services

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Vercel)               │
│  React App - Already Deployed           │
└────────┬────────────────────────────────┘
         │
         ├─────────────────────────────────────┬──────────────────────┐
         │                                     │                      │
    ┌────▼─────────────────┐        ┌────────▼───────────┐   ┌──────▼─────────────┐
    │  Django Server       │        │  FastAPI Server    │   │  Database         │
    │  (Render)           │        │  (Render)          │   │  PostgreSQL       │
    │  - Main API         │        │  - Async Tasks     │   │  (Render)         │
    │  - User Auth        │        │  - Chat Processing │   │                   │
    │  - Quiz Module      │        │  - File Processing │   │                   │
    └────┬────────────────┘        └────────┬───────────┘   └─────────────────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        │
                    Shared Database
```

## Pre-Deployment Requirements

### Django Requirements
- Python 3.9+
- Django 4.2+
- Gunicorn (WSGI server)
- PostgreSQL client
- All packages from `backend/requirements.txt`

### FastAPI Requirements
- Python 3.9+
- FastAPI framework
- Uvicorn (ASGI server)
- PostgreSQL client
- All packages from `backend/fastapi_service/requirements.txt`

### Environment Variables

Create `.env` files for each service:

#### Django Server (.env)
```
DEBUG=False
ALLOWED_HOSTS=your-django-app.onrender.com
DATABASE_URL=postgresql://user:password@localhost/lamla_db
SECRET_KEY=your-secret-key-here
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
LOG_LEVEL=INFO
```

#### FastAPI Server (.env)
```
DEBUG=False
DATABASE_URL=postgresql://user:password@localhost/lamla_db
LOG_LEVEL=INFO
FASTAPI_ENV=production
```

## Django Deployment Steps

### 1. Prepare Django Application

1. **Update settings.py**
   ```python
   # settings.py
   DEBUG = os.getenv('DEBUG', 'False') == 'True'
   ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')
   
   # Database configuration
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': os.getenv('DB_NAME', 'lamla_db'),
           'USER': os.getenv('DB_USER'),
           'PASSWORD': os.getenv('DB_PASSWORD'),
           'HOST': os.getenv('DB_HOST'),
           'PORT': os.getenv('DB_PORT', '5432'),
       }
   }
   
   # CORS settings
   CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
   ```

2. **Create Procfile** (in `/backend`)
   ```
   web: gunicorn lamla.wsgi --log-file -
   release: python manage.py migrate
   ```

3. **Update requirements.txt**
   ```
   Django==4.2.0
   djangorestframework==3.14.0
   django-cors-headers==4.0.0
   psycopg2-binary==2.9.6
   gunicorn==20.1.0
   python-decouple==3.8
   ```

### 2. Create Render Service

1. **Go to [render.com](https://render.com)**
2. **Create New → Web Service**
3. **Configure:**
   - **Name:** `lamla-django-api`
   - **Region:** Choose closest to your users
   - **Runtime:** Python 3.11
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command:** `gunicorn lamla.wsgi`
   - **Environment:** Add all variables from `.env`

### 3. Database Setup

1. **Create PostgreSQL Database on Render**
   - **Go to Render Dashboard**
   - **Create New → PostgreSQL Database**
   - **Configure:**
     - **Name:** `lamla-database`
     - **Region:** Same as Django service
     - **PostgreSQL Version:** 15
   
2. **Get connection string**
   - Copy the External Database URL
   - Add to Django service environment as `DATABASE_URL`

### 4. Deploy Django

1. **Push code to Git**
   ```bash
   git add .
   git commit -m "Deploy Django to Render"
   git push
   ```

2. **Monitor deployment**
   - Check Render dashboard
   - View logs for errors

## FastAPI Deployment Steps

### 1. Prepare FastAPI Application

1. **Create main.py** (if not exists)
   ```python
   # backend/fastapi_service/main.py
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   import os
   
   app = FastAPI(title="Lamla FastAPI Service")
   
   # CORS
   app.add_middleware(
       CORSMiddleware,
       allow_origins=os.getenv('CORS_ALLOWED_ORIGINS', '*').split(','),
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   
   @app.get("/health")
   async def health_check():
       return {"status": "healthy"}
   ```

2. **Create Procfile** (in `/backend/fastapi_service`)
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Create requirements.txt**
   ```
   fastapi==0.104.0
   uvicorn==0.24.0
   psycopg2-binary==2.9.6
   aiopg==1.4.0
   python-decouple==3.8
   ```

### 2. Create Render Service

1. **Go to [render.com](https://render.com)**
2. **Create New → Web Service**
3. **Configure:**
   - **Name:** `lamla-fastapi-service`
   - **Region:** Same as Django
   - **Runtime:** Python 3.11
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment:** Add all variables from `.env`

### 3. Deploy FastAPI

1. **Push code to Git**
   ```bash
   git add .
   git commit -m "Deploy FastAPI to Render"
   git push
   ```

2. **Monitor deployment**
   - Check Render dashboard
   - Test `/health` endpoint

## Environment Variables Setup

### Django Service Variables
| Variable | Value | Example |
|----------|-------|---------|
| DEBUG | false | - |
| ALLOWED_HOSTS | Your domain | lamla-django-api.onrender.com |
| DATABASE_URL | PostgreSQL URL | postgresql://user:pass@host/db |
| SECRET_KEY | Django secret | (generate with `django-insecure-...`) |
| CORS_ALLOWED_ORIGINS | Frontend URL | https://lamla.vercel.app |
| LOG_LEVEL | INFO or DEBUG | INFO |

### FastAPI Service Variables
| Variable | Value | Example |
|----------|-------|---------|
| DATABASE_URL | PostgreSQL URL | postgresql://user:pass@host/db |
| CORS_ALLOWED_ORIGINS | Frontend URL | https://lamla.vercel.app |
| LOG_LEVEL | INFO or DEBUG | INFO |
| FASTAPI_ENV | production | production |

## Post-Deployment Verification

### Django Server
```bash
# Check health
curl https://your-django-app.onrender.com/health/

# Check API
curl https://your-django-app.onrender.com/api/quiz/

# View logs
# Go to Render dashboard → Django service → Logs
```

### FastAPI Server
```bash
# Check health
curl https://your-fastapi-app.onrender.com/health

# View logs
# Go to Render dashboard → FastAPI service → Logs
```

## Connecting Services

### Django to FastAPI
In Django views/services, call FastAPI:

```python
import httpx

async def call_fastapi(endpoint: str, data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://your-fastapi-app.onrender.com/{endpoint}",
            json=data
        )
    return response.json()
```

### FastAPI to Django
In FastAPI endpoints, call Django:

```python
import httpx

async def call_django(endpoint: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://your-django-app.onrender.com{endpoint}",
            headers={"Authorization": "Bearer your-token"}
        )
    return response.json()
```

## Database Management

### Run Migrations
```bash
# SSH into Django service on Render
# Or configure migration command in Procfile
# This runs automatically: python manage.py migrate
```

### Backup Database
```bash
# Via Render dashboard
# PostgreSQL → Backups → Create backup

# Manual backup
pg_dump -h hostname -U username -d lamla_db > backup.sql
```

### Access Database
```bash
# Connect directly
psql "postgresql://user:password@host:5432/lamla_db"
```

## Troubleshooting

### Django won't start
1. Check logs in Render dashboard
2. Verify `ALLOWED_HOSTS` matches domain
3. Confirm `SECRET_KEY` is set
4. Check database connection

### FastAPI won't start
1. Check uvicorn logs
2. Verify main.py syntax
3. Confirm PORT environment variable is available

### Database connection errors
1. Verify DATABASE_URL format
2. Check database is running
3. Verify credentials
4. Test connection from Django shell

### CORS errors
1. Add frontend URL to `CORS_ALLOWED_ORIGINS`
2. Verify services can reach each other
3. Check headers in requests

## Monitoring & Logging

### Django Logs
- View in Render dashboard
- Configure LOG_LEVEL: DEBUG/INFO/WARNING/ERROR

### FastAPI Logs
- View in Render dashboard
- Check Uvicorn output

### Database Logs
- View in Render PostgreSQL dashboard

## Performance Optimization

### Django
- Use caching (Redis recommended)
- Enable gzip compression
- Optimize queries (use select_related, prefetch_related)
- Use CDN for static files

### FastAPI
- Use async/await for I/O operations
- Implement caching
- Use connection pooling for database

## Security Considerations

- [ ] Set `DEBUG=False` in production
- [ ] Use strong `SECRET_KEY`
- [ ] Enable HTTPS (Render does automatically)
- [ ] Validate all input
- [ ] Use authentication/authorization
- [ ] Keep dependencies updated
- [ ] Regular security audits

## Scaling

### Horizontal Scaling (on Render)
1. Go to service settings
2. Increase number of instances
3. Load balancing is automatic

### Database Scaling
- Upgrade PostgreSQL plan on Render
- Archive old data
- Implement caching layer

## Costs Estimation

| Service | Tier | Cost |
|---------|------|------|
| Django Web Service | Starter ($7/month) | $7 |
| FastAPI Web Service | Starter ($7/month) | $7 |
| PostgreSQL Database | Starter (0.5GB - $7/month) | $7 |
| **Total** | | **$21/month** |

*Prices are approximate and may vary based on usage*

## Next Steps

1. ✅ Prepare code and configuration
2. ✅ Set up Render services
3. ✅ Deploy Django and FastAPI
4. ✅ Configure database
5. ✅ Test endpoints
6. ✅ Monitor logs
7. ✅ Set up alerts
8. ✅ Plan scaling strategy

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Django Deployment Guide](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Last Updated:** January 27, 2026

For more information, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
