from fastapi import APIRouter
from core.ai_client import ai_service, APIIntegrationError
from core.http import get_async_client
import json
import re

flashcards_router = APIRouter()

DIFFICULTY_PROMPTS = {

    "beginner": """
Create simple flashcards for beginners.

Rules:
- Use simple language
- Short answers
- Focus on definitions and basic understanding
""",

    "intermediate": """
Create moderate difficulty flashcards.

Rules:
- Include conceptual understanding
- Test relationships between ideas
- Medium complexity
""",

    "exam": """
Create exam-level flashcards.

Rules:
- Challenging conceptual questions
- Focus on problem solving and application
- Similar to university exam questions
"""
}


def _normalize_cards(raw):
    """Normalize raw AI output into [{question, answer}] list."""
    if isinstance(raw, list):
        out = []
        for item in raw:
            if isinstance(item, dict):
                q = (item.get("question") or item.get("front") or "").strip()
                a = (item.get("answer") or item.get("back") or "").strip()
                if q and a:
                    out.append({"question": q, "answer": a})
        return out

    if isinstance(raw, dict):
        if "cards" in raw:
            return _normalize_cards(raw.get("cards"))
        return []

    if isinstance(raw, str):
        # Try full JSON parse first.
        try:
            parsed = json.loads(raw)
            return _normalize_cards(parsed)
        except Exception:
            pass

        # Try extracting JSON array from mixed text.
        match = re.search(r"\[[\s\S]*\]", raw)
        if match:
            try:
                parsed = json.loads(match.group(0))
                return _normalize_cards(parsed)
            except Exception:
                pass

    return []


def _build_fallback_cards(text: str, subject: str, num_cards: int):
    """Deterministic fallback cards when no LLM provider is available."""
    safe_subject = (subject or "the topic").strip() or "the topic"
    normalized = re.sub(r"\s+", " ", (text or "").strip())
    if not normalized:
        normalized = "No source text was provided."

    # Split into sentence-like chunks and use as answer material.
    chunks = [c.strip() for c in re.split(r"(?<=[.!?])\s+", normalized) if c.strip()]
    if not chunks:
        chunks = [normalized]

    cards = []
    for i in range(max(1, min(num_cards, 25))):
        source = chunks[i % len(chunks)]
        cards.append(
            {
                "question": f"Key point {i + 1} in {safe_subject}?",
                "answer": source[:320],
            }
        )
    return cards


@flashcards_router.post("/generate")
async def generate_flashcards(data: dict):
    client = await get_async_client()

    subject = data.get("subject")
    text = data.get("text")
    num_cards = int(data.get("num_cards", 10))
    difficulty = data.get("difficulty", "intermediate")
    user_prompt = data.get("prompt", "")

    difficulty_prompt = DIFFICULTY_PROMPTS.get(
        difficulty,
        DIFFICULTY_PROMPTS["intermediate"]
    )

    prompt = f"""
You are an expert study assistant.

Subject: {subject}

Content:
{text}

Additional instructions:
{user_prompt}

Difficulty level:
{difficulty_prompt}

Create {num_cards} flashcards.

Return ONLY valid JSON in this format:

[
  {{
    "question": "...",
    "answer": "..."
  }}
]
"""

    fallback_cards = _build_fallback_cards(text, subject, num_cards)

    try:
        result = await ai_service.generate_content(
            client=client,
            prompt=prompt,
            max_tokens=1200
        )

        cards = _normalize_cards(result)
        if cards:
            return {
                "cards": cards,
                "fallback_used": False,
            }

        return {
            "cards": fallback_cards,
            "fallback_used": True,
            "warning": "AI response format was invalid. Showing fallback flashcards.",
        }

    except APIIntegrationError as exc:
        return {
            "cards": fallback_cards,
            "fallback_used": True,
            "warning": f"AI provider unavailable ({str(exc)}). Showing fallback flashcards.",
        }
    except Exception:
        return {
            "cards": fallback_cards,
            "fallback_used": True,
            "warning": "Unexpected AI error. Showing fallback flashcards.",
        }


@flashcards_router.post("/explain")
async def explain_flashcard(data: dict):
    client = await get_async_client()

    prompt = f"""
A student failed a flashcard.

Question:
{data["question"]}

Correct Answer:
{data["answer"]}

Explain this concept clearly in 3 short sentences
like a tutor helping a beginner.
"""

    try:
        result = await ai_service.generate_content(
            client=client,
            prompt=prompt,
            max_tokens=200
        )

        if isinstance(result, str) and result.strip():
            return {
                "explanation": result.strip(),
                "fallback_used": False,
            }

        return {
            "explanation": f"Review this carefully: {data.get('answer', '')}",
            "fallback_used": True,
            "warning": "AI explanation unavailable. Showing fallback guidance.",
        }

    except Exception:
        return {
            "explanation": f"Focus on this key idea: {data.get('answer', '')}",
            "fallback_used": True,
            "warning": "AI explanation unavailable. Showing fallback guidance.",
        }
