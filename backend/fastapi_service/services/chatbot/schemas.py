from pydantic import BaseModel
from typing import Optional

class PromptIn(BaseModel):
	prompt: str
	max_tokens: Optional[int] = 400

class ChatStreamIn(BaseModel):
	message: str
	search_mode: Optional[str] = "disabled"
	max_tokens: Optional[int] = 800