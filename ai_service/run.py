"""
FastAPI Uvicorn entry point for high-concurrency async task handling.

This service is designed to be independent from the Django backend:
- It runs as its own process / deployment.
- It reads configuration only from its own environment (and local .env).

Configured via environment variables:
  FASTAPI_HOST    (default: 0.0.0.0)
  FASTAPI_PORT    (default: 8002)
  FASTAPI_WORKERS (default: 4) - CPU cores recommended
  FASTAPI_RELOAD  (default: false) - Enable code reload in development
"""
import os
import uvicorn

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def _load_env_file() -> None:
    """
    Load environment variables from a local .env file located next to this script.

    This allows ai_service to be hosted separately with its own configuration,
    without importing anything from the Django backend.
    """
    if load_dotenv is None:
        # python-dotenv not installed; nothing to load.
        return

    service_root = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(service_root, ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path, override=False)


if __name__ == "__main__":
    # Load local .env before settings are read
    _load_env_file()

    from core.config import settings

    # Development mode: single worker, reload enabled
    workers = 1 if settings.FASTAPI_RELOAD else settings.FASTAPI_WORKERS

    print(
        f"Starting FastAPI on {settings.FASTAPI_HOST}:{settings.FASTAPI_PORT} "
        f"(workers={workers}, reload={settings.FASTAPI_RELOAD})"
    )

    uvicorn.run(
        "main:app",
        host=settings.FASTAPI_HOST,
        port=settings.FASTAPI_PORT,
        reload=settings.FASTAPI_RELOAD,
        workers=workers,
        log_level="info",
    )