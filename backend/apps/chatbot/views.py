from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, StreamingHttpResponse
import json
import logging
import uuid

from .chatbot_service import chatbot_service
from .models import ChatMessage, ChatSession
from .file_extractor import extract_text_from_file, FileExtractionError

logger = logging.getLogger(__name__)

def chatbot(request):
    """ Renders chat page """
    return render(request, 'ai/chat.html')

def test_chatbot(request):
    """ Renders the test chatbot page """
    return render(request, 'chatbot/test_chatbot.html') 

@csrf_exempt
@require_http_methods(["POST"])
def chatbot_api(request):
    """ Handles chatbot interactions via an API endpoint """
    try:
        # Standard chatbot_api expects JSON body
        data = json.loads(request.body)
        user_message = data.get('message', '')
        # Context document is only available from the file upload endpoint
        context_document = None 

        # Determine or create ChatSession
        if request.user.is_authenticated:
            session_obj, _ = ChatSession.objects.get_or_create(user=request.user)
        else:
            session_id = request.session.session_key or str(uuid.uuid4())
            if not request.session.session_key:
                request.session['session_id'] = session_id
            session_obj, _ = ChatSession.objects.get_or_create(session_id=session_id)

        # Save user message (attach to ChatSession)
        ChatMessage.objects.create(
            session=session_obj,
            sender="user",
            content=user_message,
        )

        # Get last N messages for context
        history_qs = session_obj.messages.order_by('-created_at')[:7]

        # Reformat history for service
        conversation_history = [
            {"message_type": msg.sender, "content": msg.content}
            for msg in reversed(history_qs)
        ]

        # Get AI response
        response_message = chatbot_service.generate_response(
            user_message, 
            conversation_history=conversation_history,
            context_document=context_document
        )

        # Save AI message
        ChatMessage.objects.create(
            session=session_obj,
            sender="ai",
            content=response_message
        )

        return JsonResponse({"response": response_message})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Chatbot API error: {e}", exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def chatbot_file_api(request):
    """
    Handles file upload, text extraction, and sends extracted text 
    plus user message to the AI for processing.
    """
    if 'file_upload' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded. Please select a file.'}, status=400)
    
    file = request.FILES['file_upload']
    # The user message comes from the POST data in a multipart form
    user_message = request.POST.get('message', 'Analyze the uploaded document.')

    try:
        # 1. EXTRACT TEXT FROM FILE
        context_document = extract_text_from_file(file)
        
        # Determine or create ChatSession
        if request.user.is_authenticated:
            session_obj, _ = ChatSession.objects.get_or_create(user=request.user)
        else:
            session_id = request.session.session_key or str(uuid.uuid4())
            if not request.session.session_key:
                request.session['session_id'] = session_id
            session_obj, _ = ChatSession.objects.get_or_create(session_id=session_id)

        # Save user message, indicating that file context was included
        ChatMessage.objects.create(
            session=session_obj,
            sender="user",
            content=f"{user_message} (Context from file: {file.name})",
        )

        # Get last N messages for context
        history_qs = session_obj.messages.order_by('-created_at')[:7]

        conversation_history = [
            {"message_type": msg.sender, "content": msg.content}
            for msg in reversed(history_qs)
        ]

        # 3. GENERATE AI RESPONSE WITH CONTEXT
        response_message = chatbot_service.generate_response(
            user_message, 
            conversation_history=conversation_history,
            context_document=context_document # Pass the extracted text
        )

        # 4. SAVE AI MESSAGE AND RESPOND
        ChatMessage.objects.create(
            session=session_obj,
            sender="ai",
            content=response_message
        )

        return JsonResponse({"response": response_message, "filename": file.name})

    except FileExtractionError as fee:
        # Handle specific file-related errors cleanly
        return JsonResponse({"error": str(fee)}, status=400)
    except Exception as e:
        logger.error(f"Chatbot File API error: {e}", exc_info=True)
        return JsonResponse({"error": "An unexpected server error occurred during processing."}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def chatbot_stream(request):
    """ Handles chatbot interactions via a streaming endpoint """
    try:
        data = json.loads(request.body)
        user_message = data.get('message', '')

        # Determine session
        if request.user.is_authenticated:
            session_obj, _ = ChatSession.objects.get_or_create(user=request.user)
        else:
            if not request.session.session_key:
                request.session.save()
            session_id = request.session.session_key or str(uuid.uuid4())
            session_obj, _ = ChatSession.objects.get_or_create(session_id=session_id)

        # Save user message
        ChatMessage.objects.create(
            session=session_obj,
            sender="user",
            content=user_message
        )

        # Get last N messages
        history_qs = session_obj.messages.order_by('-created_at')[:6]

        conversation_history = [
            {"message_type": msg.sender, "content": msg.content}
            for msg in reversed(history_qs)
        ]

        # Generate AI response (NOTE: Streaming response does not support document context yet in this view)
        full_response = chatbot_service.generate_response(
            user_message, conversation_history=conversation_history
        )

        # Save AI message
        ChatMessage.objects.create(
            session=session_obj,
            sender="ai",
            content=full_response
        )

        # Stream chunks of response
        def stream_response():
            for i in range(0, len(full_response), 10):  # send in chunks of 10 chars
                yield full_response[i:i+10]
        
        return StreamingHttpResponse(stream_response(), content_type="text/plain")

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Chatbot Stream API error: {e}", exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)
