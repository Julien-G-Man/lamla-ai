import json
import logging
import httpx
from fastapi import APIRouter, HTTPException
from .schemas import QuizQuestion, QuizRequest, QuizResponse
from .prompts import _build_quiz_prompt

logger = logging.getLogger(__name__)
quiz_router = APIRouter()

try:
    # Prefer relative import when running as a package
    from ...core.ai_client import ai_service
except Exception:  # pragma: no cover - fallback paths
    try:
        from core.ai_client import ai_service
    except Exception as e:
        logger.exception("Could not import FastAPI ai_service for quiz: %s", e)
        ai_service = None


@quiz_router.post("/", response_model=QuizResponse)
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

        logger.debug(f"Quiz provider returned type: {type(raw).__name__}")
        
        # Handle different response types
        data = None
        
        # If raw is a dict, check if it's an Azure response with choices array
        if isinstance(raw, dict):
            if "choices" in raw and isinstance(raw.get("choices"), list):
                # Azure response format - extract content from choices
                try:
                    choice = raw["choices"][0]
                    if "message" in choice and "content" in choice["message"]:
                        content_str = choice["message"]["content"]
                        logger.debug(f"Extracted Azure content: {content_str[:100]}...")
                        data = json.loads(content_str)
                except (KeyError, IndexError, json.JSONDecodeError) as e:
                    logger.error(f"Failed to extract Azure quiz content: {e}")
                    raise HTTPException(status_code=502, detail="Failed to parse Azure response")
            else:
                # Regular dict response (already parsed JSON)
                data = raw
        else:
            # String response - parse as JSON
            text = str(raw)
            try:
                data = json.loads(text)
            except Exception:
                logger.warning("Quiz provider did not return valid JSON. Raw: %s", text[:300])
                raise HTTPException(status_code=502, detail="Invalid quiz format from AI provider")

        # Validate response structure - check for mcq_questions and short_questions
        mcq_questions = data.get("mcq_questions", []) if data else []
        short_questions = data.get("short_questions", []) if data else []
        
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
