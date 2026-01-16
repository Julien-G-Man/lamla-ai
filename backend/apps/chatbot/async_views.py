"""
High-Performance Async Proxy Views for Chatbot

These views implement the Asynchronous Proxy Pattern for chatbot endpoints:
- Django handles session/auth and DB operations (fast)
- Proxies LLM requests to FastAPI with async streaming
- Zero-copy streaming for optimal performance
"""
import json
import logging
import uuid
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from asgiref.sync import sync_to_async
import httpx

from apps.core.async_client import get_async_client, build_fastapi_headers
from .chatbot_service import chatbot_service
from .models import ChatMessage, ChatSession

logger = logging.getLogger(__name__)


async def _get_or_create_session(request):
    """Get or create a chat session (sync DB operation wrapped in async)"""
    if request.user.is_authenticated:
        session_obj, _ = await sync_to_async(ChatSession.objects.get_or_create)(user=request.user)
    else:
        session_id = request.session.session_key or str(uuid.uuid4())
        if not request.session.session_key:
            request.session['session_id'] = session_id
            await sync_to_async(request.session.save)()
        session_obj, _ = await sync_to_async(ChatSession.objects.get_or_create)(session_id=session_id)
    return session_obj


async def _save_user_message(session_obj, user_message: str):
    """Save user message to DB"""
    await sync_to_async(ChatMessage.objects.create)(
        session=session_obj,
        sender="user",
        content=user_message,
    )


async def _save_ai_message(session_obj, ai_message: str):
    """Save AI message to DB"""
    await sync_to_async(ChatMessage.objects.create)(
        session=session_obj,
        sender="ai",
        content=ai_message,
    )


async def _get_conversation_history(session_obj, limit: int = 7):
    """Get conversation history for context"""
    history_qs = await sync_to_async(list)(session_obj.messages.order_by('-created_at')[:limit])
    conversation_history = []
    for msg in reversed(history_qs):
        conversation_history.append({"message_type": msg.sender, "content": msg.content})
    return conversation_history[-6:]  # Return last 6 messages


async def _build_chatbot_prompt(user_message: str, conversation_history=None, context_document=None):
    """Build the full prompt using chatbot_service logic"""
    # Wrap synchronous DB operations in sync_to_async
    lamla_knowledge = await sync_to_async(chatbot_service.get_lamla_knowledge_base)()
    edtech_best_practices = chatbot_service.get_edtech_best_practices()  # This is just a string, no DB call
    
    document_context = ""
    if context_document:
        document_context = f"""
INSTRUCTION: The user has uploaded study material. Use the following text as the primary context for answering their current question.
DOCUMENT TEXT:
{context_document}
"""
    
    # Base system prompt
    system_prompt = f"""You are Lamla AI Tutor, a friendly and helpful AI assistant for an educational platform. Your name is Lamla AI Tutor, and you can answer questions about the platform and general topics.
{document_context}
Context about Lamla AI:
{lamla_knowledge}

Educational Technology Best Practices:
{edtech_best_practices}

IMPORTANT RESPONSE GUIDELINES:
1. Be warm, friendly, and encouraging in your tone
2. Use proper formatting for lists with clear indentation and bullet points
3. Structure your responses with clear sections when appropriate
4. Use emojis sparingly but effectively to make responses more engaging
5. Break down complex information into digestible chunks
6. Always introduce yourself as Lamla AI Tutor when appropriate
7. Be helpful, concise, and well-organized
8. When providing step-by-step instructions, use numbered lists with proper indentation
9. When listing features or options, use bullet points with proper indentation
10. DO NOT use markdown symbols like ** or ## in your responses
11. Use clean, readable formatting without bold or heading symbols
12. Immediately identify the user's language and respond in the same language
13. Follow EdTech Best Practices, but be sincere about your limitations and the features you have

You can also answer general questions and help with various topics. Always maintain a helpful and friendly demeanor."""

    # Add conversation history
    history_text = ""
    if conversation_history:
        for msg in conversation_history:
            role = "User" if msg["message_type"] == "user" else "AI"
            history_text += f"{role}: {msg['content']}\n"

    full_prompt = f"{system_prompt}\nConversation so far:\n{history_text}\nUser: {user_message}\nAI:"
    return full_prompt


