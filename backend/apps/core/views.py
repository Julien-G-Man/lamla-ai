from django.http import JsonResponse
from django.views import View
import httpx


class HealthCheckView(View):
    async def get(self, request):
        return JsonResponse(
            {
                "status": "ok",
                "service": "lamla-django",
            },
            status=200,
        )


async def warmup(request):
    """
    Warm Django and FastAPI from the server side.
    Avoids browser->FastAPI CORS dependency.
    """
    from apps.core.async_client import get_async_client

    client = get_async_client()
    fastapi_ok = False

    try:
        resp = await client.get("/health", timeout=10.0)
        fastapi_ok = resp.status_code == 200
    except (httpx.RequestError, httpx.TimeoutException):
        fastapi_ok = False

    return JsonResponse(
        {
            "status": "warm",
            "fastapi": "ok" if fastapi_ok else "unreachable",
        },
        status=200,
    )
