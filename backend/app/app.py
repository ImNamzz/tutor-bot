import os
import uuid
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from .database import engine, SessionLocal
from .models import Base, ChatSession as ChatSessionModel, Message as MessageModel, User as UserModel, ActionItem as ActionItemModel, Lecture as LectureModel, NotebookPage as NotebookPageModel, Class as ClassModel,  ExternalNote as ExternalNoteModel
from .ai_client import get_socratic_response, SYSTEM_PROMPT, transcribe_audio, analyze_transcript
from .schemas import ActionItem as ActionItemSchema, Lecture as LectureSchema, ChatSession as ChatSessionSchema, NotebookPage as NotebookPageSchema, Class as ClassSchema, ClassCreate, ExternalNote as ExternalNoteSchema, ExternalNoteCreate, UserUpdateUsername, UserUpdateEmail, UserUpdatePassword, LectureCreate
from typing import List
from werkzeug.utils import secure_filename
from sqlalchemy.orm import joinedload, Session
from authlib.integrations.flask_client import OAuth
from dateutil.parser import parse as date_parse
from datetime import datetime

Base.metadata.create_all(bind=engine)
app = Flask(__name__)

origins = ["http://localhost:3000"]
CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
oauth = OAuth(app)
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)
APP_ROOT = os.path.dirname(os.path.abspath(__file__)) 
TEMP_FOLDER = os.path.join(APP_ROOT, 'audio')
ALLOWED_LANGUAGES = ['en-US', 'ko-KR', 'ja', 'zh-cn', 'zh-tw']

