from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from ..extensions import db
from ..models import User, PublicUser
from ..utils.decorators import token_required

admin_bp = Blueprint('admin', __name__)

# 管理员用户管理路由(获取用户信息、添加用户)
@admin_bp.route('/api/admin/users', methods=['GET', 'POST'])
@token_required
def admin_users(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403
    
    if request.method == 'GET':
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'role': u.role,
            'type': u.type,
            'status': u.status,
            'last_login': u.last_login.isoformat() if u.last_login else None
        } for u in users])
    
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = '123456'
        role = data.get('role')
        
        if User.query.filter_by(username=username).first():
            return jsonify({'error': '用户名已存在'}), 400
        
        if role in ['admin', 'maintenance']:
            user_type = 'privileged'
            try:
                user = User(
                    username=username, 
                    password_hash=generate_password_hash(password),
                    role=role, 
                    type=user_type
                )
                db.session.add(user)
                db.session.commit()
                return jsonify({'message': '注册成功'}), 201
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': f'数据库操作失败: {str(e)}'}), 500
        else:
            user_type = 'normal'
            try:
                user = User(
                    username=username, 
                    password_hash=generate_password_hash(password),
                    role=role, 
                    type=user_type
                )
                db.session.add(user)
                db.session.commit()
                
                publicUser = PublicUser(
                    id=user.id
                )
                db.session.add(publicUser)
                db.session.commit()
                return jsonify({'message': '用户添加成功'}), 201
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': f'数据库操作失败: {str(e)}'}), 500

# 管理员用户管理路由(更新用户信息、删除用户)
@admin_bp.route('/api/admin/manage_user/<int:id>', methods=['PUT', 'DELETE'])
@token_required
def manage_user(current_user, id):
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403
    
    user = User.query.get(id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    if request.method == 'PUT':
        data = request.get_json()
        new_username = data.get('username')
        new_type = data.get('type')
        
        # 检查用户名是否已存在
        if User.query.filter_by(username=new_username).first():
            return jsonify({'error': '用户名已存在'}), 400
        
        try:
            user.username = new_username
            user.type = new_type
            db.session.commit()
            return jsonify({'message': '用户信息更新成功'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'更新失败: {str(e)}'}), 500
    
    if request.method == 'DELETE':
        try:
            if user.publicUser:
                db.session.delete(user.publicUser)
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': '用户删除成功'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'删除失败: {str(e)}'}), 500