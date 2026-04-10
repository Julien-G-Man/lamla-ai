import logging
from datetime import datetime
from asgiref.sync import sync_to_async
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import ChatSession, ChatMessage
from .prompts import (
    SOCRATIC_MODE_INSTRUCTIONS,
    STATIC_PLATFORM_FACTS,
    TUTOR_BEHAVIOR_GUIDE,
    TOOL_USE_GUIDANCE,
    wrap_document_context,
)

logger = logging.getLogger(__name__)


async def _resolve_authenticated_user(request):
    """
    Resolve authenticated user for non-DRF async Django views.
    Uses DRF token auth only to avoid touching lazy request.user/session
    in async context.
    """
    auth_header = request.headers.get("Authorization", "").strip()
    if not auth_header:
        return None

    try:
        auth_result = await sync_to_async(
            TokenAuthentication().authenticate,
            thread_sensitive=True,
        )(request)
    except AuthenticationFailed:
        return None
    except Exception:
        logger.exception(
            "Token authentication failed in chatbot session resolver")
        return None

    if not auth_result:
        return None

    user, _token = auth_result
    return user if user and user.is_active else None


async def _get_or_create_session(request):
    """
    Get/create deterministic chat session for authenticated users only.
    Anonymous users are handled in-memory per request and are not persisted.
    """
    user = await _resolve_authenticated_user(request)

    if user:
        # Deterministic per-user session id guarantees stable memory continuity.
        deterministic_session_id = f"user-{user.id}"
        session_obj, _ = await sync_to_async(ChatSession.objects.get_or_create)(
            session_id=deterministic_session_id,
            defaults={"user": user},
        )
        # Self-heal legacy rows where session exists but is not linked to user.
        if session_obj.user_id != user.id:
            session_obj.user = user
            await sync_to_async(session_obj.save, thread_sensitive=True)(update_fields=["user"])
        return user, session_obj

    return None, None


async def _save_user_message(session_obj, user_message: str):
    """Save user message to DB for authenticated sessions only."""
    if session_obj is None:
        return None
    try:
        msg_obj = await sync_to_async(ChatMessage.objects.create)(
            session=session_obj,
            sender="user",
            content=user_message,
        )
        logger.debug("Saved user message ID %s to session %s",
                     msg_obj.id, session_obj.id)
        return msg_obj
    except Exception as exc:
        logger.error("Failed to save user message: %s", exc, exc_info=True)
        raise


async def _save_ai_message(session_obj, ai_message: str):
    """Save AI message to DB for authenticated sessions only."""
    if session_obj is None:
        return None
    try:
        msg_obj = await sync_to_async(ChatMessage.objects.create)(
            session=session_obj,
            sender="ai",
            content=ai_message,
        )
        logger.debug("Saved AI message ID %s to session %s",
                     msg_obj.id, session_obj.id)
        return msg_obj
    except Exception as exc:
        logger.error("Failed to save AI message: %s", exc, exc_info=True)
        raise


async def _get_conversation_history(session_obj, limit: int = 10):
    """
    Get conversation history for context.
    """
    if session_obj is None:
        return []

    history_qs = await sync_to_async(list)(session_obj.messages.order_by("-created_at")[:limit])
    conversation_history = []
    for msg in reversed(history_qs):
        conversation_history.append(
            {"message_type": msg.sender, "content": msg.content})
    return conversation_history


def fallback_response(user_message: str) -> str:
    """Static fallback when the AI service is unavailable."""
    msg = user_message.lower()
    if any(w in msg for w in ['hello', 'hi', 'hey']):
        return (
            "Hello! I'm Lamla AI Tutor. I'm here to help with platform questions, "
            "study tips, and general topics. What would you like to know today?"
        )
    if any(w in msg for w in ['feature', 'quiz', 'flashcard']):
        return (
            "Lamla AI offers quiz generation, flashcard creation, performance tracking, "
            "and study material uploads (PDF, PPTX, DOCX). "
            "Visit https://lamla-ai.vercel.app to explore all features."
        )
    if any(w in msg for w in ['contact', 'support', 'email']):
        return (
            "You can reach the Lamla team at lamlaaiteam@gmail.com "
            "or WhatsApp +233509341251. We usually respond within 24 hours."
        )
    if any(w in msg for w in ['thank', 'thanks']):
        return "You're welcome! Let me know if you have any other questions."
    return (
        "I'm Lamla AI Tutor. I can help with platform navigation, study tools, "
        "and general questions. What would you like to know?"
    )


