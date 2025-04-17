# 项目结构
├── backend/                        # Flask后端服务
│   ├── app.py                      # 主入口(路由/数据库/API整合)
│   └── .env                        # 环境变量配置
├── frontend/                       # 前端界面
│   ├── src/
│   │   ├── assets/                 # 静态资源
│   │   │   ├── styles/             # CSS样式
│   │   │   └── images/             # 图片资源
│   │   ├── js/                     # 功能模块(JavaScript脚本)
│   │   │   ├── apiService.js       # API请求服务
│   │   │   ├── authController.js   # 认证相关逻辑
│   │   │   ├── faceAnimation.js    # 面部动画逻辑
│   │   │   ├── main.js             # 应用入口
│   │   │   └── responseView.js     # 响应展示处理
│   └── index.html                  # 主界面
├── datasets                        # 数据集
├── conda-environment.yml           # 环境配置文件
└── README.md                       # 项目文档

# 技术栈

| 模块    | 技术选型                     |
| ----- | ------------------------ |
| 前端    | Vanilla JS + Express静态服务 |
| 后端    | Flask + SQLAlchemy + JWT |
| 数据库   | PostgreSQL               |
| 部署    | Conda环境管理 + 本地双服务运行      |
| 第三方对接 | 阿里云大模型API                |


# 使用说明
1. 克隆项目到本地
2. 安装Miniconda（推荐）或conda
```bash
https://docs.conda.io/en/latest/miniconda.html
```
3. 创建环境并安装依赖库
```
conda env create -f conda-environment.yml
```
4. 激活虚拟环境
```
conda activate software
```
5. 启动后端服务
```
cd backend
python app.py
```
6. 启动前端服务
```
cd frontend
npm run dev
```

# 核心功能流
1. 用户认证系统
   - 加密存储：使用pbkdf2算法加密密码
   - 会话管理：JWT令牌实现无状态认证
   - 错误处理： `register` 和 `login` 路由包含完整错误校验
2. 智能对话流程
   - 前端->>Express: POST /api/chat + JWT
   - Express->>Flask: 代理请求
   - Flask->>阿里云API: 转发对话请求
   - 阿里云API-->>Flask: 返回AI响应
   - Flask-->>Express: 返回JSON数据
   - Express-->>前端: 返回JSON数据
   - 前端->>DOM: 更新对话气泡
   - 前端->>浏览器: 调用语音合成
3. 特色功能
- 面部追踪： `faceAnimation.js` 实现眼球跟随鼠标
- 渐进式响应：打字机效果显示AI回复
- 语音合成：调用浏览器TTS API

# 环境依赖
1. Python 3.7+ (Flask相关库)
2. Node.js (前端服务)
3. PostgreSQL 10+
4. 阿里云API访问权限