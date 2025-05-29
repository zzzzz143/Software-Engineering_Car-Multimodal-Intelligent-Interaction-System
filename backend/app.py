from gevent import monkey
monkey.patch_all()  # 猴子补丁

from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler

from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from config import Config
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps
import json
import sys
from pathlib import Path

# 将项目根目录添加到sys.path
project_root = Path(__file__).parent.parent.absolute()
sys.path.append(str(project_root))
from multimodal.multimodal import process_multimodal_request

# —————— 初始化 Flask ——————
app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "*"}}) 
db = SQLAlchemy(app)

# —————— WebSocket 处理 ——————
def websocket_handler(environ, start_response):
    ws = environ.get('wsgi.websocket')
    # 如果不是 WebSocket 或者路径不匹配
    if not ws:
        start_response('404 Not Found', [('Content-Type','text/plain')])
        return [b'Not a WebSocket request']

    try:
        while True:
            message = ws.receive()
            if message:
                try:
                    data = json.loads(message)
                
                    # 心跳包
                    if data.get('type')=='heartbeat':
                        ws.send(json.dumps({'type':'heartbeat','status':'alive'}))
                        continue
                    # 处理请求
                    elif data.get('type')=='request':
                        # print("后端接收请求")
                        # print("后端接收请求:", data)
                        result = process_multimodal_request(data)
                        # print("后端响应请求:", result)
                        if result.get('gesture') != '无手势' or result.get('video') != '无视觉检测结果':
                            print("后端响应请求:", result)
                        ws.send(json.dumps({'type': 'response', 'result': result}))
                    else:
                        ws.send(json.dumps({'error': '未知响应类型'}))
                except json.JSONDecodeError as e:
                        print(f"JSON解析错误: {e}")
                        ws.send(json.dumps({'error': 'JSON解析错误'}))
                except Exception as e:
                        print(f"WebSocket处理错误: {e}")
                        ws.send(json.dumps({'error': str(e)}))

    except Exception as e:
        print(f"连接异常: {e}")

    finally:
        print("WebSocket连接已关闭")
    return []

# User模型
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.Text)
    role = db.Column(db.String(20), nullable=False, default='driver')  # 用户类型(driver/passenger/maintenance/admin)
    type = db.Column(db.String(10), default='normal')  # 用户权限(normal/privileged)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))  # 注册时间

# —————— HTTP 路由 ——————
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
        
    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'] , algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user_info': {
            'username': user.username,
            'role': user.role,
            'created_at': user.created_at.isoformat()
        }
    }), 200

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
            'Authorization': f'Bearer {Config.DASHSCOPE_API_KEY}',
            'Content-Type': 'application/json'
        }

        try:
            print(Config.MODEL_API_URL)
            # 发送请求到大模型API
            response = requests.post(Config.MODEL_API_URL, headers=headers, json=payload)

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

# 高德地图配置路由
@app.route('/api/amap/config', methods=['GET'])
def get_amap_config():
    return jsonify({
        'api_key': Config.AMAP_API_KEY,
        'security_code': Config.AMAP_SECURITY_CODE
    })

# —————— WSGI 分发器 ——————
def dispatcher_app(environ, start_response):
    path = environ.get('PATH_INFO', '')
    # 强制抓住 /ws/multimodal 的所有 WebSocket
    if path == '/ws/multimodal' and environ.get('wsgi.websocket'):
        return websocket_handler(environ, start_response)
    # 其他一律给 Flask
    return app.wsgi_app(environ, start_response)

if __name__ == '__main__':
    # 确保数据库表已创建
    with app.app_context():
        db.create_all()
    
    try:
        server = WSGIServer(
            ('0.0.0.0', 5000),
            dispatcher_app,
            handler_class=WebSocketHandler
        )
        print('WebSocket服务已启动，监听端口5000...')
        server.serve_forever()
    except Exception as e:
        print(f"WebSocket服务启动失败: {str(e)}")