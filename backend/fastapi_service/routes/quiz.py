import json
import logging
import httpx
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter()

try:
    # Prefer relative import when running as a package
    from ..core.ai_client import ai_service
except Exception:  # pragma: no cover - fallback paths
    try:
        from core.ai_client import ai_service
    except Exception as e:
        logger.exception("Could not import FastAPI ai_service for quiz: %s", e)
        ai_service = None


class QuizQuestion(BaseModel):
    question: str
    type: str = Field(..., description="mcq | short")
    options: List[str] = Field(default_factory=list)
    answer: str
    explanation: Optional[str] = None


class QuizRequest(BaseModel):
    subject: str
    study_text: str
    num_mcq: int = Field(7, ge=0, le=20)
    num_short: int = Field(3, ge=0, le=10)
    difficulty: str = Field("medium", description="easy | medium | hard")


class QuizResponse(BaseModel):
    subject: str
    study_text: str
    difficulty: str
    mcq_questions: List[QuizQuestion]
    short_questions: List[QuizQuestion]


def _build_quiz_prompt(payload: QuizRequest) -> str:
    return (
        f"You are Lamla AI Tutor. Generate a quiz based on this text: {payload.study_text}\n"
        f"subject: {payload.subject}\n"
        f"Difficulty: {payload.difficulty}\n"
        f"Task: Generate {payload.num_mcq} MCQs and {payload.num_short} short answers.\n"
        "Return ONLY JSON in this EXACT format:\n"
        "{\n"
        '  "mcq_questions": [{"question": "...", "options": ["A","B","C","D"], "answer": "...", "explanation": "..."}],\n'
        '  "short_questions": [{"question": "...", "answer": "...", "explanation": "..."}]\n'
        "}"
    )

@router.post("/", response_model=QuizResponse)
async def quiz_endpoint(payload: QuizRequest):
    """
    Internal FastAPI endpoint used by Django to generate quizzes via LLM.
    """
    if ai_service is None:
        raise HTTPException(status_code=503, detail="AI service not available")

    prompt = _build_quiz_prompt(payload)

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            raw = await ai_service.generate_content(client, prompt, max_tokens=1024)

        # If the provider already returned a dict, try to normalize it
        if isinstance(raw, dict):
            data = raw
        else:
            text = str(raw)
            try:
                data = json.loads(text)
            except Exception:
                logger.warning("Quiz provider did not return pure JSON. Raw: %s", text[:300])
                raise HTTPException(status_code=502, detail="Invalid quiz format from AI provider")

        # Basic validation; Pydantic will do deeper validation via response_model
        if "questions" not in data or not isinstance(data.get("questions"), list):
            raise HTTPException(status_code=502, detail="Quiz response missing 'questions'")

        # Fill in topic/difficulty if the model omitted or changed them
        data.setdefault("subject", payload.subject)
        data.setdefault("difficulty", payload.difficulty)

        return {
            "subject": payload.subject,
            "study_text": payload.study_text,
            "difficulty": payload.difficulty,
            "mcq_questions": data.get("mcq_questions", []),
            "short_questions": data.get("short_questions", []),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error in FastAPI quiz endpoint: %s", exc)
        raise HTTPException(status_code=500, detail="Quiz generation error")