def _build_system_prompt(
    platform_context: str,
    user=None,
    context_document: str = "",
    tutor_mode: str = "direct",
    include_tool_guidance: bool = False,
) -> str:
    """
    Single source of truth for the Lamla system prompt.

    Both _build_chatbot_prompt (one-shot) and _build_mcp_context (tool loop)
    call this. All text constants come from prompts.py — nothing is defined
    inline here.

    platform_context  -- retrieved KB chunks (from text_knowledge_store)
    context_document  -- optional uploaded file content
    tutor_mode        -- "direct" (default) or "socratic"
    include_tool_guidance -- True only for MCP/orchestrate paths
    """
    user_name = getattr(user, "username", None) if user else None
    user_line = ""
    if user_name:
        label = "superuser/platform manager" if user_name.lower() == "admin" else "student"
        user_line = f"Current user: {user_name} ({label}).\n"

    doc_section = wrap_document_context(context_document) if context_document else ""
    socratic_section = SOCRATIC_MODE_INSTRUCTIONS if tutor_mode == "socratic" else ""
    tool_section = TOOL_USE_GUIDANCE if include_tool_guidance else ""

    return (
        "You are Lamla, an AI tutor built to help students learn deeply — not just get answers.\n"
        "You are part of the Lamla AI platform: a study companion that generates quizzes, "
        "flashcards, and explanations tailored to each student.\n\n"
        f"{STATIC_PLATFORM_FACTS}\n"
        f"{user_line}"
        f"Date/time: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
        f"{doc_section}"
        f"PLATFORM KNOWLEDGE BASE:\n{platform_context}\n\n"
        f"{TUTOR_BEHAVIOR_GUIDE}"
        f"{socratic_section}"
        f"{tool_section}"
    )


async def _build_chatbot_prompt(
    user_message: str,
    conversation_history=None,
    context_document: str = "",
    user=None,
    tutor_mode: str = "direct",
) -> str:
    """One-shot prompt string for POST /chatbot/ (classic path)."""
    from .text_knowledge_store import knowledge_store
    platform_context = await sync_to_async(knowledge_store.get_all_context)()

    system_prompt = _build_system_prompt(
        platform_context=platform_context,
        user=user,
        context_document=context_document,
        tutor_mode=tutor_mode,
        include_tool_guidance=False,
    )

    history_text = ""
    if conversation_history:
        for msg in conversation_history:
            role = "User" if msg["message_type"] == "user" else "AI"
            history_text += f"{role}: {msg['content']}\n"

    return (
        f"{system_prompt}\n\n"
        f"Previous Conversation:\n{history_text}\n"
        f"Student Question: {user_message}\n\n"
        f"AI Tutor Response:"
    )


async def _build_mcp_context(
    user_message: str,
    conversation_history=None,
    user=None,
) -> tuple[str, list[dict]]:
    """
    MCP / tool-loop variant. Returns (system_prompt, messages).

    system_prompt  -- persona + KB + tool guidance (no history — goes in messages)
    messages       -- Anthropic [{role, content}] list, current user turn last
    """
    from .text_knowledge_store import knowledge_store
    platform_context = await sync_to_async(knowledge_store.get_all_context)()

    system_prompt = _build_system_prompt(
        platform_context=platform_context,
        user=user,
        include_tool_guidance=True,
    )

    messages: list[dict] = []
    if conversation_history:
        for msg in conversation_history:
            role = "user" if msg["message_type"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    return system_prompt, messages
