import os
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from .database import engine, SessionLocal
from .models import Base, ChatSession as ChatSessionModel, Message as MessageModel, User as UserModel, ActionItem as ActionItemModel, Lecture as LectureModel, NotebookPage as NotebookPageModel
from .ai_client import get_socratic_response, SYSTEM_PROMPT, extract_action_items, get_summary, transcribe_audio
from .schemas import ActionItem as ActionItemSchema, Lecture as LectureSchema, ChatSession as ChatSessionSchema, NotebookPage as NotebookPageSchema
from typing import List
from werkzeug.utils import secure_filename

Base.metadata.create_all(bind=engine)
app = Flask(__name__)

origins = ["http://localhost:3000"]
CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
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
        email = data['email']
        password = data['password']
        user = db.query(UserModel).filter_by(email=email).first()

        if user and bcrypt.check_password_hash(user.hashed_password, password):
            access_token = create_access_token(identity=str(user.id))
            print(access_token)
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({"detail": "Invalid email or password."}), 401
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/chat", methods=["POST"])
@jwt_required()
def chat():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.json
        
        chat_session_id = data.get('chat_session_id')
        user_message_content = data.get('message')
        
        if not user_message_content:
            return jsonify({"detail": "Message is required"}), 422
        if chat_session_id:
            if isinstance(chat_session_id, str) and not chat_session_id.isdigit():
                chat_session_id = None
            elif isinstance(chat_session_id, int) and chat_session_id > 1000000000000:
                chat_session_id = None
            else:
                chat_session_id = int(chat_session_id)
            
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
    current_user_id = int(get_jwt_identity())
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

@app.route("/api/lectures", methods=["POST"])
@jwt_required()
def upload_lecture():
    current_user_id = int(get_jwt_identity())
    data = request.json
    if not data.get('transcript') or not data.get('title'):
        return jsonify({"detail": "Title and transcript are required."}), 422
    db = SessionLocal()
    try:
        lecture = LectureModel(
            title=data['title'],
            transcript=data['transcript'],
            user_id=current_user_id
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
    current_user_id = int(get_jwt_identity())
    if 'media' not in request.files:
        return jsonify({"detail": "No audio file ('media') provided."}), 400
    if 'title' not in request.form:
        return jsonify({"detail": "No 'title' provided."}), 400
    if 'language' not in request.form:
        return jsonify({"detail": "No 'language' selected."}), 400
    file_storage = request.files['media']
    title = request.form['title']
    language = request.form['language']
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
        print(f"Transcribing file from path: {file_path}")
        transcript_text = transcribe_audio(file_path, language)
        lecture = LectureModel(
            title=title,
            transcript=transcript_text,
            user_id=current_user_id
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

@app.route("/api/lectures", methods=["GET"])
@jwt_required()
def get_lectures():
    current_user_id = int(get_jwt_identity())
    db = SessionLocal()
    try:
        lectures = db.query(LectureModel).filter(
            LectureModel.user_id == current_user_id
        ).order_by(LectureModel.created_at.desc()).all()
        result = [LectureSchema.model_validate(lec).model_dump() for lec in lectures]
        return jsonify(result), 200
    finally:
        db.close()

@app.route("/api/lectures/<int:lecture_id>/extract-items", methods=["POST"])
@jwt_required()
def run_action_item_extraction(lecture_id):
    current_user_id = int(get_jwt_identity())
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter_by(
            id=lecture_id, 
            user_id=current_user_id
        ).first()

        if not lecture:
            return jsonify({"detail": "Lecture not found or not authorized."}), 404
        db.query(ActionItemModel).filter_by(lecture_id=lecture_id).delete()
        action_items_list = extract_action_items(lecture.transcript)
        new_items = []
        
        if action_items_list:
            for item in action_items_list:
                if isinstance(item, dict) and 'type' in item and 'content' in item:
                    new_action_item = ActionItemModel(
                        type=item['type'],
                        content=item['content'],
                        lecture_id=lecture_id,
                        user_id=current_user_id
                    )
                    db.add(new_action_item)
                    new_items.append(new_action_item)
        db.commit()
        return jsonify([ActionItemSchema.model_validate(item).model_dump() for item in new_items]), 201
        
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/lectures/<int:lecture_id>/summarize", methods=["POST"])
@jwt_required()
def run_summarization(lecture_id):
    current_user_id = int(get_jwt_identity())
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter_by(
            id=lecture_id, 
            user_id=current_user_id
        ).first()

        if not lecture:
            return jsonify({"detail": "Lecture not found or not authorized."}), 404
        
        summary_text = get_summary(lecture.transcript)
        lecture.summary = summary_text
        db.commit()
        
        return jsonify({"summary": summary_text}), 200
        
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/lectures/<int:lecture_id>/start-chat", methods=["POST"])
@jwt_required()
def start_chat_from_lecture(lecture_id):
    current_user_id = int(get_jwt_identity())
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter_by(
            id=lecture_id, 
            user_id=current_user_id
        ).first()

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

@app.route("/api/action_items/<int:item_id>/notebook", methods=["GET"])
@jwt_required()
def get_or_create_notebook(item_id):
    current_user_id = int(get_jwt_identity())
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
            return jsonify(NotebookPageSchema.from_orm(notebook).dict()), 200
        new_notebook = NotebookPageModel(
            action_item_id=item_id,
            content=""
        )
        db.add(new_notebook)
        db.commit()
        db.refresh(new_notebook)
        
        return jsonify(NotebookPageSchema.from_orm(new_notebook).dict()), 201

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/notebook_pages/<int:notebook_id>", methods=["PUT"])
@jwt_required()
def update_notebook(notebook_id):
    current_user_id = int(get_jwt_identity())
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
        return jsonify(NotebookPageSchema.from_orm(notebook).dict()), 200

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True, port=8000)