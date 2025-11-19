from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import Config

engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI, 
    echo=Config.SQLALCHEMY_ECHO, 
    future=True
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()