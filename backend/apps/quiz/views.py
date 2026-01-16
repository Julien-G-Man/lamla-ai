import json
import logging
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def generate_quiz_api(request):
    """
    React-facing endpoint to generate a quiz via FastAPI.

    Expected JSON body:
    {
      "topic": "photosynthesis",
      "num_questions": 5,
      "difficulty": "medium"
    }
    """
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    topic = (data.get("topic") or "").strip()
    num_questions = data.get("num_questions") or 5
    difficulty = (data.get("difficulty") or "medium").strip().lower()

    if not topic:
        return JsonResponse({"error": "Topic is required"}, status=400)

    try:
        num_questions = int(num_questions)
    except (TypeError, ValueError):
        num_questions = 5

    num_questions = max(1, min(num_questions, 20))

    payload = {
        "topic": topic,
        "num_questions": num_questions,
        "difficulty": difficulty,
    }

    fastapi_base = getattr(settings, "FASTAPI_BASE_URL", "http://localhost:8001").rstrip("/")
    fastapi_url = f"{fastapi_base}/quiz"

    try:
        resp = requests.post(fastapi_url, json=payload, timeout=40)
        if resp.status_code != 200:
            logger.warning("FastAPI quiz call failed: %s %s", resp.status_code, resp.text)
            return JsonResponse(
                {"error": "Quiz service temporarily unavailable"}, status=503
            )

        quiz_data = resp.json()
        return JsonResponse(quiz_data)

    except Exception as exc:
        logger.error("Error calling FastAPI quiz endpoint: %s", exc, exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)
