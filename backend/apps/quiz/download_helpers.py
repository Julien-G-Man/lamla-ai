import os
import re
import textwrap
from io import BytesIO
from datetime import datetime
from zoneinfo import ZoneInfo

import docx
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
    
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas as rl_canvas
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


logger = logging.getLogger(__name__)


def _safe_filename(name: str, max_len: int = 180) -> str:
    """Make a string safe for use as a filename."""
    if not name:
        return "Quiz_Results"
    s = str(name).strip()
    s = re.sub(r'\s+', '_', s)
    s = re.sub(r'[\\/:"*?<>|]+', '_', s)
    return s[:max_len] or "Quiz_Results"


def _format_quiz_text(results: dict) -> str:
    """Format quiz results as plain text."""
    score = results.get('score', 0)
    total = results.get('total', 0)
    score_percent = results.get('score_percent', 0)
    details = results.get('details', [])
    subject = results.get('subject', 'Quiz')
    difficulty = results.get('difficulty', 'unknown')
    
    tz = ZoneInfo('Africa/Accra')
    timestamp = datetime.now(tz).strftime('%Y-%m-%d %H:%M:%S %Z')
    
    lines = [
        'Lamla AI - Quiz Results',
        '=' * 70,
        f"Subject: {subject}",
        f"Difficulty: {difficulty}",
        f"Generated: {timestamp}",
        f"Score: {score}/{total} ({score_percent:.1f}%)",
        '=' * 70,
        ''
    ]
    
    lines.append('DETAILED ANSWER REVIEW')
    lines.append('-' * 70)
    lines.append('')
    
    for idx, detail in enumerate(details, 1):
        lines.append(f"Q{idx}. {detail.get('question', '')}")
        lines.append(f"Your Answer: {detail.get('user_answer') or '(Unanswered)'}")
        lines.append(f"Correct Answer: {detail.get('correct_answer', '')}")
        status = '✓ CORRECT' if detail.get('is_correct') else '✗ INCORRECT'
        lines.append(f"Status: {status}")
        
        if detail.get('reasoning'):
            lines.append(f"Evaluation: {detail.get('reasoning')}")
        if detail.get('explanation'):
            lines.append(f"Explanation: {detail.get('explanation')}")
        lines.append('')
    
    return '\n'.join(lines)


@csrf_exempt
@require_http_methods(["POST"])
def download_quiz_results(request):
    """Download quiz results as PDF, DOCX, or TXT."""
    try:
        data = json.loads(request.body) if request.body else {}
        results = data.get('results', {})
        file_format = data.get('format', 'pdf').lower()
        
        if not results:
            return JsonResponse({"error": "No results data provided"}, status=400)
        
        subject = results.get('subject', 'Quiz')
        safe_filename = _safe_filename(subject)
        tz = ZoneInfo('Africa/Accra')
        timestamp = datetime.now(tz).strftime('%Y%m%d_%H%M%S')
        filename_base = f"{safe_filename}_Quiz_{timestamp}"
        
        text_content = _format_quiz_text(results)
        
        if file_format == 'pdf':
            if not HAS_REPORTLAB:
                return JsonResponse(
                    {"error": "PDF generation not available. Please use TXT or DOCX format."},
                    status=400
                )
            
            buffer = BytesIO()
            p = rl_canvas.Canvas(buffer, pagesize=letter)
            width, height = letter
            y = height - 40
            
            for line in text_content.split('\n'):
                for wrapped_line in textwrap.wrap(line, width=95):
                    p.drawString(40, y, wrapped_line)
                    y -= 16
                    if y < 40:
                        p.showPage()
                        y = height - 40
            
            p.save()
            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.pdf"'
            return response
        
        elif file_format == 'docx':
            buffer = BytesIO()
            doc = docx.Document()
            
            for line in text_content.split('\n'):
                doc.add_paragraph(line)
            
            doc.save(buffer)
            buffer.seek(0)
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.docx"'
            return response
        
        else:  # TXT
            response = HttpResponse(text_content, content_type='text/plain')
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.txt"'
            return response
    
    except Exception as e:
        logger.error(f"Error generating download: {e}", exc_info=True)
        return JsonResponse({"error": "Failed to generate file"}, status=500)

