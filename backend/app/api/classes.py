from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal
from app.models.models import Class as ClassModel, Lecture, ExternalNote
from app.schemas.schemas import Class as ClassSchema, ClassCreate

classes_bp = Blueprint('classes', __name__)

@classes_bp.route("", methods=["POST"])
@jwt_required()
def create_class():
    current_user_id = get_jwt_identity()
    try:
        data = ClassCreate.model_validate(request.json)
    except Exception as e:
        return jsonify({"detail": str(e)}), 422

    db = SessionLocal()
    try:
        new_class = ClassModel(title=data.title, user_id=current_user_id)
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        return jsonify(ClassSchema.model_validate(new_class).model_dump()), 201
    finally:
        db.close()

@classes_bp.route("", methods=["GET"])
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
        
        return jsonify([ClassSchema.model_validate(c).model_dump() for c in classes]), 200
    finally:
        db.close()

@classes_bp.route("/<string:class_id>", methods=["PUT"])
@jwt_required()
def update_class(class_id):
    current_user_id = get_jwt_identity()
    try:
        data = ClassCreate.model_validate(request.json)
    except Exception as e:
        return jsonify({"detail": str(e)}), 422

    db = SessionLocal()
    try:
        db_class = db.query(ClassModel).filter_by(id=class_id, user_id=current_user_id).first()
        if not db_class:
            return jsonify({"detail": "Class not found."}), 404
        
        db_class.title = data.title
        db.commit()
        db.refresh(db_class)
        return jsonify(ClassSchema.model_validate(db_class).model_dump()), 200
    finally:
        db.close()

@classes_bp.route("/<string:class_id>", methods=["DELETE"])
@jwt_required()
def delete_class(class_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        db_class = db.query(ClassModel).filter_by(id=class_id, user_id=current_user_id).first()
        if not db_class:
            return jsonify({"detail": "Class not found."}), 404
        
        db.delete(db_class)
        db.commit()
        return jsonify({"message": "Class deleted."}), 200
    finally:
        db.close()