@jwt.unauthorized_loader
def unauthorized_callback(error):
    print(f"JWT UNAUTHORIZED: {error}")
    return jsonify({"detail": "Missing or invalid token"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"JWT INVALID TOKEN: {error}")
    return jsonify({"detail": "Invalid token"}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("JWT EXPIRED")
    return jsonify({"detail": "Token has expired"}), 401

@app.route("/api/register", methods=["POST"])
def register():
    db = SessionLocal()
    try:
        data = request.json
        username = data['username']
        email = data['email']
        password = data['password']

        if db.query(UserModel).filter_by(email=email).first():
            return jsonify({"detail": "Email already registered."}), 400
        if db.query(UserModel).filter_by(username=username).first():
            return jsonify({"detail": "Username already taken."}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        new_user = UserModel(
            username=username, 
            email=email, 
            hashed_password=hashed_password
        )
        db.add(new_user)
        db.commit()

        return jsonify({"message": "User registered successfully."}), 201
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/login", methods=["POST"])
def login():
    db = SessionLocal()
    try:
        data = request.json
        email_or_username = data.get('email_or_username') or data.get('email')  # Support both keys
        password = data['password']
        
        # Try to find user by email or username
        user = db.query(UserModel).filter(
            (UserModel.email == email_or_username) | (UserModel.username == email_or_username)
        ).first()
        
        if user and user.hashed_password and bcrypt.check_password_hash(user.hashed_password, password):
            
            access_token = create_access_token(identity=user.id)
            print(access_token)
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({"detail": "Invalid email or password."}), 401
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()



@app.route("/api/auth/google/login", methods=["GET"])
def google_login(): 
    redirect_uri = 'http://localhost:8000/api/auth/google/callback'
    return oauth.google.authorize_redirect(redirect_uri)

@app.route("/api/auth/google/callback", methods=["GET"])
def google_callback():
    db = SessionLocal()
    try:
        
        token = oauth.google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info:
            return jsonify({"detail": "Failed to get user info from Google."}), 400

        google_id = user_info.get('sub')
        email = user_info.get('email')
        full_name = user_info.get('name', 'User')
        is_new_user = False
        user = db.query(UserModel).filter_by(google_id=google_id).first()
        if user:
            pass 
        else:
            user = db.query(UserModel).filter_by(email=email).first()
            if user:
                user.google_id = google_id
            else:
                base_username = re.sub(r'[^a-zA-Z0-9]', '', full_name.lower())
                if not base_username: 
                    base_username = email.split('@')[0] 
                
                username = base_username
                count = 1
                while db.query(UserModel).filter_by(username=username).first():
                    username = f"{base_username}{count}"
                    count += 1

                new_user = UserModel(
                    username=username,
                    email=email,
                    google_id=google_id,
                    hashed_password=None 
                )
                db.add(new_user)
                user = new_user
                is_new_user = True
        
        db.commit()
        db.refresh(user)
        
        access_token = create_access_token(identity=user.id)
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        if is_new_user:
            return app.redirect(f"{frontend_url}/auth-callback?token={access_token}&setup=true")
        else:
            return app.redirect(f"{frontend_url}/auth-callback?token={access_token}")

    except Exception as e:
        db.rollback()
        print(f"Error in Google OAuth callback: {e}")
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/user/username", methods=["PATCH"])
@jwt_required()
def update_username():
    current_user_id = get_jwt_identity() 
    data = request.json
    try:
        new_username = UserUpdateUsername.model_validate(data).username
    except Exception as e:
        return jsonify({"detail": f"Invalid data: {e}"}), 422

    db = SessionLocal()
    try:
        if db.query(UserModel).filter(UserModel.username == new_username).first():
            return jsonify({"detail": "Username already taken."}), 400
        
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        if not user:
            return jsonify({"detail": "User not found."}), 404
        user.username = new_username
        db.commit()
        return jsonify({"message": "Username updated successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/user/email", methods=["PATCH"])
@jwt_required()
def update_email():
    current_user_id = get_jwt_identity()
    data = request.json
    try:
        new_email = UserUpdateEmail.model_validate(data).email
    except Exception as e:
        return jsonify({"detail": f"Invalid data: {e}"}), 422

    db = SessionLocal()
    try:
        
        if db.query(UserModel).filter(UserModel.email == new_email).first():
            return jsonify({"detail": "Email already registered."}), 400
        
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        if not user:
            return jsonify({"detail": "User not found."}), 404
        
        user.email = new_email
        db.commit()
        return jsonify({"message": "Email updated successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/user/password", methods=["PUT"])
@jwt_required()
def update_password():
    current_user_id = get_jwt_identity()
    data = request.json
    try:
        passwords = UserUpdatePassword.model_validate(data)
    except Exception as e:
        return jsonify({"detail": f"Invalid data: {e}"}), 422

    db = SessionLocal()
    try:
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        if not user:
            return jsonify({"detail": "User not found."}), 404

        # If user has no password (Google OAuth user), allow setting initial password
        if not user.hashed_password:
            new_hashed_password = bcrypt.generate_password_hash(passwords.new_password).decode('utf-8')
            user.hashed_password = new_hashed_password
            db.commit()
            return jsonify({"message": "Password set successfully."}), 200
        
        # If user has password, verify old password
        if not bcrypt.check_password_hash(user.hashed_password, passwords.old_password):
            return jsonify({"detail": "Old password incorrect."}), 401
        
        # Update to new password
        new_hashed_password = bcrypt.generate_password_hash(passwords.new_password).decode('utf-8')
        user.hashed_password = new_hashed_password
        db.commit()
        return jsonify({"message": "Password updated successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()


@app.route("/api/classes", methods=["POST"])
@jwt_required()
def create_class():
    current_user_id = get_jwt_identity()
    data = request.json
    try:
        class_data = ClassCreate.model_validate(data)
    except Exception as e:
        return jsonify({"detail": f"Invalid data: {e}"}), 422

    db = SessionLocal()
    try:
        new_class = ClassModel(
            title=class_data.title,
            user_id=current_user_id
        )
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        return jsonify(ClassSchema.model_validate(new_class).model_dump()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/classes", methods=["GET"])
@jwt_required()
def get_classes():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        
        classes = db.query(ClassModel).filter(
            ClassModel.user_id == current_user_id
        ).options(
            joinedload(ClassModel.lectures),
            joinedload(ClassModel.external_notes)
        ).order_by(ClassModel.created_at.desc()).all()
        
        result = [ClassSchema.model_validate(cls).model_dump() for cls in classes]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/classes/<string:class_id>", methods=["PUT"])
@jwt_required()
def update_class(class_id):
    current_user_id = get_jwt_identity()
    data = request.json
    try:
        class_data = ClassCreate.model_validate(data)
    except Exception as e:
        return jsonify({"detail": f"Invalid data: {e}"}), 422

    db = SessionLocal()
    try:
        db_class = db.query(ClassModel).filter_by(
            id=class_id, 
            user_id=current_user_id
        ).first()
        
        if not db_class:
            return jsonify({"detail": "Class not found or not authorized."}), 404
        
        db_class.title = class_data.title
        db.commit()
        db.refresh(db_class)
        return jsonify(ClassSchema.model_validate(db_class).model_dump()), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/classes/<string:class_id>", methods=["DELETE"])
@jwt_required()
def delete_class(class_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        db_class = db.query(ClassModel).filter_by(
            id=class_id, 
            user_id=current_user_id
        ).first()
        
        if not db_class:
            return jsonify({"detail": "Class not found or not authorized."}), 404
        
        db.delete(db_class)
        db.commit()
        return jsonify({"message": "Class deleted successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()


@app.route("/api/lectures", methods=["POST"])
@jwt_required()
def upload_lecture():
    current_user_id = get_jwt_identity()
    data = request.json
    try:
        
        lecture_data = LectureCreate.model_validate(data)
    except Exception as e:
        return jsonify({"detail": f"Invalid data: {e}"}), 422

    db = SessionLocal()
    try:
        
        auth_check = db.query(ClassModel).filter_by(
            id=str(lecture_data.class_id), 
            user_id=current_user_id
        ).first()
        if not auth_check:
            return jsonify({"detail": "Class not found or not authorized."}), 403

        lecture = LectureModel(
            title=lecture_data.title,
            transcript=lecture_data.transcript,
            class_id=lecture_data.class_id 
        )
        db.add(lecture)
        db.commit()
        db.refresh(lecture)
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/lectures/upload-audio", methods=["POST"])
@jwt_required()
def upload_audio_lecture():
    current_user_id = get_jwt_identity()
    if 'media' not in request.files:
        return jsonify({"detail": "No audio file ('media') provided."}), 400
    if 'title' not in request.form:
        return jsonify({"detail": "No 'title' provided."}), 400
    if 'language' not in request.form:
        return jsonify({"detail": "No 'language' selected."}), 400
    
    if 'class_id' not in request.form:
        return jsonify({"detail": "No 'class_id' provided."}), 400

    file_storage = request.files['media']
    title = request.form['title']
    language = request.form['language']
    class_id = request.form['class_id']
    
    if file_storage.filename == '':
        return jsonify({"detail": "No selected file."}), 400
    if language not in ALLOWED_LANGUAGES:
        return jsonify({"detail": f"Invalid language. Must be one of: {ALLOWED_LANGUAGES}"}), 400
    
    os.makedirs(TEMP_FOLDER, exist_ok=True) 
    safe_name = secure_filename(file_storage.filename)
    file_path = os.path.join(TEMP_FOLDER, f"{uuid.uuid4()}_{safe_name}")
    file_storage.save(file_path)
    print(f"File saved temporarily to: {file_path}")

    db = SessionLocal()
    try:
        
        auth_check = db.query(ClassModel).filter_by(
            id=class_id, 
            user_id=current_user_id
        ).first()
        if not auth_check:
            return jsonify({"detail": "Class not found or not authorized."}), 403

        print(f"Transcribing file from path: {file_path}")
        transcript_text = transcribe_audio(file_path, language)
        lecture = LectureModel(
            title=title,
            transcript=transcript_text,
            class_id=class_id 
        )
        db.add(lecture)
        db.commit()
        db.refresh(lecture)
        
        print("Successfully created lecture from audio.")
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {str(e)}"}), 500
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Temporary file deleted: {file_path}")
        db.close()

@app.route("/api/lectures/<string:lecture_id>", methods=["GET"])
@jwt_required()
def get_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        
        lecture = db.query(LectureModel).filter(
            LectureModel.id == lecture_id
        ).join(ClassModel).filter(
            ClassModel.user_id == current_user_id
        ).first()
        
        if not lecture:
            return jsonify({"detail": "Lecture not found or not authorized."}), 404
            
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 200
    finally:
        db.close()

@app.route("/api/lectures/<string:lecture_id>", methods=["PUT"])
@jwt_required()
def update_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    data = request.json
    if 'title' not in data and 'transcript' not in data:
        return jsonify({"detail": "No 'title' or 'transcript' provided."}), 422

    db = SessionLocal()
    try:
        
        lecture = db.query(LectureModel).filter(
            LectureModel.id == lecture_id
        ).join(ClassModel).filter(
            ClassModel.user_id == current_user_id
        ).first()
        
        if not lecture:
            return jsonify({"detail": "Lecture not found or not authorized."}), 404
            
        if 'title' in data:
            lecture.title = data['title']
        if 'transcript' in data:
            lecture.transcript = data['transcript']
            
        db.commit()
        db.refresh(lecture)
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/lectures/<string:lecture_id>", methods=["DELETE"])
@jwt_required()
def delete_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter(
            LectureModel.id == lecture_id
        ).join(ClassModel).filter(
            ClassModel.user_id == current_user_id
        ).first()
        
        if not lecture:
            return jsonify({"detail": "Lecture not found or not authorized."}), 404
            
        db.delete(lecture)
        db.commit()
        return jsonify({"message": "Lecture deleted successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

def get_lecture_for_user(db: Session, lecture_id: str, user_id: str):
    lecture = db.query(LectureModel).filter(
        LectureModel.id == lecture_id
    ).join(ClassModel).filter(
        ClassModel.user_id == user_id
    ).first()
    return lecture

def parse_due_date(date_string: str | None) -> datetime | None:
    if not date_string:
        return None
    try:
        return date_parse(date_string)
    except (ValueError, TypeError):
        print(f"Warning: Could not parse date string: {date_string}")
        return None

@app.route("/api/lectures/<string:lecture_id>/analyze", methods=["POST"])
@jwt_required()
def run_analysis(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        lecture = get_lecture_for_user(db, lecture_id, current_user_id)
        if not lecture:
            return jsonify({"detail": "Lecture not found or not authorized."}), 404
        
        print(f"Analyzing transcript for lecture: {lecture.title}")
        analysis_data = analyze_transcript(lecture.transcript)
        summary_text = analysis_data.get("summary")
        action_items_list = analysis_data.get("action_items")

        if summary_text is None or action_items_list is None:
             return jsonify({"detail": "AI analysis failed to return valid data."}), 500
        
        lecture.summary = summary_text
        db.query(ActionItemModel).filter_by(lecture_id=lecture_id).delete()
        
        
        new_items_to_return = []
        if action_items_list:
            for item in action_items_list:
                if isinstance(item, dict) and 'type' in item and 'content' in item:
                    ai_date_string = item.get('due_date')
                    parsed_datetime_obj = parse_due_date(ai_date_string)
                    new_action_item = ActionItemModel(
                        type=item['type'],
                        content=item['content'],
                        lecture_id=lecture_id,
                        user_id=current_user_id,
                        due_date=parsed_datetime_obj
                    )
                    db.add(new_action_item)
                    new_items_to_return.append(new_action_item)
        db.commit()
        db.refresh(lecture)
        for item in new_items_to_return:
             db.refresh(item) 
        print("Analysis successful. Summary and action items saved.")
        
        return jsonify({
            "lecture": LectureSchema.model_validate(lecture).model_dump(),
            "action_items": [ActionItemSchema.model_validate(item).model_dump() for item in new_items_to_return]
        }), 200
        
    except Exception as e:
        db.rollback()
        print(f"Error during analysis: {e}")
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/lectures/<string:lecture_id>/start-chat", methods=["POST"])
@jwt_required()
def start_chat_from_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        
        lecture = get_lecture_for_user(db, lecture_id, current_user_id)
        if not lecture:
            return jsonify({"detail": "Lecture not found or not authorized."}), 404
        
        session = ChatSessionModel(
            title=f"Chat about {lecture.title}", 
            user_id=current_user_id,
            lecture_id=lecture.id
        )
        db.add(session)
        db.flush()
        chat_session_id = session.id 
        
        system_msg = MessageModel(chat_session_id=chat_session_id, role="system", content=SYSTEM_PROMPT)
        user_msg_content = f"Here is the lecture transcript. Please begin:\n\n{lecture.transcript}"
        user_msg = MessageModel(chat_session_id=chat_session_id, role="user", content=user_msg_content)
        
        initial_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg_content}
        ]
        ai_response_content = get_socratic_response(initial_messages)
        ai_msg = MessageModel(chat_session_id=chat_session_id, role="assistant", content=ai_response_content)
        
        db.add(system_msg)
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()
        return jsonify({
            "chat_session_id": chat_session_id,
            "first_question": ai_response_content
        })

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/user/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    db = SessionLocal()
    try:
        current_user_id = get_jwt_identity()
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        
        if not user:
            return jsonify({"detail": "User not found"}), 404
        
        return jsonify({
            "username": user.username,
            "email": user.email,
            "has_password": user.hashed_password is not None
        }), 200
    
    except Exception as e:
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/user/profile", methods=["PUT"])
@jwt_required()
def update_user_profile():
    db = SessionLocal()
    try:
        current_user_id = get_jwt_identity()
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        
        if not user:
            return jsonify({"detail": "User not found"}), 404
        
        data = request.json
        username = data.get('username')
        email = data.get('email')
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        # Update username if provided and different
        if username and username != user.username:
            # Check if username already exists
            existing_user = db.query(UserModel).filter_by(username=username).first()
            if existing_user:
                return jsonify({"detail": "Username already taken"}), 400
            user.username = username
        
        # Update email if provided and different
        if email and email != user.email:
            # Check if email already exists
            existing_user = db.query(UserModel).filter_by(email=email).first()
            if existing_user:
                return jsonify({"detail": "Email already registered"}), 400
            user.email = email
        
        # Update password if both current and new password provided
        if current_password and new_password:
            if not bcrypt.check_password_hash(user.hashed_password, current_password):
                return jsonify({"detail": "Current password is incorrect"}), 400
            user.hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        
        db.commit()
        
        return jsonify({
            "message": "Profile updated successfully",
            "username": user.username,
            "email": user.email
        }), 200
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/chat", methods=["POST"])
@jwt_required()
def chat():
    try:
        current_user_id = get_jwt_identity() 
        data = request.json
        
        chat_session_id = data.get('chat_session_id') 
        user_message_content = data.get('message')
        
        if not user_message_content:
            return jsonify({"detail": "Message is required"}), 422
        
        
        if chat_session_id and not isinstance(chat_session_id, str):
             chat_session_id = None
            
    except Exception as e:
        return jsonify({"detail": f"Invalid request body: {e}"}), 422

    db = SessionLocal()
    try:
        if not chat_session_id:
            session = ChatSessionModel(
                title="Chat Session",
                user_id=current_user_id
            )
            db.add(session)
            db.flush()
            chat_session_id = session.id
            system_msg = MessageModel(chat_session_id=chat_session_id, role="system", content=SYSTEM_PROMPT)
            db.add(system_msg)
            message_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        else:
            session = db.query(ChatSessionModel).filter_by(
                id=chat_session_id, 
                user_id=current_user_id
            ).first()

            if not session:
                return jsonify({"detail": "Chat session not found or not authorized."}), 404
            messages_db = db.query(MessageModel).filter(
                MessageModel.chat_session_id == chat_session_id
            ).order_by(MessageModel.created_at).all()
            
            message_history = [{"role": msg.role, "content": msg.content} for msg in messages_db]
        
        message_history.append({"role": "user", "content": user_message_content})
        ai_response_content = get_socratic_response(message_history)
        user_msg = MessageModel(chat_session_id=chat_session_id, role="user", content=user_message_content)
        ai_msg = MessageModel(chat_session_id=chat_session_id, role="assistant", content=ai_response_content)
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()

        return jsonify({
            "response": ai_response_content,
            "chat_session_id": chat_session_id
        })
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Database error or AI error: {e}"}), 500
    finally:
        db.close()


@app.route("/api/action_items", methods=["GET"])
@jwt_required()
def get_action_items():
    current_user_id = get_jwt_identity() 
    db = SessionLocal()
    try:
        items = db.query(ActionItemModel).filter(
            ActionItemModel.user_id == current_user_id
        ).order_by(ActionItemModel.created_at.desc()).all()
        result = [ActionItemSchema.model_validate(item).model_dump() for item in items]
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error getting action items: {e}")
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/action_items/<string:item_id>", methods=["PUT"])
@jwt_required()
def update_action_item(item_id):
    current_user_id = get_jwt_identity()
    data = request.json
    
    db = SessionLocal()
    try:
        item = db.query(ActionItemModel).filter_by(
            id=item_id, 
            user_id=current_user_id
        ).first()
        if not item:
            return jsonify({"detail": "Action item not found or not authorized."}), 404
            
        if 'content' in data:
            item.content = data['content']
        if 'type' in data:
            item.type = data['type']
        if 'due_date' in data:
            item.due_date = data['due_date'] 
            
        db.commit()
        db.refresh(item)
        return jsonify(ActionItemSchema.model_validate(item).model_dump()), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/action_items/<string:item_id>", methods=["DELETE"])
@jwt_required()
def delete_action_item(item_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        item = db.query(ActionItemModel).filter_by(
            id=item_id, 
            user_id=current_user_id
        ).first()
        if not item:
            return jsonify({"detail": "Action item not found or not authorized."}), 404
            
        db.delete(item)
        db.commit()
        return jsonify({"message": "Action item deleted."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/action_items/<string:item_id>/notebook", methods=["GET"])
@jwt_required()
def get_or_create_notebook(item_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        action_item = db.query(ActionItemModel).filter_by(
            id=item_id, 
            user_id=current_user_id
        ).first()

        if not action_item:
            return jsonify({"detail": "Action item not found or not authorized."}), 404
        
        notebook = db.query(NotebookPageModel).filter_by(action_item_id=item_id).first()
        
        if notebook:
            return jsonify(NotebookPageSchema.model_validate(notebook).model_dump()), 200
        
        new_notebook = NotebookPageModel(
            action_item_id=item_id,
            content=""
        )
        db.add(new_notebook)
        db.commit()
        db.refresh(new_notebook)
        
        return jsonify(NotebookPageSchema.model_validate(new_notebook).model_dump()), 201

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/notebook_pages/<string:notebook_id>", methods=["PUT"])
@jwt_required()
def update_notebook(notebook_id):
    current_user_id = get_jwt_identity()
    data = request.json
    if 'content' not in data:
        return jsonify({"detail": "No 'content' provided."}), 422
    db = SessionLocal()
    try:
        notebook = db.query(NotebookPageModel).filter(
            NotebookPageModel.id == notebook_id
        ).join(ActionItemModel).filter(
            ActionItemModel.user_id == current_user_id
        ).first()
        
        if not notebook:
            return jsonify({"detail": "Notebook not found or not authorized."}), 404
        notebook.content = data['content']
        db.commit()
        db.refresh(notebook)
        return jsonify(NotebookPageSchema.model_validate(notebook).model_dump()), 200

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/external-notes", methods=["POST"])
@jwt_required()
def create_external_note():
    current_user_id = get_jwt_identity()
    data = request.json
    try:
        note_data = ExternalNoteCreate.model_validate(data)
    except Exception as e:
        return jsonify({"detail": f"Invalid data: {e}"}), 422
    
    if not note_data.class_id and not note_data.lecture_id:
        return jsonify({"detail": "Either class_id or lecture_id must be provided."}), 422

    db = SessionLocal()
    try:
        if note_data.class_id:
            parent = db.query(ClassModel).filter_by(id=str(note_data.class_id), user_id=current_user_id).first()
            if not parent:
                 return jsonify({"detail": "Class not found or not authorized."}), 404
        if note_data.lecture_id:
            parent = get_lecture_for_user(db, note_data.lecture_id, current_user_id)
            if not parent:
                 return jsonify({"detail": "Lecture not found or not authorized."}), 404
        new_note = ExternalNoteModel(
            title=note_data.title,
            url=note_data.url,
            type=note_data.type,
            user_id=current_user_id,
            class_id=note_data.class_id,
            lecture_id=note_data.lecture_id
        )
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        return jsonify(ExternalNoteSchema.model_validate(new_note).model_dump()), 201
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/external-notes/<string:note_id>", methods=["PUT"])
@jwt_required()
def update_external_note(note_id):
    current_user_id = get_jwt_identity()
    data = request.json
    if 'title' not in data and 'url' not in data:
         return jsonify({"detail": "No 'title' or 'url' provided."}), 422

    db = SessionLocal()
    try:
        note = db.query(ExternalNoteModel).filter_by(
            id=note_id, 
            user_id=current_user_id
        ).first()
        if not note:
            return jsonify({"detail": "Note not found or not authorized."}), 404
            
        if 'title' in data:
            note.title = data['title']
        if 'url' in data:
            note.url = data['url']
            
        db.commit()
        db.refresh(note)
        return jsonify(ExternalNoteSchema.model_validate(note).model_dump()), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/external-notes/<string:note_id>", methods=["DELETE"])
@jwt_required()
def delete_external_note(note_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        note = db.query(ExternalNoteModel).filter_by(
            id=note_id, 
            user_id=current_user_id
        ).first()
        if not note:
            return jsonify({"detail": "Note not found or not authorized."}), 404
            
        db.delete(note)
        db.commit()
        return jsonify({"message": "Note deleted."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True, port=8000)