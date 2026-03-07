import httpx
import os

async_client: httpx.AsyncClient | None = None


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

async def get_async_client():
    global async_client
    if async_client is None:
        max_connections = _env_int("FASTAPI_OUTBOUND_MAX_CONNECTIONS", 1000)
        max_keepalive_connections = _env_int("FASTAPI_OUTBOUND_MAX_KEEPALIVE", 250)
        connect_timeout = _env_float("FASTAPI_OUTBOUND_CONNECT_TIMEOUT", 4.0)
        read_timeout = _env_float("FASTAPI_OUTBOUND_READ_TIMEOUT", 45.0)
        write_timeout = _env_float("FASTAPI_OUTBOUND_WRITE_TIMEOUT", 10.0)
        pool_timeout = _env_float("FASTAPI_OUTBOUND_POOL_TIMEOUT", 6.0)

        async_client = httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=connect_timeout,
                read=read_timeout,
                write=write_timeout,
                pool=pool_timeout,
            ),
            limits=httpx.Limits(
                max_connections=max_connections,
                max_keepalive_connections=max_keepalive_connections,
                keepalive_expiry=30,
            ),
            http2=True,
        )
    return async_client
