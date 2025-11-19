from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from authlib.integrations.flask_client import OAuth
from app.core.config import Config
from app.core.database import engine
from app.models.models import Base

bcrypt = Bcrypt()
jwt = JWTManager()
oauth = OAuth()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, resources={r"/api/*": {"origins": app.config["FRONTEND_URL"]}}, supports_credentials=True)
    bcrypt.init_app(app)
    jwt.init_app(app)
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )
    Base.metadata.create_all(bind=engine)
    from app.api.auth import auth_bp
    from app.api.users import users_bp
    from app.api.classes import classes_bp
    from app.api.lectures import lectures_bp
    from app.api.chat import chat_bp
    from app.api.action_items import action_items_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/user")
    app.register_blueprint(classes_bp, url_prefix="/api/classes")
    app.register_blueprint(lectures_bp, url_prefix="/api/lectures")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(action_items_bp, url_prefix="/api/action_items")

    @app.route("/health")
    def health_check():
        return {"status": "i'm fine don't worry", "env": app.config["APP_ENV"]}

    return app