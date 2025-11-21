import re
from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import create_access_token
from app import bcrypt, oauth
from app.core.database import SessionLocal
from app.models.models import User as UserModel

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    db = SessionLocal()
    try:
        data = request.json
        if db.query(UserModel).filter_by(email=data['email']).first():
            return jsonify({"detail": "Email already registered."}), 400
        if db.query(UserModel).filter_by(username=data['username']).first():
            return jsonify({"detail": "Username already taken."}), 400

        hashed = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        new_user = UserModel(username=data['username'], email=data['email'], hashed_password=hashed)
        db.add(new_user)
        db.commit()
        return jsonify({"message": "User registered successfully."}), 201
    finally:
        db.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    db = SessionLocal()
    try:
        data = request.json
        identifier = data.get('email')  # Can be email or username
        password = data.get('password')
        
        # Try to find user by email first, then by username
        user = db.query(UserModel).filter_by(email=identifier).first()
        if not user:
            user = db.query(UserModel).filter_by(username=identifier).first()
        
        if user and user.hashed_password and bcrypt.check_password_hash(user.hashed_password, password):
            token = create_access_token(identity=user.id)
            return jsonify(access_token=token), 200
        return jsonify({"detail": "Invalid credentials."}), 401
    finally:
        db.close()

@auth_bp.route("/google/login", methods=["GET"])
def google_login():
    redirect_uri = 'http://localhost:8000/api/auth/google/callback'
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    db = SessionLocal()
    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get('userinfo')
        if not user_info:
            return jsonify({"detail": "Google auth failed"}), 400

        email = user_info.get('email')
        user = db.query(UserModel).filter_by(email=email).first()
        
        needs_setup = False
        if not user:
            base_name = re.sub(r'[^a-zA-Z0-9]', '', user_info.get('name', 'User').lower()) or "user"
            username = base_name
            count = 1
            while db.query(UserModel).filter_by(username=username).first():
                username = f"{base_name}{count}"
                count += 1
            
            user = UserModel(username=username, email=email, google_id=user_info.get('sub'))
            db.add(user)
            db.commit()
            db.refresh(user)
            needs_setup = True

        access_token = create_access_token(identity=user.id)
        
        # Add setup parameter for new users
        if needs_setup:
            return redirect(f"{current_app.config['FRONTEND_URL']}/auth-callback?token={access_token}&setup=true")
        else:
            return redirect(f"{current_app.config['FRONTEND_URL']}/auth-callback?token={access_token}&setup=false")
    finally:
        db.close()