from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid

class MessageBase(BaseModel):
    role: str
    content: str

class Message(MessageBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime

class GeneralChatSessionBase(BaseModel):
    title: str

class GeneralChatSession(GeneralChatSessionBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    messages: List[Message] = []

class SocraticChatSessionBase(BaseModel):
    title: str

class SocraticChatSession(SocraticChatSessionBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    lecture_id: uuid.UUID
    created_at: datetime
    messages: List[Message] = []

class NotebookPageBase(BaseModel):
    content: Optional[str] = ""

class NotebookPage(NotebookPageBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    updated_at: datetime
    action_item_id: uuid.UUID

class ActionItemBase(BaseModel):
    type: str
    content: str
    due_date: Optional[datetime] = None

class ActionItemCreate(ActionItemBase):
    pass

class ActionItem(ActionItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    lecture_id: uuid.UUID
    user_id: uuid.UUID
    notebook_page: Optional[NotebookPage] = None

class ExternalNoteBase(BaseModel):
    title: str
    url: str
    type: str

class ExternalNoteCreate(ExternalNoteBase):
    class_id: Optional[uuid.UUID] = None
    lecture_id: Optional[uuid.UUID] = None

class ExternalNote(ExternalNoteBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    user_id: uuid.UUID
    class_id: Optional[uuid.UUID] = None
    lecture_id: Optional[uuid.UUID] = None

class LectureBase(BaseModel):
    title: str

class LectureCreate(LectureBase):
    transcript: str
    class_id: uuid.UUID

class Lecture(LectureBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    summary: Optional[str] = None
    class_id: uuid.UUID
    transcript: Optional[str] = ""
    status: str = "PROCESSING"
    action_items: List[ActionItem] = []
    external_notes: List[ExternalNote] = []

class ClassBase(BaseModel):
    title: str

class ClassCreate(ClassBase):
    pass

class Class(ClassBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    lectures: List[Lecture] = []
    external_notes: List[ExternalNote] = []

class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    username: str
    email: str
    created_at: datetime
    has_password: bool = False
    is_google_account: bool = False

class UserUpdateUsername(BaseModel):
    username: str

class UserUpdateEmail(BaseModel):
    email: str

class UserUpdatePassword(BaseModel):
    old_password: str
    new_password: str