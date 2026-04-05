from pydantic import BaseModel, Field
from typing import Optional, List

class QuizQuestion(BaseModel):
    question: str
    type: str = Field(..., description="mcq | short")
    options: List[str] = Field(default_factory=list)
    answer: str
    explanation: Optional[str] = None


class QuizRequest(BaseModel):
    subject: str
    study_text: str
    num_mcq: int = Field(7, ge=0, le=30)
    num_short: int = Field(3, ge=0, le=10)
    difficulty: str = Field("medium", description="easy | medium | hard")
    source_type: str = Field("text", description="text | file | youtube")
    source_title: Optional[str] = Field(None, description="Video title or filename")


class QuizResponse(BaseModel):
    subject: str
    study_text: str
    difficulty: str
    mcq_questions: List[QuizQuestion]
    short_questions: List[QuizQuestion]
