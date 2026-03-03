import os
import httpx
from django.conf import settings


FASTAPI_URL = os.getenv("FASTAPI_URL")
FASTAPI_SECRET = os.getenv("FASTAPI_SECRET")


async def generate_flashcards(text, subject, prompt, num_cards):

    async with httpx.AsyncClient(timeout=60) as client:

        response = await client.post(
            f"{FASTAPI_URL}/flashcards/generate",
            headers={
                "X-Internal-Secret": FASTAPI_SECRET
            },
            json={
                "text": text,
                "subject": subject,
                "prompt": prompt,
                "num_cards": num_cards
            }
        )

        response.raise_for_status()

        return response.json()