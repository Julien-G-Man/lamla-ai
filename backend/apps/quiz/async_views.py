"""
High-Performance Async Proxy View for Quiz Generation

Implements the Asynchronous Proxy Pattern for quiz endpoints.
"""
import os
import docx
import PyPDF2
import json
import logging
import httpx
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from adrf.decorators import api_view
from apps.core.async_client import get_async_client, build_fastapi_headers

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
async def ajax_extract_text(request):
    """
    Async view to extract text from uploaded files.
    Matches frontend key: 'slide_file'
    """
    if 'slide_file' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded'}, status=400)

    file = request.FILES['slide_file']
    filename = file.name.lower()
    file_ext = os.path.splitext(filename)[1]
    max_size = 10 * 1024 * 1024  # 10MB
    
    if file.size > max_size:
        return JsonResponse({'error': 'File too large (max 10MB)'}, status=400)

    try:
        text = ""
        # PDF extraction
        if file_ext == '.pdf':
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() or ''
                
        # DOCX extraction
        elif file_ext == '.docx':
            doc = docx.Document(file)
            text = '\n'.join([para.text for para in doc.paragraphs])
            
        # PPTX extraction
        elif file_ext == '.pptx':
            from pptx import Presentation
            prs = Presentation(file)
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text:
                        text += shape.text + '\n'
                        
        # TXT extraction
        elif file_ext == '.txt':
            text = file.read().decode('utf-8', errors='ignore')
            
        else:
            return JsonResponse({'error': 'Unsupported file format'}, status=400)

        text = text.strip()
        if not text:
            return JsonResponse({'error': 'No text could be extracted.'}, status=400)
        
        # Performance truncation 
        if len(text) > 50000:
            text = text[:49900] + '... [truncated]'
        
        print(f"Text extraction successful! File: {filename.capitalize()} ({round(file.size / (1024 * 1024), 2)}) MB")   
        
        # Returns 'text' which frontend sets to extractedText
        return JsonResponse({'text': text})
        
    except Exception as e:
        logger.error(f"Extraction Error: {str(e)}")
        return JsonResponse({'error': 'Internal processing error'}, status=500)


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
        
        subject = (data.get("subject") or data.get("subject") or "General").strip()
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
        
        num_mcq = max(1, min(num_mcq, 20))
        
        payload = {
            "subject": subject,
            "study_text": study_text,
            "num_mcq": int(num_mcq),
            "num_short": int(num_short),
            "difficulty": difficulty,
        }
        
        # Forward to FastAPI using async client
        client = get_async_client()
        headers = build_fastapi_headers()
        logger.info(f"Headers sent: {headers}")
        
        fastapi_resp = await client.post(
            "/quiz/",
            json=payload,
            headers=headers,
            timeout=60.0 
        )
        
        if fastapi_resp.status_code != 200:
            logger.warning(f"FastAPI quiz call failed: {fastapi_resp.status_code} {fastapi_resp.text}")
            return JsonResponse(
                {"error": "Quiz service temporarily unavailable"}, 
                status=503
            )
        
        quiz_data = fastapi_resp.json()
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

