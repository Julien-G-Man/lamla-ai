"""
FastAPI Middleware for Internal Request Authentication

Verifies that requests from Django include the correct secret header.
"""
import os
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Get secret from environment
FASTAPI_SECRET = os.getenv("FASTAPI_SECRET")
FASTAPI_ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.getenv("FASTAPI_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
}


class InternalAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to verify internal requests from Django.

    Rules:
    - `/health` is public (for uptime probes / warmup pings).
    - All other endpoints require valid `X-Internal-Secret`.
    - Browser requests with `Origin` must come from FASTAPI_ALLOWED_ORIGINS.
    """

    # Paths accessible with a user token (Authorization: Token ...) instead of the
    # internal secret.  These are called directly by the frontend browser client.
    USER_TOKEN_PATHS = {"/chat/stream", "/chat/stream/"}

    async def dispatch(self, request: Request, call_next):
        # Keep health endpoint publicly accessible.
        if request.url.path in ("/health", "/"):
            return await call_next(request)

        # Allow frontend-facing chat stream endpoint — authenticated via Django
        # user token (Authorization: Token ...) rather than the internal secret.
        if request.url.path in self.USER_TOKEN_PATHS:
            # Always let CORS preflight pass so CORSMiddleware can respond correctly.
            if request.method == "OPTIONS":
                return await call_next(request)
            auth_header = request.headers.get("authorization", "")
            if auth_header.lower().startswith("token ") and len(auth_header) > 10:
                return await call_next(request)
            # No valid user token — reject with clear error
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required. Please log in."},
            )

        # If this is a browser-originated request, enforce strict origin allowlist.
        origin = request.headers.get("origin")
        if origin and FASTAPI_ALLOWED_ORIGINS and origin not in FASTAPI_ALLOWED_ORIGINS:
            logger.warning(
                "Request to %s blocked due to disallowed Origin: %s",
                request.url.path,
                origin,
            )
            return JSONResponse(
                status_code=403,
                content={"detail": "Origin not allowed"},
            )

        internal_secret = request.headers.get("X-Internal-Secret")

        if not internal_secret:
            logger.warning("Request to %s missing X-Internal-Secret header", request.url.path)
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing internal authentication header"},
            )

        if not FASTAPI_SECRET or internal_secret != FASTAPI_SECRET:
            logger.warning("Request to %s has invalid internal secret", request.url.path)
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid internal authentication secret"},
            )

        return await call_next(request)
