"""
FastAPI Uvicorn entry point for high-concurrency async task handling.

This service is designed to be independent from the Django backend:
- It runs as its own process / deployment.
- It reads configuration only from its own environment (and optional local .env).

Configured via environment variables:
  FASTAPI_HOST    (default: 0.0.0.0)
  FASTAPI_PORT    (default: 8001)
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

    This allows fastapi_service to be hosted separately with its own configuration,
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
    # Load local .env before reading any environment variables
    _load_env_file()

    # Environment-based configuration
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    port = int(os.getenv("FASTAPI_PORT", 8001))
    workers = int(os.getenv("FASTAPI_WORKERS", 4))
    reload = os.getenv("FASTAPI_RELOAD", "false").lower() == "true"

    # Development mode: single worker, reload enabled
    if reload:
        workers = 1

    print(f"Starting FastAPI on {host}:{port} (workers={workers}, reload={reload})")

    # When run from inside the fastapi_service package, importing "main:app"
    # keeps this worker self-contained and decoupled from the Django backend.
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        workers=1 if reload else workers,  # Only 1 worker in reload mode
        log_level="info",
    )