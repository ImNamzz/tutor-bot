from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import SessionLocal
from app.core.config import Config
from app.models.models import ChatSession, Message, Lecture, Class
from app.services.ai_client import AIService

chat_bp = Blueprint('chat', __name__)

@chat_bp.route("", methods=["POST"])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    data = request.json
    session_id = data.get('chat_session_id')
    user_msg = data.get('message')

    db = SessionLocal()
    try:
        if not session_id:
            session = ChatSession(title="New Chat", user_id=user_id)
            db.add(session)
            db.flush()
            session_id = session.id
            db.add(Message(chat_session_id=session_id, role="system", content=Config.SYSTEM_PROMPT))
            history = [{"role": "system", "content": Config.SYSTEM_PROMPT}]
        else:
            session = db.query(ChatSession).filter_by(id=session_id, user_id=user_id).first()
            if not session: return jsonify({"detail": "Session not found"}), 404
            msgs = db.query(Message).filter_by(chat_session_id=session_id).order_by(Message.created_at).all()
            history = [{"role": m.role, "content": m.content} for m in msgs]

        history.append({"role": "user", "content": user_msg})
        ai_text = AIService.get_socratic_response(history)

        db.add(Message(chat_session_id=session_id, role="user", content=user_msg))
        db.add(Message(chat_session_id=session_id, role="assistant", content=ai_text))
        db.commit()

        return jsonify({"response": ai_text, "chat_session_id": session_id})
    finally:
        db.close()