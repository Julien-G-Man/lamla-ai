from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def flashcards_endpoint():
    """Placeholder for flashcards endpoint"""
    return {"message": "Flashcards endpoint not yet implemented"}
