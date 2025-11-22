import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev_secret_key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_jwt_key")
    APP_ENV = os.getenv("APP_ENV", "development")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB = os.getenv("MYSQL_DB", "chatbot_db")
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = (APP_ENV == "development")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    CLOVA_API_HOST = os.getenv("CLOVA_API_HOST", "https://clovastudio.stream.ntruss.com")
    CLOVA_API_KEY = os.getenv("CLOVA_API_KEY")
    CLOVA_MODEL = os.getenv("CLOVA_MODEL", "HCX-005")
    SOCRATIC_PROMPT = os.getenv("SYSTEM_PROMPT")
    ANALYSIS_PROMPT = os.getenv("ANALYSIS_PROMPT")
    GENERAL_PROMPT = "You are a helpful AI teaching assistant. Answer questions clearly and concisely."
    CLOVA_SPEECH_URL = os.getenv("CLOVA_SPEECH_URL")
    CLOVA_SPEECH_SECRET = os.getenv("CLOVA_SPEECH_SECRET")
    NCP_ACCESS_KEY = os.getenv("NCP_ACCESS_KEY")
    NCP_SECRET_KEY = os.getenv("NCP_SECRET_KEY")
    NCP_ENDPOINT = os.getenv("NCP_ENDPOINT", "https://kr.object.ncloudstorage.com")
    NCP_BUCKET_NAME = os.getenv("NCP_BUCKET_NAME")