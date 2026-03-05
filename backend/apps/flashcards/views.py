import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
from asgiref.sync import sync_to_async
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from django.db.models import Count, Q
from .models import Deck, Flashcard
from .scheduling import update_sm2
from apps.core.async_client import call_fastapi, build_fastapi_headers

logger = logging.getLogger(__name__)

def _get_authenticated_user(request):
    """
    Authenticate API requests using DRF token auth.
    Returns (user, error_response). error_response is None on success.
    """
    try:
        auth_result = TokenAuthentication().authenticate(request)
    except AuthenticationFailed as exc:
        return None, JsonResponse({"detail": str(exc)}, status=401)

    if auth_result is None:
        return None, JsonResponse(
            {"detail": "Authentication credentials were not provided."},
            status=401
        )

    user, _token = auth_result
    if not user or not user.is_active:
        return None, JsonResponse({"detail": "Invalid user."}, status=401)

    return user, None


async def _get_authenticated_user_async(request):
    """
    Async-safe token authentication for async views.
    TokenAuthentication touches DB, so run in a thread.
    """
    try:
        auth_result = await sync_to_async(
            TokenAuthentication().authenticate,
            thread_sensitive=True
        )(request)
    except AuthenticationFailed as exc:
        return None, JsonResponse({"detail": str(exc)}, status=401)

    if auth_result is None:
        return None, JsonResponse(
            {"detail": "Authentication credentials were not provided."},
            status=401
        )

    user, _token = auth_result
    if not user or not user.is_active:
        return None, JsonResponse({"detail": "Invalid user."}, status=401)

    return user, None


@csrf_exempt
@require_POST
async def generate_flashcards(request):

    import json

    try:
        user, auth_error = await _get_authenticated_user_async(request)
        if auth_error:
            return auth_error

        data = json.loads(request.body)

        subject = data.get("subject")
        text = data.get("text")
        prompt = data.get("prompt", "")
        num_cards = int(data.get("num_cards", 10))
        difficulty = data.get("difficulty", "intermediate")

        resp = await call_fastapi(
            "POST",
            "/flashcards/generate",
            timeout=90,
            headers=build_fastapi_headers(),
            json={
                "subject": subject,
                "text": text,
                "prompt": prompt,
                "num_cards": num_cards,
                "difficulty": difficulty,
            },
        )
        resp.raise_for_status()
        result = resp.json()

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
          
        
@csrf_exempt
@require_POST
def save_flashcard_deck(request):
    user, auth_error = _get_authenticated_user(request)
    if auth_error:
        return auth_error

    data = json.loads(request.body)

    subject = data.get("subject")
    cards = data.get("cards")

    deck = Deck.objects.create(
        user=user,
        title=subject,
        subject=subject
    )

    objs = []

    for c in cards:
        objs.append(
            Flashcard(
                deck=deck,
                question=c["question"],
                answer=c["answer"]
            )
        )

    Flashcard.objects.bulk_create(objs)

    return JsonResponse({
        "deck_id": deck.id
    })
    

def get_decks(request):
    user, auth_error = _get_authenticated_user(request)
    if auth_error:
        return auth_error

    decks = Deck.objects.filter(
        user=user
    ).annotate(
        card_count=Count("cards"),
        due_today=Count("cards", filter=Q(cards__next_review__lte=timezone.now()))
    )

    return JsonResponse(
        {
            "decks": [
                {
                    "id": d.id,
                    "title": d.title,
                    "created_at": d.created_at,
                    "card_count": d.card_count,
                    "due_today": d.due_today,
                }
                for d in decks
            ]
        }
    )
    
@require_http_methods(["GET", "DELETE"])
def get_deck_cards(request, deck_id):
    user, auth_error = _get_authenticated_user(request)
    if auth_error:
        return auth_error

    if request.method == "DELETE":
        deleted, _ = Deck.objects.filter(id=deck_id, user=user).delete()
        if deleted == 0:
            return JsonResponse({"error": "Deck not found"}, status=404)
        return JsonResponse({"status": "deleted"})

    cards = Flashcard.objects.filter(
        deck_id=deck_id,
        deck__user=user
    ).values(
        "id",
        "question",
        "answer"
    )

    return JsonResponse({
        "cards": list(cards)
    })
    
@csrf_exempt
@require_POST
def review_flashcard(request):
    user, auth_error = _get_authenticated_user(request)
    if auth_error:
        return auth_error

    try:
        data = json.loads(request.body)
        card_id = data.get("card_id")
        quality = data.get("quality")

        if not card_id:
            return JsonResponse({"error": "card_id is required"}, status=400)
        if quality is None:
            return JsonResponse({"error": "quality is required"}, status=400)

        card = Flashcard.objects.get(
            id=card_id,
            deck__user=user
        )

        update_sm2(card, int(quality))
        return JsonResponse({"status": "updated"})
    except Flashcard.DoesNotExist:
        return JsonResponse({"error": "Flashcard not found"}, status=404)
    except (TypeError, ValueError):
        return JsonResponse({"error": "quality must be an integer between 0 and 5"}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)


@csrf_exempt
@require_POST
async def explain_flashcard(request):
    user, auth_error = await _get_authenticated_user_async(request)
    if auth_error:
        return auth_error

    import json

    data = json.loads(request.body)

    question = data.get("question")
    answer = data.get("answer")

    resp = await call_fastapi(
        "POST",
        "/flashcards/explain",
        timeout=60,
        headers=build_fastapi_headers(),
        json={
            "question": question,
            "answer": answer
        },
    )
    resp.raise_for_status()
    result = resp.json()

    return JsonResponse(result)
