from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import SessionLocal
from app.models.models import Lecture as LectureModel, Class as ClassModel, ActionItem as ActionItemModel
from app.schemas.schemas import Lecture as LectureSchema, ActionItem as ActionItemSchema
from app.services.storage import StorageService
from app.services.ai_client import AIService
from dateutil.parser import parse as date_parse

lectures_bp = Blueprint('lectures', __name__)

@lectures_bp.route("/upload-audio", methods=["POST"])
@jwt_required()
def upload_audio_lecture():
    current_user_id = get_jwt_identity()
    
    if 'media' not in request.files or 'class_id' not in request.form:
        return jsonify({"detail": "Missing file or class_id"}), 400
        
    file = request.files['media']
    class_id = request.form['class_id']
    language = request.form.get('language', 'ko-KR')
    title = request.form.get('title', file.filename)

    db = SessionLocal()
    try:
        if not db.query(ClassModel).filter_by(id=class_id, user_id=current_user_id).first():
            return jsonify({"detail": "Class not found or unauthorized"}), 403

        storage = StorageService()
        object_key = storage.upload_file(file, file.filename)

        AIService.transcribe_audio(object_key, language)

        lecture = LectureModel(
            title=title, 
            transcript="", 
            summary=None,
            status="PROCESSING", 
            object_key=object_key,
            class_id=class_id
        )
        
        db.add(lecture)
        db.commit()
        db.refresh(lecture)

        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 202

    except Exception as e:
        db.rollback()
        return jsonify({"detail": str(e)}), 500
    finally:
        db.close()

@lectures_bp.route("/upload-text", methods=["POST"])
@jwt_required()
def upload_text_lecture():
    current_user_id = get_jwt_identity()
    
    if 'file' not in request.files or 'class_id' not in request.form:
        return jsonify({"detail": "Missing file or class_id"}), 400

    file = request.files['file']
    class_id = request.form['class_id']
    title = request.form.get('title', file.filename)
    
    try:
        content = file.read().decode('utf-8')
    except Exception:
        return jsonify({"detail": "Invalid text file encoding. Please use UTF-8."}), 400

    db = SessionLocal()
    try:
        if not db.query(ClassModel).filter_by(id=class_id, user_id=current_user_id).first():
            return jsonify({"detail": "Class not found or unauthorized"}), 403

        lecture = LectureModel(
            title=title,
            transcript=content,
            summary=None,
            status="COMPLETED",
            class_id=class_id
        )
        
        db.add(lecture)
        db.commit()
        db.refresh(lecture)
        
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 201
    finally:
        db.close()

@lectures_bp.route("/<string:lecture_id>", methods=["GET"])
@jwt_required()
def get_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter(LectureModel.id == lecture_id)\
            .join(ClassModel).filter(ClassModel.user_id == current_user_id).first()
            
        if not lecture:
            return jsonify({"detail": "Lecture not found"}), 404
            
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 200
    finally:
        db.close()

@lectures_bp.route("/<string:lecture_id>/status", methods=["GET"])
@jwt_required()
def check_lecture_status(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter(LectureModel.id == lecture_id).first()
        
        if not lecture:
            return jsonify({"detail": "Lecture not found"}), 404
            
        if lecture.status == "PROCESSING":
            transcript = AIService.check_transcription_result(lecture.object_key)
            if transcript:
                lecture.transcript = transcript
                lecture.status = "COMPLETED"
                db.commit()
                db.refresh(lecture)
        
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 200
    finally:
        db.close()

@lectures_bp.route("/<string:lecture_id>", methods=["PUT"])
@jwt_required()
def update_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    data = request.json
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter(LectureModel.id == lecture_id)\
            .join(ClassModel).filter(ClassModel.user_id == current_user_id).first()
            
        if not lecture:
            return jsonify({"detail": "Lecture not found"}), 404
            
        if 'title' in data: lecture.title = data['title']
        if 'transcript' in data: lecture.transcript = data['transcript']
        
        db.commit()
        db.refresh(lecture)
        return jsonify(LectureSchema.model_validate(lecture).model_dump()), 200
    finally:
        db.close()

@lectures_bp.route("/<string:lecture_id>", methods=["DELETE"])
@jwt_required()
def delete_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter(LectureModel.id == lecture_id)\
            .join(ClassModel).filter(ClassModel.user_id == current_user_id).first()
            
        if not lecture:
            return jsonify({"detail": "Lecture not found"}), 404
            
        db.delete(lecture)
        db.commit()
        return jsonify({"message": "Lecture deleted"}), 200
    finally:
        db.close()

@lectures_bp.route("/<string:lecture_id>/analyze", methods=["POST"])
@jwt_required()
def analyze_lecture(lecture_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        lecture = db.query(LectureModel).filter(LectureModel.id == lecture_id)\
            .join(ClassModel).filter(ClassModel.user_id == current_user_id).first()
            
        if not lecture:
            return jsonify({"detail": "Lecture not found"}), 404

        if not lecture.transcript:
             return jsonify({"detail": "Transcript not ready or empty"}), 400

        analysis = AIService.analyze_transcript(lecture.transcript)
        lecture.summary = analysis.get("summary", "")
        
        db.query(ActionItemModel).filter_by(lecture_id=lecture_id).delete()
        
        new_items = []
        for item in analysis.get("action_items", []):
            due_date = None
            if item.get('due_date'):
                try: due_date = date_parse(item['due_date']) 
                except: due_date = None
                    
            ai_item = ActionItemModel(
                type=item['type'], 
                content=item['content'], 
                due_date=due_date, 
                lecture_id=lecture_id, 
                user_id=current_user_id
            )
            db.add(ai_item)
            new_items.append(ai_item)
            
        db.commit()
        db.refresh(lecture)
        
        return jsonify({
            "lecture": LectureSchema.model_validate(lecture).model_dump(),
            "action_items": [ActionItemSchema.model_validate(i).model_dump() for i in new_items]
        })
    finally:
        db.close()

@lectures_bp.route("/search", methods=["GET"])
@jwt_required()
def search_lectures():
    query = request.args.get('q', '')
    if not query:
        return jsonify([]), 200

    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        results = db.query(LectureModel).join(ClassModel).filter(
            ClassModel.user_id == current_user_id,
            (LectureModel.title.ilike(f"%{query}%")) | 
            (LectureModel.transcript.ilike(f"%{query}%"))
        ).limit(20).all()
        
        return jsonify([LectureSchema.model_validate(r).model_dump() for r in results]), 200
    finally:
        db.close()