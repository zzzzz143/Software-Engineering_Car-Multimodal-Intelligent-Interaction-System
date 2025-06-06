import jwt
from flask import request, jsonify
from functools import wraps
from datetime import datetime, timezone
from ..extensions import db
from ..models import User
from ..config import Config

# JWT验证装饰器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            data = jwt.decode(token.split()[1], Config.SECRET_KEY, algorithms=["HS256"], options={'verify_exp': True})
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                raise Exception('用户不存在')
        except jwt.ExpiredSignatureError:
            current_user.status = 'offline'
            db.session.commit()
            return jsonify({'error': '令牌已过期'}), 401
        except Exception as e:
            return jsonify({'error': 'Token无效'}), 401
        return f(current_user, *args, **kwargs)
    return decorated