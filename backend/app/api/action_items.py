from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import SessionLocal
from app.models.models import ActionItem as ActionItemModel, NotebookPage as NotebookPageModel
from app.schemas.schemas import ActionItem as ActionItemSchema, NotebookPage as NotebookPageSchema

action_items_bp = Blueprint('action_items', __name__)

@action_items_bp.route("", methods=["GET"])
@jwt_required()
def get_action_items():
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        items = db.query(ActionItemModel).filter_by(user_id=current_user_id)\
            .order_by(ActionItemModel.created_at.desc()).all()
        return jsonify([ActionItemSchema.model_validate(i).model_dump() for i in items]), 200
    finally:
        db.close()

@action_items_bp.route("/<string:item_id>", methods=["PUT"])
@jwt_required()
def update_action_item(item_id):
    current_user_id = get_jwt_identity()
    data = request.json
    db = SessionLocal()
    try:
        item = db.query(ActionItemModel).filter_by(id=item_id, user_id=current_user_id).first()
        if not item:
            return jsonify({"detail": "Item not found."}), 404
            
        if 'content' in data: item.content = data['content']
        if 'type' in data: item.type = data['type']
        if 'due_date' in data: item.due_date = data['due_date']
            
        db.commit()
        db.refresh(item)
        return jsonify(ActionItemSchema.model_validate(item).model_dump()), 200
    finally:
        db.close()

@action_items_bp.route("/<string:item_id>", methods=["DELETE"])
@jwt_required()
def delete_action_item(item_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        item = db.query(ActionItemModel).filter_by(id=item_id, user_id=current_user_id).first()
        if not item: return jsonify({"detail": "Item not found."}), 404
        db.delete(item)
        db.commit()
        return jsonify({"message": "Item deleted."}), 200
    finally:
        db.close()

@action_items_bp.route("/<string:item_id>/notebook", methods=["GET"])
@jwt_required()
def get_or_create_notebook(item_id):
    current_user_id = get_jwt_identity()
    db = SessionLocal()
    try:
        if not db.query(ActionItemModel).filter_by(id=item_id, user_id=current_user_id).first():
            return jsonify({"detail": "Action Item not found."}), 404
        
        notebook = db.query(NotebookPageModel).filter_by(action_item_id=item_id).first()
        if notebook:
            return jsonify(NotebookPageSchema.model_validate(notebook).model_dump()), 200
        
        new_notebook = NotebookPageModel(action_item_id=item_id, content="")
        db.add(new_notebook)
        db.commit()
        db.refresh(new_notebook)
        return jsonify(NotebookPageSchema.model_validate(new_notebook).model_dump()), 201
    finally:
        db.close()

# changed api: /api/action_items/notebooks/<id>
@action_items_bp.route("/notebooks/<string:notebook_id>", methods=["PUT"])
@jwt_required()
def update_notebook(notebook_id):
    current_user_id = get_jwt_identity()
    data = request.json
    if 'content' not in data:
        return jsonify({"detail": "No content provided"}), 422

    db = SessionLocal()
    try:
        notebook = db.query(NotebookPageModel).filter(NotebookPageModel.id == notebook_id)\
            .join(ActionItemModel).filter(ActionItemModel.user_id == current_user_id).first()
        
        if not notebook:
            return jsonify({"detail": "Notebook not found."}), 404
            
        notebook.content = data['content']
        db.commit()
        db.refresh(notebook)
        return jsonify(NotebookPageSchema.model_validate(notebook).model_dump()), 200
    finally:
        db.close()