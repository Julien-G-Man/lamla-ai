from fastapi import APIRouter
from core.ai_client import ai_service, APIIntegrationError
from core.http import get_async_client
from .schemas import FlashcardRequest, FlashcardExplainRequest
import json
import re
import os
import asyncio
import logging

flashcards_router = APIRouter()
logger = logging.getLogger(__name__)

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


AI_MAX_CONCURRENT = max(20, _env_int("FLASHCARDS_AI_MAX_CONCURRENT", 250))
AI_SEMAPHORE_WAIT_SECONDS = _env_float("FLASHCARDS_AI_SEMAPHORE_WAIT_SECONDS", 0.35)
_ai_semaphore = asyncio.Semaphore(AI_MAX_CONCURRENT)

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
                    out.append({"question": q[:2000], "answer": a[:4000]})
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


async def _try_acquire_ai_slot() -> bool:
    try:
        await asyncio.wait_for(_ai_semaphore.acquire(), timeout=AI_SEMAPHORE_WAIT_SECONDS)
        return True
    except TimeoutError:
        return False


def _build_fallback_cards(text: str, subject: str, num_cards: int):
    """Deterministic fallback cards when no LLM provider is available."""
    safe_subject = (subject or "the topic").strip() or "the topic"
    normalized = re.sub(r"\s+", " ", (text or "").strip())
    if not normalized:
        normalized = "No source text was provided."

    # Split into sentence-like chunks and use as answer material.
    chunks = [c.strip(" -\t") for c in re.split(r"(?<=[.!?])\s+", normalized) if c.strip()]
    if not chunks:
        chunks = [normalized]

    def to_card(source: str):
        sentence = source.strip().strip(".")
        if not sentence:
            sentence = "No source text provided"

        # Pattern: "X is Y" -> "What is X?"
        match_is = re.match(r"^([A-Za-z0-9][A-Za-z0-9 ()/\-]{1,80})\s+is\s+(.+)$", sentence, flags=re.IGNORECASE)
        if match_is:
            term = match_is.group(1).strip()
            meaning = match_is.group(2).strip()
            return {
                "question": f"What is {term}?",
                "answer": meaning[:320],
            }

        # Pattern: "Term: definition"
        if ":" in sentence:
            left, right = sentence.split(":", 1)
            left = left.strip()
            right = right.strip()
            if left and right and len(left) <= 90:
                return {
                    "question": f"Explain {left} in {safe_subject}.",
                    "answer": right[:320],
                }

        snippet = sentence[:140]
        return {
            "question": f"In {safe_subject}, explain this idea: \"{snippet}\"",
            "answer": sentence[:320],
        }

    cards = []
    for i in range(max(1, min(num_cards, 25))):
        source = chunks[i % len(chunks)]
        cards.append(to_card(source))
    return cards


@flashcards_router.post("/generate")
async def generate_flashcards(data: FlashcardRequest):
    client = await get_async_client()

    subject = data.subject
    text = data.text
    num_cards = data.num_cards
    difficulty = data.difficulty
    user_prompt = data.prompt or ""

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

    if not await _try_acquire_ai_slot():
        logger.warning("Flashcards generation overload: fallback served without LLM")
        return {
            "cards": fallback_cards,
            "fallback_used": True,
            "warning": "Service is under high load. Showing fallback flashcards.",
            "overloaded": True,
        }

    try:
        result = await ai_service.generate_content(client=client, prompt=prompt, max_tokens=1200)

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
    finally:
        _ai_semaphore.release()


@flashcards_router.post("/explain")
async def explain_flashcard(data: FlashcardExplainRequest):
    client = await get_async_client()

    question = data.question
    answer = data.answer

    prompt = f"""
A student failed a flashcard.

Question:
{question}

Correct Answer:
{answer}

Explain this concept clearly in 3 short sentences
like a tutor helping a beginner.
"""

    if not await _try_acquire_ai_slot():
        logger.warning("Flashcards explanation overload: fallback served without LLM")
        return {
            "explanation": f"Focus on this key idea: {answer}",
            "fallback_used": True,
            "warning": "Service is under high load. Showing fallback guidance.",
            "overloaded": True,
        }

    try:
        result = await ai_service.generate_content(client=client, prompt=prompt, max_tokens=200)

        if isinstance(result, str) and result.strip():
            return {
                "explanation": result.strip(),
                "fallback_used": False,
            }

        return {
            "explanation": f"Review this carefully: {answer}",
            "fallback_used": True,
            "warning": "AI explanation unavailable. Showing fallback guidance.",
        }

    except Exception:
        return {
            "explanation": f"Focus on this key idea: {answer}",
            "fallback_used": True,
            "warning": "AI explanation unavailable. Showing fallback guidance.",
        }
    finally:
        _ai_semaphore.release()
