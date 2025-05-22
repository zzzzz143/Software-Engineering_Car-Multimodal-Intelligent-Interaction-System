from flask import Flask, request, jsonify
import requests
import os
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from config import Config

# 初始化Flask应用
app = Flask(__name__)
app.config.from_object(Config)
MODEL_API_URL = Config.MODEL_API_URL
DASHSCOPE_API_KEY = Config.DASHSCOPE_API_KEY
CORS(app, resources={r"/*": {"origins": "*"}}) # 配置CORS支持所有域名的跨域请求

# 数据库配置
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps

app.config['SQLALCHEMY_DATABASE_URI'] = Config.DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
app.config['SECRET_KEY'] = Config.SECRET_KEY

@app.cli.command("init-db")
def init_db_command():
    """初始化数据库表结构"""
    db.create_all()
    print("数据库初始化完成")

# 添加角色权限装饰器
def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({"status": "error", "message": "需要认证"}), 401

            try:
                data = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = User.query.get(data['user_id'])
                if current_user.role != required_role:
                    return jsonify({"status": "error", "message": "权限不足"}), 403
            except Exception as e:
                return jsonify({"status": "error", "message": str(e)}), 401

            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

@app.route('/admin')
@role_required('admin')
def admin_panel():
    return jsonify({
        "status": "success",
        "message": "管理员控制面板"
    })

@app.route('/maintenance')
@role_required('maintenance')
def maintenance_tool():
    return jsonify({
        "status": "success",
        "message": "维护人员工具界面"
    })
    
# JWT验证装饰器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            data = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
        except Exception as e:
            return jsonify({'error': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
@token_required
def model_api(current_user):
    if request.method == 'OPTIONS':
        # 处理 OPTIONS 请求
        return jsonify({}), 200

    # 处理 POST 请求
    if request.method == 'POST':
        print(f"用户 {current_user.username} (ID:{current_user.id}) 发起请求")
        print("Received request:", request.get_json())  # 打印接收到的请求数据
        data = request.get_json()
        user_input = data.get('input', '')

        # 准备请求大模型API所需的数据
        payload = {
            "model": "qwen-plus",
            "messages": [
                {
                    "role": "passenger",
                    "content": user_input
                }
            ]
        }
        headers = {
            'Authorization': f'Bearer {DASHSCOPE_API_KEY}',
            'Content-Type': 'application/json'
        }

        try:
            print(MODEL_API_URL)
            # 发送请求到大模型API
            response = requests.post(MODEL_API_URL, headers=headers, json=payload)

            # 打印响应状态码和数据
            # print("Response status code:", response.status_code)
            print("Response text:", response.text)  # 打印原始响应内容

            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # print("Response data:", response_data)
                    return jsonify(response_data), 200
                except ValueError as e:
                    print("Error parsing JSON:", e)
                    return jsonify({'error': 'Invalid JSON response from model API'}), 500
            else:
                # 如果大模型API调用失败，返回错误信息
                error_message = f"Model API returned status code {response.status_code}: {response.text}"
                print("Error:", error_message)
                return jsonify({'error': error_message}), response.status_code, {
                    'Access-Control-Allow-Origin': '*'
                }
        except requests.RequestException as e:
            print("Request error:", e)
            return jsonify({'error': 'Network error when calling model API'}), 500

    # 如果是 GET 请求，返回提示信息
    return jsonify({'message': 'This endpoint supports POST requests only.'}), 200

# User模型
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.Text)
    role = db.Column(db.String(20), nullable=False, default='driver')  # 用户类型(driver/passenger/admin/maintenance)
    type = db.Column(db.String(10), default='normal')  # 用户权限(normal/privileged)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))  # 注册时间

    def generate_token(self):
        return jwt.encode({
            'user_id': self.id,
            'role': self.role,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
    

# 注册路由
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()    
    # 获取权限码并验证
    input_code = data.get('Permissioncode')
    valid_code = generate_password_hash(Config.PERMISSION_CODE)
    
    # 初始化可选角色
    allowed_roles = ['passenger', 'driver']
    
    # 权限码验证通过后扩展可选角色
    if input_code and check_password_hash(valid_code, input_code):
        allowed_roles += ['admin', 'maintenance']
    
    # 校验角色合法性
    selected_role = data.get('role')
    if selected_role not in allowed_roles:
        return jsonify({
            "status": "error",
            "message": "该角色需要有效权限码",
            "allowed_roles": allowed_roles
        }), 403
    
    # 如果是特权用户
    if selected_role in ['admin', 'maintenance']:
        user_type = 'privileged'
    else:
        user_type = 'normal'

    user = User(username=data['username'], role=selected_role, type=user_type)
    user.password_hash=generate_password_hash(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': '注册成功'}), 201

# 登录路由
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': '用户名或密码错误'}), 401
        
    token = user.generate_token()
    return jsonify({
        'token': token,
        'user_info': {
            'username': user.username,
            'role': user.role,
            'created_at': user.created_at.isoformat()
        }
    }), 200

# # 手势识别模块路径
# multimodal_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../multimodal'))
# if multimodal_path not in sys.path:
#     sys.path.insert(0, multimodal_path)

# from multi_recognition import GestureRecognition
# gesture_recognizer = GestureRecognition()  # 手势识别器

# # 手势识别路由
# @app.route('/api/gesture', methods=['POST'])
# @token_required
# def handle_gesture(current_user):
#     try:
#         # 验证图像数据存在
#         if 'image' not in request.json:
#             return jsonify({'error': 'Missing image data'}), 400
        

#     except Exception as e:
#         app.logger.error(f"Gesture recognition failed: {str(e)}")
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # 自动检测并创建不存在的表
    app.run(debug=True, host='127.0.0.1', port=5000)
