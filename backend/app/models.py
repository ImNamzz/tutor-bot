from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship, declarative_base
import uuid

Base = declarative_base()

class Class(Base):
    __tablename__ = "classes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(80), nullable=False)
    created_at = Column(DateTime, default=func.now())
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="classes")    
    lectures = relationship("Lecture", back_populates="class_obj", cascade="all, delete-orphan")
    external_notes = relationship("ExternalNote", back_populates="class_obj", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<Class(id={self.id}, title='{self.title}')>"

class Lecture(Base):
    __tablename__ = "lectures"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(80), nullable=False)
    transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    class_obj = relationship("Class", back_populates="lectures")
    action_items = relationship("ActionItem", back_populates="lecture", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="lecture")
    external_notes = relationship("ExternalNote", back_populates="lecture", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<Lecture(id={self.id}, title='{self.title}')>"

class ActionItem(Base):
    __tablename__ = "action_items"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    due_date = Column(DateTime, nullable=True) 
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    lecture = relationship("Lecture", back_populates="action_items")
    user = relationship("User", back_populates="action_items")
    notebook_page = relationship("NotebookPage", back_populates="action_item", uselist=False, cascade="all, delete-orphan")
    def __repr__(self):
        return f"<ActionItem(id={self.id}, type='{self.type}')>"

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(80), nullable=False)
    created_at = Column(DateTime, default=func.now())
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=True) 
    user = relationship("User", back_populates="chat_sessions")
    lecture = relationship("Lecture", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="chat_session", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<ChatSession(id={self.id}, title='{self.title}')>"

class Message(Base):
    __tablename__ = "messages"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chat_session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(50), nullable=False) 
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    chat_session = relationship("ChatSession", back_populates="messages")
    def __repr__(self):
        return f"<Message(id={self.id}, role='{self.role}')>"

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime, default=func.now())
    classes = relationship("Class", back_populates="user", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    external_notes = relationship("ExternalNote", back_populates="user", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"
    
class NotebookPage(Base):
    __tablename__ = "notebook_pages"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content = Column(Text, nullable=True, default="") 
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    action_item_id = Column(String(36), ForeignKey("action_items.id"), unique=True, nullable=False)
    action_item = relationship("ActionItem", back_populates="notebook_page")
    def __repr__(self):
        return f"<NotebookPage(id={self.id}, action_item_id={self.action_item_id})>"
    
class ExternalNote(Base):
    __tablename__ = "external_notes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=func.now())
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="external_notes")
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=True)
    lecture_id = Column(String(36), ForeignKey("lectures.id"), nullable=True)
    class_obj = relationship("Class", back_populates="external_notes")
    lecture = relationship("Lecture", back_populates="external_notes")
    def __repr__(self):
        return f"<ExternalNote(id={self.id}, title='{self.title}')>"
    