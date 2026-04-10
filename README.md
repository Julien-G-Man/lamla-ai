# Lamla AI

Lamla AI is a modular learning platform with Django + FastAPI backend services and a React frontend.

## Tech Stack

- Django (API gateway + persistence)
- FastAPI (LLM worker)
- React (web app)
- PostgreSQL (local) / Neon PostgreSQL (production)

## Start Here

- Setup guide: `docs/setup-configuration/GETTING_STARTED.md`
- Quick reference: `docs/setup-configuration/QUICK_REFERENCE.md`
- Architecture: `docs/architecture-design/ARCHITECTURE.md`
- Frontend routes: `docs/frontend/ROUTES_AND_PAGES.md`
- Security baseline: `docs/security-reference/SECURITY.md`

## Local Development (Short)

1. Backend (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python run.py --port 8000 --reload
```

2. FastAPI worker

```bash
cd ai_service
python run.py
```

3. Frontend

```bash
cd frontend
npm install
npm start
```

## Health Checks

- Django: `GET /health/`
- FastAPI: `GET /health`

## Notes

- Keep documentation updates in the same PR as behavior/API changes.
- Use `docs/README.md` as the canonical documentation index.
