import os
import logging
from fastapi import FastAPI, HTTPException, Request
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from routes import chatbot, quiz, flashcards
from core.middleware import InternalAuthMiddleware

app = FastAPI(title="Lamla AI Engine")

class InternalAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip health endpoint
        if request.url.path.startswith("/health"):
            return await call_next(request)

        auth_header = request.headers.get("X-Internal-Auth")
        if not auth_header or auth_header != "SECRET_KEY_FROM_ENV":
            raise HTTPException(status_code=401, detail="Missing internal authentication header")

        return await call_next(request)
    
load_dotenv()

app.include_router(chatbot.router, prefix="/chatbot")
app.include_router(quiz.router, prefix="/quiz")
app.include_router(flashcards.router, prefix="/flashcards")

logger = logging.getLogger(__name__)

origins_env = os.getenv("FASTAPI_ALLOWED_ORIGINS", "http://127.0.0.1:8000, http://localhost:3000, https://lamla-api.onrender.com")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def check_health():
    return {"status": "ok", "message": "FastAPI Backend is live!"}