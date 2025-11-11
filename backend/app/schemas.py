from pydantic import BaseModel
from typing import List

class SessionCreate(BaseModel):
    title: str
    transcript: str

class GenerateResponse(BaseModel):
    session_id: int
    summary: str
    questions: List[str]
