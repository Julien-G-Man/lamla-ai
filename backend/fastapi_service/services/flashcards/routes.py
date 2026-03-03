from fastapi import APIRouter
from .schemas import FlashcardRequest
from core.ai_client import ai_service
from core.http import get_async_client

flashcards_router = APIRouter()

DIFFICULTY_PROMPTS = {

    "beginner": """
Create simple flashcards for beginners.

Rules:
- Use simple language
- Short answers
- Focus on definitions and basic understanding
""",

    "intermediate": """
Create moderate difficulty flashcards.

Rules:
- Include conceptual understanding
- Test relationships between ideas
- Medium complexity
""",

    "exam": """
Create exam-level flashcards.

Rules:
- Challenging conceptual questions
- Focus on problem solving and application
- Similar to university exam questions
"""
}

@flashcards_router.post("/generate")
async def generate_flashcards(data: dict):

    client = await get_async_client()

    subject = data.get("subject")
    text = data.get("text")
    num_cards = int(data.get("num_cards", 10))
    difficulty = data.get("difficulty", "intermediate")
    user_prompt = data.get("prompt", "")

    difficulty_prompt = DIFFICULTY_PROMPTS.get(
        difficulty,
        DIFFICULTY_PROMPTS["intermediate"]
    )

    prompt = f"""
You are an expert study assistant.

Subject: {subject}

Content:
{text}

Additional instructions:
{user_prompt}

Difficulty level:
{difficulty_prompt}

Create {num_cards} flashcards.

Return ONLY valid JSON in this format:

[
  {{
    "question": "...",
    "answer": "..."
  }}
]
"""

    result = await ai_service.generate_content(
        client=client,
        prompt=prompt,
        max_tokens=1200
    )

    return {
        "cards": result
    }


@flashcards_router.post("/explain")
async def explain_flashcard(data: dict):

    client = await get_async_client()

    prompt = f"""
A student failed a flashcard.

Question:
{data["question"]}

Correct Answer:
{data["answer"]}

Explain this concept clearly in 3 short sentences
like a tutor helping a beginner.
"""

    result = await ai_service.generate_content(
        client=client,
        prompt=prompt,
        max_tokens=200
    )

    return {
        "explanation": result
    }