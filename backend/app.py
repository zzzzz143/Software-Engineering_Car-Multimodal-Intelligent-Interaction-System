from flask import Flask, request, jsonify
import requests
import sys
import os
from dotenv import load_dotenv
from flask_cors import CORS
from datetime import datetime, timedelta, timezone

# 初始化Flask应用
app = Flask(__name__)
# 配置CORS支持所有域名的跨域请求
CORS(app, resources={r"/*": {"origins": "*"}})
# 从.env加载配置
load_dotenv()  
MODEL_API_URL = os.getenv('MODEL_API_URL')
# "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
API_KEY = os.getenv('DASHSCOPE_API_KEY')
# "sk-d312c095790e4674998b1975c2ed5940"

# 数据库配置
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps
import yaml

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:123456@localhost/software_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_secret_key_here')

@app.cli.command("init-db")
def init_db_command():
    """初始化数据库表结构"""
    db.create_all()
    print("数据库初始化完成")


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
                    "role": "user",
                    "content": user_input
                }
            ]
        }
        headers = {
            'Authorization': f'Bearer {API_KEY}',
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

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_token(self):
        return jwt.encode({
            'user_id': self.id,
            'exp': datetime.now(timezone.utc) + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')

# 注册路由
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    try:
        data = request.get_json()  # 添加调试日志
        print("Received registration data:", data)
    except Exception as e:
        print("JSON parse error:", e)
        return jsonify({'error': 'Invalid JSON format'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 409
        
    user = User(username=data['username'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': '注册成功'}), 201

# 登录路由
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': '用户名或密码错误'}), 401
        
    token = user.generate_token()
    return jsonify({'token': token}), 200


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