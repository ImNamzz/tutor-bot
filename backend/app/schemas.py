from pydantic import BaseModel, ConfigDict
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ActionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    content: str
    created_at: datetime
    lecture_id: int
    user_id: int

class LectureBase(BaseModel):
    title: str

class LectureCreate(LectureBase):
    transcript: str

class Lecture(LectureBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime
    summary: Optional[str] = None
    action_items: List[ActionItem] = []

class ChatSessionBase(BaseModel):
    title: str

class ChatSession(ChatSessionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    lecture_id: Optional[int] = None
    created_at: datetime

class NotebookPage(BaseModel):
    id: int
    content: Optional[str] = ""
    updated_at: datetime
    action_item_id: int
    class Config:
        orm_mode = True