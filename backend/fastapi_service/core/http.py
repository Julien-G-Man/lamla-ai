import httpx

async_client: httpx.AsyncClient | None = None

async def get_async_client():
    global async_client
    if async_client is None:
        async_client = httpx.AsyncClient(timeout=30)
    return async_client
