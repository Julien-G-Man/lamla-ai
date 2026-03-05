"""
Async HTTP Client for FastAPI Proxy Pattern

This module provides a persistent httpx.AsyncClient with connection pooling
for high-performance async proxying from Django to FastAPI.
"""
import asyncio
import httpx
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Global persistent client instances keyed by base URL
_async_clients: dict[str, httpx.AsyncClient] = {}


def _normalize_base_url(url: str) -> str:
    base = (url or "").strip().rstrip("/")
    if not base:
        return ""
    if not base.startswith(("http://", "https://")):
        # Favor HTTPS for production hosts when scheme is omitted.
        base = f"https://{base}"
    return base


def get_fastapi_base_urls() -> list[str]:
    """
    Resolve one or more FastAPI base URLs.
    Priority:
    1) FASTAPI_BASE_URLS (comma-separated)
    2) FASTAPI_BASE_URL
    """
    urls: list[str] = []
    raw_multi = getattr(settings, "FASTAPI_BASE_URLS", "")
    if raw_multi:
        for item in str(raw_multi).split(","):
            normalized = _normalize_base_url(item)
            if normalized:
                urls.append(normalized)

    if not urls:
        single = _normalize_base_url(getattr(settings, "FASTAPI_BASE_URL", "http://localhost:8001"))
        if single:
            urls.append(single)

    return list(dict.fromkeys(urls))


def get_async_client(base_url: str | None = None) -> httpx.AsyncClient:
    """
    Get or create the persistent async HTTP client.
    
    This client uses connection pooling to reuse TCP connections,
    significantly improving performance at high concurrency.
    """
    global _async_clients
    fastapi_base = _normalize_base_url(base_url) if base_url else ""
    if not fastapi_base:
        base_urls = get_fastapi_base_urls()
        fastapi_base = base_urls[0] if base_urls else "http://localhost:8001"

    if fastapi_base not in _async_clients:
        base_urls = get_fastapi_base_urls()
        timeout = httpx.Timeout(
            connect=5.0,      # Connection timeout
            read=60.0,       # Read timeout (for LLM responses)
            write=5.0,       # Write timeout
            pool=5.0         # Pool timeout
        )
        
        _async_clients[fastapi_base] = httpx.AsyncClient(
            base_url=fastapi_base,
            timeout=timeout,
            limits=httpx.Limits(
                max_keepalive_connections=20,  # Keep connections alive
                max_connections=100,            # Max concurrent connections
                keepalive_expiry=30.0           # Keep connections for 30s
            ),
            http2=True,  # Enable HTTP/2 for better performance
        )
        logger.info("Initialized FastAPI AsyncClient. primary=%s all=%s", fastapi_base, base_urls)
    
    return _async_clients[fastapi_base]


async def close_async_client():
    """Close the async client (call during Django shutdown)"""
    global _async_clients
    if not _async_clients:
        return
    for base, client in list(_async_clients.items()):
        await client.aclose()
        logger.info("Closed persistent AsyncClient for %s", base)
    _async_clients = {}


def build_fastapi_headers() -> dict:
    """
    Build headers for FastAPI requests with authentication.
    
    Uses a secret header instead of forwarding full Django session
    for better security and performance.
    """
    fastapi_secret = getattr(settings, "FASTAPI_SECRET")
    return {
        "X-Internal-Secret": fastapi_secret,
        "Content-Type": "application/json",
    }


async def call_fastapi(
    method: str,
    path: str,
    *,
    retries_per_url: int = 2,
    retry_delay_seconds: float = 0.6,
    **kwargs,
) -> httpx.Response:
    """
    Call FastAPI with retry + URL failover.
    Raises httpx.RequestError if all attempts fail.
    """
    urls = get_fastapi_base_urls()
    if not urls:
        raise httpx.RequestError("No FASTAPI base URL configured")

    last_error: Exception | None = None

    for base in urls:
        client = get_async_client(base)
        for attempt in range(1, retries_per_url + 1):
            try:
                return await client.request(method=method, url=path, **kwargs)
            except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError, httpx.RequestError) as exc:
                last_error = exc
                logger.warning(
                    "FastAPI request failed base=%s attempt=%s/%s path=%s error=%s",
                    base,
                    attempt,
                    retries_per_url,
                    path,
                    exc,
                )
                if attempt < retries_per_url:
                    await asyncio.sleep(retry_delay_seconds * attempt)

    raise httpx.RequestError(
        f"All FastAPI connection attempts failed for path {path}. urls={urls}. last_error={last_error}"
    )

