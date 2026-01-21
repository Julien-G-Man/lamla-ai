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
        f"You are Lamla AI Tutor. Generate a quiz based on this study material:\n\n"
        f"{payload.study_text}\n\n"
        f"Subject: {payload.subject}\n"
        f"Difficulty Level: {payload.difficulty}\n"
        f"Requirements:\n"
        f"- Generate exactly {payload.num_mcq} multiple-choice questions (MCQs)\n"
        f"- Generate exactly {payload.num_short} short-answer questions\n"
        f"- Each MCQ must have 4 options (A, B, C, D)\n"
        f"- Provide clear, concise explanations for each answer\n\n"
        f"Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):\n"
        "{\n"
        '  "mcq_questions": [\n'
        '    {"question": "Question text here?", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "A", "explanation": "Explanation here"},\n'
        '    ...\n'
        '  ],\n'
        '  "short_questions": [\n'
        '    {"question": "Question text here?", "answer": "Correct answer", "explanation": "Explanation here"},\n'
        '    ...\n'
        '  ]\n'
        "}\n\n"
        "IMPORTANT: Return ONLY the JSON object, nothing else. No markdown formatting, no code blocks."
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
            # Increase max_tokens for quiz generation (need more tokens for multiple questions)
            raw = await ai_service.generate_content(client, prompt, max_tokens=2048)

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

        # Validate response structure - check for mcq_questions and short_questions
        mcq_questions = data.get("mcq_questions", [])
        short_questions = data.get("short_questions", [])
        
        if not isinstance(mcq_questions, list):
            mcq_questions = []
        if not isinstance(short_questions, list):
            short_questions = []
        
        # Ensure we have at least some questions
        if len(mcq_questions) == 0 and len(short_questions) == 0:
            logger.warning("Quiz response has no questions. Data: %s", data)
            raise HTTPException(
                status_code=502, 
                detail="Quiz response missing both mcq_questions and short_questions"
            )
        
        # Normalize question format - ensure each has required fields
        def normalize_question(q, q_type):
            if not isinstance(q, dict):
                return None
            return {
                "question": q.get("question", ""),
                "type": q_type,
                "options": q.get("options", []) if q_type == "mcq" else [],
                "answer": q.get("answer", ""),
                "explanation": q.get("explanation", "")
            }
        
        normalized_mcq = [normalize_question(q, "mcq") for q in mcq_questions if normalize_question(q, "mcq")]
        normalized_short = [normalize_question(q, "short") for q in short_questions if normalize_question(q, "short")]

        return {
            "subject": payload.subject,
            "study_text": payload.study_text,
            "difficulty": payload.difficulty,
            "mcq_questions": normalized_mcq,
            "short_questions": normalized_short,
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error in FastAPI quiz endpoint: %s", exc)
        raise HTTPException(status_code=500, detail="Quiz generation error")
