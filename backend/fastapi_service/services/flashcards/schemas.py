from pydantic import BaseModel


class FlashcardRequest(BaseModel):
    subject: str
    text: str
    prompt: str | None = None
    num_cards: int = 10