"""
Async HTTP Client for FastAPI Proxy Pattern

This module provides a persistent httpx.AsyncClient with connection pooling
for high-performance async proxying from Django to FastAPI.
"""
import httpx
import logging
from django.conf import settings
from typing import Optional

logger = logging.getLogger(__name__)

# Global persistent client instance
_async_client: Optional[httpx.AsyncClient] = None


def get_async_client() -> httpx.AsyncClient:
    """
    Get or create the persistent async HTTP client.
    
    This client uses connection pooling to reuse TCP connections,
    significantly improving performance at high concurrency.
    """
    global _async_client
    
    if _async_client is None:
        fastapi_base = getattr(settings, "FASTAPI_BASE_URL", "http://localhost:8001").rstrip("/")
        timeout = httpx.Timeout(
            connect=5.0,      # Connection timeout
            read=60.0,       # Read timeout (for LLM responses)
            write=5.0,       # Write timeout
            pool=5.0         # Pool timeout
        )
        
        _async_client = httpx.AsyncClient(
            base_url=fastapi_base,
            timeout=timeout,
            limits=httpx.Limits(
                max_keepalive_connections=20,  # Keep connections alive
                max_connections=100,            # Max concurrent connections
                keepalive_expiry=30.0           # Keep connections for 30s
            ),
            http2=True,  # Enable HTTP/2 for better performance
        )
        logger.info(f"Initialized persistent AsyncClient for FastAPI at {fastapi_base}")
    
    return _async_client


async def close_async_client():
    """Close the async client (call during Django shutdown)"""
    global _async_client
    if _async_client is not None:
        await _async_client.aclose()
        _async_client = None
        logger.info("Closed persistent AsyncClient")


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

