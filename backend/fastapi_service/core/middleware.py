"""
FastAPI Middleware for Internal Request Authentication

Verifies that requests from Django include the correct secret header.
"""
import os
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

# Get secret from environment 
FASTAPI_SECRET = os.getenv("FASTAPI_SECRET")


class InternalAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to verify internal requests from Django.
    
    Checks for X-Internal-Secret header and rejects requests without it
    (except for health check endpoint).
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth check for health endpoint
        if request.url.path == "/health":
            return await call_next(request)
        
        # Check for internal secret header
        internal_secret = request.headers.get("X-Internal-Secret")
        
        if not internal_secret:
            logger.warning(f"Request to {request.url.path} missing X-Internal-Secret header")
            raise HTTPException(
                status_code=401,
                detail="Missing internal authentication header"
            )
        
        if internal_secret != FASTAPI_SECRET:
            logger.warning(f"Request to {request.url.path} has invalid secret")
            raise HTTPException(
                status_code=403,
                detail="Invalid internal authentication secret"
            )
        
        # Request is authenticated, proceed
        response = await call_next(request)
        return response

