from pydantic import BaseModel
from typing import Optional

class PromptIn(BaseModel):
	prompt: str
	max_tokens: Optional[int] = 400