from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import SessionLocal
from app.core.config import Config
from app.models.models import GeneralChatSession, GeneralMessage, SocraticChatSession, SocraticMessage, Lecture
from app.services.ai_client import AIService

chat_bp = Blueprint('chat', __name__)

@chat_bp.route("/general", methods=["POST"])
@jwt_required()
def chat_general():
    user_id = get_jwt_identity()
    data = request.json
    session_id = data.get('session_id')
    user_msg = data.get('message')

    db = SessionLocal()
    try:
        if not session_id:
            session = GeneralChatSession(user_id=user_id, title="General Chat")
            db.add(session)
            db.flush()
            session_id = session.id
        else:
            session = db.query(GeneralChatSession).filter_by(id=session_id, user_id=user_id).first()
            if not session: return jsonify({"detail": "Session not found"}), 404

        history = [{"role": "system", "content": Config.GENERAL_PROMPT}]

        msgs = db.query(GeneralMessage).filter_by(session_id=session_id)\
            .order_by(GeneralMessage.created_at.desc()).limit(10).all()
        msgs.reverse()
        
        for m in msgs:
            history.append({"role": m.role, "content": m.content})

        history.append({"role": "user", "content": user_msg})
        ai_text = AIService.get_socratic_response(history)
        db.add(GeneralMessage(session_id=session_id, role="user", content=user_msg))
        db.add(GeneralMessage(session_id=session_id, role="assistant", content=ai_text))
        db.commit()

        return jsonify({"response": ai_text, "session_id": session_id})
    finally:
        db.close()

@chat_bp.route("/socratic", methods=["POST"])
@jwt_required()
def chat_socratic():
    user_id = get_jwt_identity()
    data = request.json
    session_id = data.get('session_id')
    user_msg = data.get('message')
    lecture_id = data.get('lecture_id')

    db = SessionLocal()
    try:
        if not session_id:
            if not lecture_id:
                return jsonify({"detail": "Lecture ID required for new Socratic session"}), 400
                
            session = SocraticChatSession(user_id=user_id, lecture_id=lecture_id)
            db.add(session)
            db.flush()
            session_id = session.id
        else:
            session = db.query(SocraticChatSession).filter_by(id=session_id, user_id=user_id).first()
            if not session: return jsonify({"detail": "Session not found"}), 404
        
        system_content = Config.SOCRATIC_PROMPT
        if session.lecture_id:
            lecture = db.query(Lecture).filter_by(id=session.lecture_id).first()
            if lecture and lecture.summary:
                system_content += f"\n\n[CONTEXT FROM LECTURE]\n{lecture.summary}\n\nStart by asking a question about this."

        history = [{"role": "system", "content": system_content}]
        msgs = db.query(SocraticMessage).filter_by(session_id=session_id)\
            .order_by(SocraticMessage.created_at.desc()).limit(10).all()
        msgs.reverse()
        
        for m in msgs:
            history.append({"role": m.role, "content": m.content})

        history.append({"role": "user", "content": user_msg})
        ai_text = AIService.get_socratic_response(history)
        db.add(SocraticMessage(session_id=session_id, role="user", content=user_msg))
        db.add(SocraticMessage(session_id=session_id, role="assistant", content=ai_text))
        db.commit()

        return jsonify({"response": ai_text, "session_id": session_id})
    finally:
        db.close()