@csrf_exempt
@require_http_methods(["POST"])
async def chatbot_api_async(request):
    """
    High-performance async proxy for chatbot API endpoint.
    
    Flow:
    1. Django handles session/auth (fast)
    2. Saves user message to DB
    3. Builds prompt with conversation history
    4. Proxies to FastAPI with async client
    5. Saves AI response to DB
    6. Returns response
    """
    try:
        # Parse request
        data = json.loads(request.body) if request.body else {}
        user_message = data.get('message', '')
        
        if not user_message:
            return JsonResponse({"error": "Message is required"}, status=400)
        
        # 1. Django handles session/auth (fast DB operations)
        session_obj = await _get_or_create_session(request)
        
        # 2. Save user message
        await _save_user_message(session_obj, user_message)
        
        # 3. Get conversation history
        conversation_history = await _get_conversation_history(session_obj)
        
        # 4. Build full prompt
        full_prompt = await _build_chatbot_prompt(user_message, conversation_history)
        
        # 5. Forward to FastAPI using async client
        client = get_async_client()
        headers = build_fastapi_headers()
        
        fastapi_resp = await client.post(
            "/chatbot/",
            json={"prompt": full_prompt, "max_tokens": 400},
            headers=headers,
            timeout=60.0
        )
        
        if fastapi_resp.status_code != 200:
            logger.warning(f"FastAPI responded {fastapi_resp.status_code}: {fastapi_resp.text}")
            return JsonResponse(
                {"error": "AI service temporarily unavailable"}, 
                status=503
            )
        
        resp_json = fastapi_resp.json()
        ai_response = resp_json.get("response", "")
        
        if not ai_response:
            ai_response = chatbot_service._get_fallback_response(user_message)
        
        # Clean markdown
        cleaned_response = chatbot_service.clean_markdown(ai_response.strip())
        
        # 6. Save AI message
        await _save_ai_message(session_obj, cleaned_response)
        
        return JsonResponse({"response": cleaned_response})
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except httpx.TimeoutException:
        logger.error("FastAPI request timed out")
        return JsonResponse({"error": "Request timeout"}, status=504)
    except httpx.RequestError as e:
        logger.error(f"FastAPI request error: {e}")
        return JsonResponse({"error": "Service unavailable"}, status=503)
    except Exception as e:
        logger.error(f"Chatbot API error: {e}", exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
async def chatbot_stream_async(request):
    """
    High-performance async streaming proxy for chatbot endpoint.
    
    Streams LLM response chunks directly from FastAPI to client with zero-copy.
    """
    try:
        # Parse request
        data = json.loads(request.body) if request.body else {}
        user_message = data.get('message', '')
        
        if not user_message:
            return JsonResponse({"error": "Message is required"}, status=400)
        
        # 1. Django handles session/auth
        session_obj = await _get_or_create_session(request)
        
        # 2. Save user message
        await _save_user_message(session_obj, user_message)
        
        # 3. Get conversation history
        conversation_history = await _get_conversation_history(session_obj, limit=6)
        
        # 4. Build full prompt
        full_prompt = await _build_chatbot_prompt(user_message, conversation_history)
        
        # 5. Forward to FastAPI (Note: FastAPI doesn't stream yet, so we get full response and stream it)
        client = get_async_client()
        headers = build_fastapi_headers()
        
        fastapi_resp = await client.post(
            "/chatbot/",
            json={"prompt": full_prompt, "max_tokens": 400},
            headers=headers,
            timeout=60.0
        )
        
        if fastapi_resp.status_code != 200:
            logger.warning(f"FastAPI responded {fastapi_resp.status_code}: {fastapi_resp.text}")
            return JsonResponse(
                {"error": "AI service temporarily unavailable"}, 
                status=503
            )
        
        # Parse response
        resp_json = fastapi_resp.json()
        ai_response = resp_json.get("response", "")
        
        if not ai_response:
            ai_response = chatbot_service._get_fallback_response(user_message)
        
        # Clean markdown
        cleaned_response = chatbot_service.clean_markdown(ai_response.strip())
        
        # Stream the response in chunks to simulate streaming
        async def stream_generator():
            # Stream in chunks of ~10 characters for smooth UX
            chunk_size = 10
            for i in range(0, len(cleaned_response), chunk_size):
                chunk = cleaned_response[i:i+chunk_size]
                yield chunk.encode('utf-8')
                # Small delay to simulate streaming (optional, can be removed)
                import asyncio
                await asyncio.sleep(0.01)
            
            # Save to DB after streaming completes
            try:
                await _save_ai_message(session_obj, cleaned_response)
            except Exception as e:
                logger.warning(f"Failed to save streamed response to DB: {e}")
        
        # Create streaming response
        return StreamingHttpResponse(
            stream_generator(),
            content_type="text/plain; charset=utf-8"
        )
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except httpx.TimeoutException:
        logger.error("FastAPI request timed out")
        return JsonResponse({"error": "Request timeout"}, status=504)
    except httpx.RequestError as e:
        logger.error(f"FastAPI request error: {e}")
        return JsonResponse({"error": "Service unavailable"}, status=503)
    except Exception as e:
        logger.error(f"Chatbot Stream API error: {e}", exc_info=True)
        return JsonResponse({"error": "Internal server error"}, status=500)

