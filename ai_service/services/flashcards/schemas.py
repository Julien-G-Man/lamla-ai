from pydantic import BaseModel, Field


class FlashcardRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    text: str = Field(..., min_length=30, max_length=50000)
    prompt: str | None = Field(default="", max_length=1500)
    num_cards: int = Field(default=10, ge=1, le=25)
    difficulty: str = Field(default="intermediate", pattern="^(beginner|intermediate|exam)$")


class FlashcardExplainRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    answer: str = Field(..., min_length=1, max_length=4000)