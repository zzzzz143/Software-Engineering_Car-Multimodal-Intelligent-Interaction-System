from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone
from ..extensions import db
from ..models import User, PublicUser
from ..config import Config
from ..utils.decorators import token_required

auth_bp = Blueprint('auth', __name__)

# 注册路由
@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    # 检查用户名是否已存在
    if User.query.filter_by(username=username).first():
        return jsonify({'error': '用户名已存在'}), 400
    # 获取权限码并验证
    permission_code = data.get('Permissioncode')
    # 初始化可选角色
    allowed_roles = ['passenger', 'driver']
    # 权限码验证通过后扩展可选角色
    if permission_code and permission_code == Config.PERMISSION_CODE:
        allowed_roles += ['admin', 'maintenance']
    # 校验角色合法性
    role = data.get('role')
    if role not in allowed_roles:
        return jsonify({'error': '注册该角色需要有效权限码'}), 403
    
    if role in ['admin', 'maintenance']: # 如果是特权用户
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
            db.session.rollback() # 回滚事务
            return jsonify({'error': f'数据库操作失败: {str(e)}'}), 500
    else: # 如果是普通用户
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
                id=user.id,
                wake_word='hey siri'
            )
            db.session.add(publicUser)
            db.session.commit()
            return jsonify({'message': '注册成功'}), 201
        except Exception as e:
            db.session.rollback() # 回滚事务
            return jsonify({'error': f'数据库操作失败: {str(e)}'}), 500

# 登录路由
@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    # 检查用户名和密码
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': '用户名或密码错误'}), 401
    # 检查用户角色
    role = data.get('role')
    if user.role != role:
        return jsonify({'error': '用户角色不匹配'}), 403
    # 更新用户状态和最后登录时间
    user.status = 'online'
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()
    
    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24) # 24小时有效期
    }, Config.SECRET_KEY , algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user_info': {
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
        }
    }), 200