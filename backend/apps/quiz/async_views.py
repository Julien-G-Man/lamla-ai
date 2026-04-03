"""
High-Performance Async Proxy View for Quiz Generation

Implements the Asynchronous Proxy Pattern for quiz endpoints.
"""

import json
import logging
import httpx
from datetime import datetime
from asgiref.sync import sync_to_async
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from apps.core.async_client import call_fastapi, build_fastapi_headers
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import QuizSession

logger = logging.getLogger(__name__)


async def _get_authenticated_user_async(request):
    """
    Async-safe token authentication for async views.
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
@require_http_methods(["POST"])
async def generate_quiz_api_async(request):
    """
    High-performance async proxy for quiz generation endpoint.
    
    React-facing endpoint to generate a quiz via FastAPI.
    """
    try:
        # Parse request
        data = json.loads(request.body) if request.body else {}
        
        subject = (data.get("subject") or "General").strip()
        study_text = data.get('extractedText', '').strip()
        num_mcq = data.get("num_mcq") or 7
        num_short = data.get("num_short") or 0
        difficulty = (data.get("difficulty") or "medium").strip().lower()
        
        if not subject:
            return JsonResponse({"error": "Subject is required"}, status=400)
        
        try:
            num_mcq = int(num_mcq)
        except (TypeError, ValueError):
            num_mcq = 7
        
        num_mcq = max(1, min(num_mcq, 30))
        num_short = max(0, min(int(num_short or 0), 10))
        
        # Validate study text
        if not study_text or len(study_text.strip()) < 30:
            return JsonResponse({"error": "Study text must be at least 30 characters"}, status=400)
        
        if len(study_text) > 50000:
            study_text = study_text[:50000]
            logger.warning("Study text truncated to 50,000 characters")
        
        payload = {
            "subject": subject,
            "study_text": study_text.strip(),
            "num_mcq": int(num_mcq),
            "num_short": int(num_short),
            "difficulty": difficulty,
        }
        
        # Forward to FastAPI using async client
        headers = build_fastapi_headers()
        
        fastapi_resp = await call_fastapi(
            "POST",
            "/quiz/",
            json=payload,
            headers=headers,
            timeout=60.0,
        )
        
        if fastapi_resp.status_code != 200:
            logger.warning(f"FastAPI quiz call failed: {fastapi_resp.status_code} {fastapi_resp.text}")
            return JsonResponse(
                {"error": "Quiz service temporarily unavailable"}, 
                status=503
            )
        
        quiz_data = fastapi_resp.json()
        
        # Add metadata for frontend compatibility
        import uuid
        quiz_data['id'] = str(uuid.uuid4())
        # Convert time_limit to integer (minutes) to prevent NaN in frontend timer
        quiz_data['time_limit'] = int(data.get('quiz_time', 10))
        quiz_data['created_at'] = None  # Can be set if storing in DB
        quiz_data['source_filename'] = data.get('source_filename', '')
        
        return JsonResponse(quiz_data)
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except httpx.TimeoutException:
        logger.error("FastAPI quiz request timed out")
        return JsonResponse({"error": "Request timeout"}, status=504)
    except httpx.RequestError as e:
        logger.error(f"FastAPI quiz request error: {e}")
        return JsonResponse({"error": "Service unavailable"}, status=503)
    except Exception as e:
        logger.error(f"Error calling FastAPI quiz endpoint: {e}", exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
async def submit_quiz_api_async(request):
    """
    High-performance async endpoint to submit quiz answers and calculate scores.
    
    For MCQ: Compares answer letters directly
    For Short Answer: Uses LLM to evaluate if answer is correct
    
    Receives user answers and quiz data, calculates score, and returns results.
    """
    try:
        user, auth_error = await _get_authenticated_user_async(request)
        if auth_error:
            return auth_error

        # Parse request
        data = json.loads(request.body) if request.body else {}
        
        quiz_data = data.get("quiz_data")  # Full quiz data with questions
        user_answers = data.get("user_answers", {})  # {question_index: answer}
        quiz_id = data.get("quiz_id")
        
        if not quiz_data:
            return JsonResponse({"error": "Quiz data is required"}, status=400)
        
        # Extract questions from quiz data
        mcq_questions = quiz_data.get("mcq_questions", [])
        short_questions = quiz_data.get("short_questions", [])
        all_questions = mcq_questions + short_questions
        
        if not all_questions:
            return JsonResponse({"error": "No questions found in quiz data"}, status=400)
        
        # Calculate scores
        total_questions = len(all_questions)
        correct_count = 0
        details = []
        
        for idx, question in enumerate(all_questions):
            user_answer = user_answers.get(str(idx), "").strip()
            correct_answer = question.get("answer", "").strip()
            options = question.get("options", []) or []
            is_correct = False
            reasoning = ""

            def _format_mcq_answer(answer_value: str) -> str:
                if not answer_value:
                    return ""

                normalized = answer_value.strip()
                if not options:
                    return normalized

                letter = normalized.upper()[0]
                option_index = ord(letter) - ord("A")
                if 0 <= option_index < len(options):
                    option_text = str(options[option_index]).strip()
                    return f"{letter}. {option_text}"

                for option_index, option_text in enumerate(options):
                    option_text = str(option_text).strip()
                    if normalized.lower() == option_text.lower():
                        return f"{chr(ord('A') + option_index)}. {option_text}"

                return normalized

            user_answer_display = _format_mcq_answer(user_answer) if (question.get("type") == "mcq" or options) else user_answer
            correct_answer_display = _format_mcq_answer(correct_answer) if (question.get("type") == "mcq" or options) else correct_answer
            
            # For MCQ, compare answer letter (A, B, C, D)
            if question.get("type") == "mcq" or question.get("options"):
                # Normalize answers - handle both "A" and "Option A" formats
                user_letter = user_answer.upper()[0] if user_answer else ""
                correct_letter = correct_answer.upper()[0] if correct_answer else ""
                is_correct = user_letter == correct_letter
                reasoning = "MCQ evaluation: Answer letter matched" if is_correct else "MCQ evaluation: Answer letter did not match"
            else:
                # For short answer, use LLM to evaluate
                question_text = question.get("question", "")
                evaluation = await _evaluate_short_answer(question_text, correct_answer, user_answer)
                is_correct = evaluation.get("is_correct", False)
                reasoning = evaluation.get("reasoning", "Evaluation complete")
            
            if is_correct:
                correct_count += 1
            
            details.append({
                "question_index": idx,
                "question": question.get("question", ""),
                "options": options,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "user_answer_display": user_answer_display,
                "correct_answer_display": correct_answer_display,
                "is_correct": is_correct,
                "explanation": question.get("explanation", ""),
                "reasoning": reasoning
            })
        
        score_percent = round((correct_count / total_questions) * 100, 1) if total_questions > 0 else 0
        
        results = {
            "quiz_id": quiz_id,
            "subject": quiz_data.get("subject", "Unknown"),
            "difficulty": quiz_data.get("difficulty", "medium"),
            "source_filename": quiz_data.get("source_filename", ""),  # Include source filename
            "score": correct_count,
            "total": total_questions,
            "score_percent": score_percent,
            "details": details,
            "submitted_at": datetime.now()
        }

        # Persist to quiz history for this authenticated user (including admins).
        await sync_to_async(QuizSession.objects.create, thread_sensitive=True)(
            user=user,
            subject=(quiz_data.get("subject", "General") or "General")[:100],
            total_questions=total_questions,
            correct_answers=correct_count,
            score_percentage=score_percent,
            duration_minutes=int(data.get("duration_minutes") or 0),
            questions_data=quiz_data,
            user_answers=user_answers,
        )
        
        logger.info(f"Quiz submitted: {correct_count}/{total_questions} correct ({score_percent}%)")
        
        return JsonResponse(results)
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Error processing quiz submission: {e}", exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)


async def _evaluate_short_answer(question_text: str, correct_answer: str, user_answer: str) -> dict:
    """
    Use LLM to evaluate if a short answer is correct.
    
    Returns:
        {
            "is_correct": bool,
            "reasoning": str,
            "score": float (0.0-1.0)
        }
    """
    if not user_answer.strip():
        return {"is_correct": False, "reasoning": "No answer provided", "score": 0.0}
    
    evaluation_prompt = f"""You are an expert quiz evaluator. Evaluate the following student answer to a quiz question.

