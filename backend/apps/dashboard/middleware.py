from django.core.cache import cache
from django.utils import timezone
import json
from asgiref.sync import sync_to_async

from .models import AnonymousUsageEvent


class AnonymousUsageTrackingMiddleware:
    """Track unauthenticated API usage and keep only the last 24 hours."""

    PURGE_CACHE_KEY = "dashboard_anonymous_usage_last_purge"
    PURGE_INTERVAL_SECONDS = 300
    MAX_CAPTURED_STREAM_CHARS = 8000

    def __init__(self, get_response):
        self.get_response = get_response

    def _extract_tutor_message(self, path: str, body_bytes: bytes) -> str:
        if '/chat/' not in path and '/chatbot/' not in path:
            return ""
        if not body_bytes:
            return ""

        try:
            payload = json.loads(body_bytes.decode('utf-8', errors='ignore'))
        except Exception:
            return ""

        if isinstance(payload, dict):
            for key in ("message", "prompt", "query", "question", "text"):
                val = payload.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()[:4000]

            msgs = payload.get("messages")
            if isinstance(msgs, list):
                for item in reversed(msgs):
                    if isinstance(item, dict) and item.get("role") in ("user", "human"):
                        content = item.get("content")
                        if isinstance(content, str) and content.strip():
                            return content.strip()[:4000]
        return ""

    def _extract_tutor_response(self, path: str, response) -> str:
        if '/chat/' not in path and '/chatbot/' not in path:
            return ""
        if getattr(response, 'streaming', False):
            return ""

        try:
            content = getattr(response, 'content', b'') or b''
            payload = json.loads(content.decode('utf-8', errors='ignore'))
        except Exception:
            return ""

        if isinstance(payload, dict):
            for key in ("response", "answer", "content"):
                val = payload.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()[:8000]
        return ""

    def _is_chat_path(self, path: str) -> bool:
        return '/chat/' in path or '/chatbot/' in path

    def _to_bytes(self, chunk) -> bytes:
        if isinstance(chunk, bytes):
            return chunk
        if isinstance(chunk, str):
            return chunk.encode('utf-8', errors='ignore')
        return str(chunk).encode('utf-8', errors='ignore')

    def _create_event(self, *, session_key: str, request, path: str, response, request_chars: int, response_chars: int, tutor_message: str, tutor_response: str):
        forwarded_for = (request.META.get("HTTP_X_FORWARDED_FOR") or "").split(",")[0].strip()
        ip = forwarded_for or request.META.get("REMOTE_ADDR")
        AnonymousUsageEvent.objects.create(
            session_key=session_key,
            method=(request.method or "").upper()[:10],
            path=path[:255],
            query_string=(request.META.get("QUERY_STRING") or "")[:255],
            status_code=int(getattr(response, "status_code", 0) or 0),
            request_chars=int(request_chars or 0),
            response_chars=int(response_chars or 0),
            tutor_message=tutor_message,
            tutor_response=(tutor_response or "")[:8000],
            ip_address=ip,
            user_agent=(request.META.get("HTTP_USER_AGENT") or "")[:255],
        )

    def _maybe_purge(self):
        now_ts = timezone.now().timestamp()
        last_purge_ts = cache.get(self.PURGE_CACHE_KEY)
        if not last_purge_ts or (now_ts - float(last_purge_ts)) >= self.PURGE_INTERVAL_SECONDS:
            AnonymousUsageEvent.purge_expired(hours=24)
            cache.set(self.PURGE_CACHE_KEY, now_ts, timeout=self.PURGE_INTERVAL_SECONDS)

    def _wrap_streaming_response(self, response, *, session_key: str, request, path: str, request_chars: int, tutor_message: str):
        original_stream = response.streaming_content
        captured_parts = []
        captured_chars = 0
        total_response_bytes = 0

        if hasattr(original_stream, '__aiter__'):
            async def wrapped_stream_async():
                nonlocal captured_chars, total_response_bytes
                try:
                    async for chunk in original_stream:
                        chunk_bytes = self._to_bytes(chunk)
                        total_response_bytes += len(chunk_bytes)
                        if captured_chars < self.MAX_CAPTURED_STREAM_CHARS and chunk_bytes:
                            decoded = chunk_bytes.decode('utf-8', errors='ignore')
                            if decoded:
                                remaining = self.MAX_CAPTURED_STREAM_CHARS - captured_chars
                                kept = decoded[:remaining]
                                captured_parts.append(kept)
                                captured_chars += len(kept)
                        yield chunk
                finally:
                    await sync_to_async(self._create_event, thread_sensitive=True)(
                        session_key=session_key,
                        request=request,
                        path=path,
                        response=response,
                        request_chars=request_chars,
                        response_chars=total_response_bytes,
                        tutor_message=tutor_message,
                        tutor_response=''.join(captured_parts).strip(),
                    )
                    await sync_to_async(self._maybe_purge, thread_sensitive=True)()

            response.streaming_content = wrapped_stream_async()
            return response

        def wrapped_stream_sync():
            nonlocal captured_chars, total_response_bytes
            try:
                for chunk in original_stream:
                    chunk_bytes = self._to_bytes(chunk)
                    total_response_bytes += len(chunk_bytes)
                    if captured_chars < self.MAX_CAPTURED_STREAM_CHARS and chunk_bytes:
                        decoded = chunk_bytes.decode('utf-8', errors='ignore')
                        if decoded:
                            remaining = self.MAX_CAPTURED_STREAM_CHARS - captured_chars
                            kept = decoded[:remaining]
                            captured_parts.append(kept)
                            captured_chars += len(kept)
                    yield chunk
            finally:
                self._create_event(
                    session_key=session_key,
                    request=request,
                    path=path,
                    response=response,
                    request_chars=request_chars,
                    response_chars=total_response_bytes,
                    tutor_message=tutor_message,
                    tutor_response=''.join(captured_parts).strip(),
                )
                self._maybe_purge()

        response.streaming_content = wrapped_stream_sync()
        return response

    def __call__(self, request):
        response = self.get_response(request)

        path = request.path or ""
        if not path.startswith("/api/"):
            return response

        if request.method == "OPTIONS":
            return response

        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            return response

        try:
            request_chars = 0
            request_body = b""
            try:
                request_body = request.body or b""
                request_chars = len(request_body)
            except Exception:
                request_chars = 0
                request_body = b""

            response_chars = 0
            try:
                if not getattr(response, "streaming", False):
                    response_chars = len(getattr(response, "content", b"") or b"")
            except Exception:
                response_chars = 0

            session_key = ""
            if hasattr(request, "session"):
                if not request.session.session_key:
                    request.session.save()
                session_key = request.session.session_key or ""

            tutor_message = self._extract_tutor_message(path, request_body)
            tutor_response = self._extract_tutor_response(path, response)

            if getattr(response, "streaming", False) and self._is_chat_path(path):
                return self._wrap_streaming_response(
                    response,
                    session_key=session_key,
                    request=request,
                    path=path,
                    request_chars=int(request_chars or 0),
                    tutor_message=tutor_message,
                )

            self._create_event(
                session_key=session_key,
                request=request,
                path=path,
                response=response,
                request_chars=int(request_chars or 0),
                response_chars=int(response_chars or 0),
                tutor_message=tutor_message,
                tutor_response=tutor_response,
            )
            self._maybe_purge()
        except Exception:
            # Tracking should never break the main request flow.
            pass

        return response
