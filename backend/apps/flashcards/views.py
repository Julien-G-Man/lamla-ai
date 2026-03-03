import os
import httpx
import json
import logging
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.conf import settings
from .models import Deck, Flashcard
from .scheduling import update_sm2

logger = logging.getLogger(__name__)

FASTAPI_URL = os.getenv("FASTAPI_URL")
FASTAPI_SECRET = os.getenv("FASTAPI_SECRET")

@require_POST
@login_required
async def generate_flashcards(request):

    import json
    import httpx

    try:
        data = json.loads(request.body)

        subject = data.get("subject")
        text = data.get("text")
        prompt = data.get("prompt", "")
        num_cards = int(data.get("num_cards", 10))
        difficulty = data.get("difficulty", "intermediate")

        async with httpx.AsyncClient(timeout=90) as client:

            resp = await client.post(
                f"{FASTAPI_URL}/flashcards/generate",
                headers={
                    "X-Internal-Secret": FASTAPI_SECRET
                },
                json={
                    "subject": subject,
                    "text": text,
                    "prompt": prompt,
                    "num_cards": num_cards,
                    "difficulty": difficulty
                }
            )

            resp.raise_for_status()

            result = resp.json()

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
          
        
@require_POST
@login_required
def save_flashcard_deck(request):

    data = json.loads(request.body)

    subject = data.get("subject")
    cards = data.get("cards")

    deck = Deck.objects.create(
        user=request.user,
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
    

@login_required
def get_decks(request):

    decks = Deck.objects.filter(
        user=request.user
    ).values(
        "id",
        "title",
        "created_at"
    )

    return JsonResponse(
        {"decks": list(decks)}
    )
    
@login_required
def get_deck_cards(request, deck_id):

    cards = Flashcard.objects.filter(
        deck_id=deck_id,
        deck__user=request.user
    ).values(
        "id",
        "question",
        "answer"
    )

    return JsonResponse({
        "cards": list(cards)
    })
    
@require_POST
@login_required
def review_flashcard(request):
    data = json.loads(request.body)

    card_id = data.get("card_id")
    quality = int(data.get("quality"))

    card = Flashcard.objects.get(
        id=card_id,
        deck__user=request.user
    )

    update_sm2(card, quality)

    return JsonResponse({"status": "updated"})


@require_POST
@login_required
async def explain_flashcard(request):

    import json

    data = json.loads(request.body)

    question = data.get("question")
    answer = data.get("answer")

    async with httpx.AsyncClient(timeout=60) as client:

        resp = await client.post(
            f"{FASTAPI_URL}/flashcards/explain",
            headers={
                "X-Internal-Secret": FASTAPI_SECRET
            },
            json={
                "question": question,
                "answer": answer
            }
        )

        resp.raise_for_status()

        result = resp.json()

    return JsonResponse(result)