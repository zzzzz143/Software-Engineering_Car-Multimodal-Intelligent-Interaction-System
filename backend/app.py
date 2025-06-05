from gevent import monkey
monkey.patch_all()
from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
import signal
from flask import Flask
from .config import Config
from .extensions import db, init_app
from .routes import auth, admin, map, account, websocket
import sys

app = Flask(__name__)
app.config.from_object(Config)

# 初始化扩展
init_app(app)

# 注册蓝图
app.register_blueprint(auth.auth_bp)
app.register_blueprint(admin.admin_bp)
app.register_blueprint(map.map_bp)
app.register_blueprint(account.account_bp)

# WSGI 分发器
def dispatcher_app(environ, start_response):
    path = environ.get('PATH_INFO', '')
    # 强制抓住 /ws/multimodal 的所有 WebSocket
    if path == '/ws/multimodal' and environ.get('wsgi.websocket'):
        return websocket.websocket_handler(environ, start_response)
    # 其他一律给 Flask 处理
    return app.wsgi_app(environ, start_response)

# 信号处理
def signal_handler(signum, frame):
    print('\n正在关闭服务...')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    try:
        server = WSGIServer(
            ('0.0.0.0', 5000),
            dispatcher_app,
            handler_class=WebSocketHandler
        )
        print('服务已启动，监听端口5000...')
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n检测到 Ctrl+C，正在关闭服务器...')
        server.stop(timeout=2)
        signal_handler(signal.SIGINT, None)
    except Exception as e:
        print(f"WebSocket服务启动失败: {str(e)}")