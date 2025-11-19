from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import bcrypt
from app.core.database import SessionLocal
from app.models.models import User as UserModel
from app.schemas.schemas import UserUpdateUsername, UserUpdateEmail, UserUpdatePassword

users_bp = Blueprint('users', __name__)

@users_bp.route("/username", methods=["PATCH"])
@jwt_required()
def update_username():
    current_user_id = get_jwt_identity()
    try:
        # Validate Schema
        data = UserUpdateUsername.model_validate(request.json)
    except Exception as e:
        return jsonify({"detail": str(e)}), 422

    db = SessionLocal()
    try:
        if db.query(UserModel).filter(UserModel.username == data.username).first():
            return jsonify({"detail": "Username already taken."}), 400
        
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        if not user:
            return jsonify({"detail": "User not found."}), 404
            
        user.username = data.username
        db.commit()
        return jsonify({"message": "Username updated successfully."}), 200
    finally:
        db.close()

@users_bp.route("/email", methods=["PATCH"])
@jwt_required()
def update_email():
    current_user_id = get_jwt_identity()
    try:
        data = UserUpdateEmail.model_validate(request.json)
    except Exception as e:
        return jsonify({"detail": str(e)}), 422

    db = SessionLocal()
    try:
        if db.query(UserModel).filter(UserModel.email == data.email).first():
            return jsonify({"detail": "Email already registered."}), 400
        
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        user.email = data.email
        db.commit()
        return jsonify({"message": "Email updated successfully."}), 200
    finally:
        db.close()

@users_bp.route("/password", methods=["PUT"])
@jwt_required()
def update_password():
    current_user_id = get_jwt_identity()
    try:
        data = UserUpdatePassword.model_validate(request.json)
    except Exception as e:
        return jsonify({"detail": str(e)}), 422

    db = SessionLocal()
    try:
        user = db.query(UserModel).filter_by(id=current_user_id).first()
        
        if not user or not user.hashed_password:
            return jsonify({"detail": "User cannot change password."}), 404

        if not bcrypt.check_password_hash(user.hashed_password, data.old_password):
            return jsonify({"detail": "Old password incorrect."}), 401
        
        user.hashed_password = bcrypt.generate_password_hash(data.new_password).decode('utf-8')
        db.commit()
        return jsonify({"message": "Password updated successfully."}), 200
    finally:
        db.close()