import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from .database import engine, SessionLocal
from .models import Base, Session as SessionModel, Message as MessageModel, User as UserModel
from .ai_client import get_socratic_response, SYSTEM_PROMPT

Base.metadata.create_all(bind=engine)
app = Flask(__name__)

origins = ["http://localhost:3000"]
CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
app.config["JWT_SECRET_KEY"] = "123456789"
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# JWT error handlers
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
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({"detail": "Invalid email or password."}), 401
    
    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/start_session", methods=["POST"])
@jwt_required()
def start_session():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.json
        transcript = data['transcript']
        title = data.get('title', 'Untitled Session')
    except Exception as e:
        return jsonify({"detail": f"Invalid request body: {e}"}), 400

    db = SessionLocal()

    try:
        session = SessionModel(
            title=title, 
            transcript=transcript, 
            user_id=current_user_id
        )
        db.add(session)
        db.flush()
        session_id = session.id
        system_msg = MessageModel(session_id=session_id, role="system", content=SYSTEM_PROMPT)
        user_msg_content = f"Here is the lecture transcript. Please begin:\n\n{transcript}"
        user_msg = MessageModel(session_id=session_id, role="user", content=user_msg_content)
        
        initial_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg_content}
        ]
        
        ai_response_content = get_socratic_response(initial_messages)
        ai_msg = MessageModel(session_id=session_id, role="assistant", content=ai_response_content)
        
        db.add(system_msg)
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()

        return jsonify({
            "session_id": session_id,
            "first_question": ai_response_content
        })

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Server error: {e}"}), 500
    finally:
        db.close()

@app.route("/api/chat", methods=["POST"])
@jwt_required()
def chat():
    print("=== CHAT ENDPOINT HIT ===")
    try:
        current_user_id = int(get_jwt_identity())
        data = request.json
        
        # Debug logging
        print(f"Received data: {data}")
        print(f"User ID: {current_user_id}")
        
        session_id = data.get('session_id')
        user_message_content = data.get('message')
        
        if not user_message_content:
            print("ERROR: No message content")
            return jsonify({"detail": "Message is required"}), 422
        
        # If session_id is a string starting with "session_" or a large number (timestamp), 
        # it's a frontend-only session - create a new backend session
        if session_id:
            if isinstance(session_id, str) and session_id.startswith('session_'):
                session_id = None
            elif isinstance(session_id, int) and session_id > 1000000000000:  # Likely a timestamp
                session_id = None
            
    except Exception as e:
        print(f"Error parsing request: {e}")
        return jsonify({"detail": f"Invalid request body: {e}"}), 422

    db = SessionLocal()
    try:
        # If no valid session_id, create a new one
        if not session_id:
            session = SessionModel(
                title="Chat Session",
                transcript="No transcript provided - general conversation",
                user_id=current_user_id
            )
            db.add(session)
            db.flush()
            session_id = session.id
            
            # Add system message
            system_msg = MessageModel(session_id=session_id, role="system", content=SYSTEM_PROMPT)
            db.add(system_msg)
            message_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        else:
            # Load existing session
            session = db.query(SessionModel).filter_by(
                id=session_id, 
                user_id=current_user_id
            ).first()

            if not session:
                return jsonify({"detail": "Session not found or not authorized."}), 404

            messages_db = db.query(MessageModel).filter(
                MessageModel.session_id == session_id
            ).order_by(MessageModel.created_at).all()
            
            message_history = [{"role": msg.role, "content": msg.content} for msg in messages_db]
        
        # Add user message to history
        message_history.append({"role": "user", "content": user_message_content})

        ai_response_content = get_socratic_response(message_history)
        
        user_msg = MessageModel(session_id=session_id, role="user", content=user_message_content)
        ai_msg = MessageModel(session_id=session_id, role="assistant", content=ai_response_content)
        
        db.add(user_msg)
        db.add(ai_msg)
        db.commit()

        return jsonify({
            "response": ai_response_content,
            "session_id": session_id
        })

    except Exception as e:
        db.rollback()
        return jsonify({"detail": f"Database error or AI error: {e}"}), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True, port=8000)