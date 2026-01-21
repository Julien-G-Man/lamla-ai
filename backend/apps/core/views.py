from django.http import JsonResponse
from django.views import View

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
    # Touch async client to initialize connection pool
    from apps.core.async_client import get_async_client

    client = get_async_client()
    _ = client  # force init

    return JsonResponse(
        {
            "status": "warm",
        },
        status=200,
    )