Question: {question_text}

Expected/Model Answer: {correct_answer}

Student's Answer: {user_answer}

Evaluate if the student's answer is correct. Consider:
1. Factual accuracy
2. Completeness (does it cover key points?)
3. Clarity and relevance

Respond in JSON format ONLY:
{{
  "is_correct": true/false,
  "reasoning": "brief explanation (1-2 sentences)",
  "score": 0.0-1.0
}}

IMPORTANT: Return ONLY the JSON object, nothing else. No markdown formatting, no code blocks, only the JSON object"""

    try:
        headers = build_fastapi_headers()
        response = await call_fastapi(
            "POST",
            "/chatbot/",
            json={"message": evaluation_prompt},
            headers=headers,
            timeout=30.0,
        )
        
        if response.status_code != 200:
            logger.warning(f"LLM evaluation failed: {response.status_code}")
            # Fallback to string matching if LLM fails
            is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
            return {
                "is_correct": is_correct,
                "reasoning": "String match" if is_correct else "Does not match expected answer",
                "score": 1.0 if is_correct else 0.0
            }
        
        response_data = response.json()
        response_text = response_data.get("response", "")
        
        # Extract JSON from response
        try:
            evaluation = json.loads(response_text)
            return {
                "is_correct": evaluation.get("is_correct", False),
                "reasoning": evaluation.get("reasoning", "Evaluation complete"),
                "score": evaluation.get("score", 0.0)
            }
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse LLM evaluation response: {response_text[:200]}")
            # Fallback to basic comparison
            is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
            return {
                "is_correct": is_correct,
                "reasoning": "Automatic evaluation",
                "score": 1.0 if is_correct else 0.0
            }
    except Exception as e:
        logger.error(f"Error evaluating short answer: {e}")
        # Fallback to basic string matching
        is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
        return {
            "is_correct": is_correct,
            "reasoning": "Fallback evaluation",
            "score": 1.0 if is_correct else 0.0
        }

class QuizHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = QuizSession.objects.filter(
            user=request.user
        ).order_by('-created_at')[:20]

        data = [{
            'id':             s.id,
            'subject':        s.subject,
            'total_questions': s.total_questions,
            'correct_answers': s.correct_answers,
            'score_percent':  float(s.score_percentage),
            'created_at':     s.created_at.isoformat(),
        } for s in sessions]

        return Response({'history': data})
