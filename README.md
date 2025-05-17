```plaintext
# 项目结构
├── backend/                           # Flask后端服务
│   ├── .env                           # 环境变量配置
│   └── app.py                         # 主入口(路由/数据库/API整合)
├── frontend/                          # 前端界面
│   ├── src/
│   │   ├── assets/                    # 静态资源
│   │   │   ├── images/                # 图片资源
│   │   │   ├── music/                 # 音频资源
│   │   │   └── styles/                # CSS样式
│   │   ├── js/                        # 功能模块(JavaScript脚本)
│   │   │   ├── api_service.js         # API请求服务
│   │   │   ├── auth_controller.js     # 认证相关逻辑
│   │   │   ├── face_animation.js      # 面部动画逻辑
│   │   │   ├── gesture_detection.js   # 手势检测逻辑
│   │   │   ├── main.js                # 应用入口
│   │   │   ├── music_player.js        # 音乐播放器逻辑
│   │   │   └── response_view.js       # 响应展示处理
│   └── index.html                     # 主界面
├── multimodal
│   ├── Audio/                         # 语音识别
│   │   ├── SenseVoiceSmall/
│   ├── gesture/                       # 手势识别
│   │   ├── model/                     # 模型文件
│   │   │   ├── gesture_recognizer.task
│   │   │   └── hand_landmarker.task
│   │   └── requirements.txt           # 手势识别依赖库
│   │   └── multi_recognition.py
├── conda-environment.yml              # 环境配置文件
└── README.md                          # 项目文档
```

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
flask --app app.py init-db  # 初始化数据库（只需运行一次）
python app.py
```
6. 启动前端服务
```
cd frontend
npm install express # 安装Express框架
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
   - Flask->>多模态大模型: 转发请求
   - 多模态大模型-->>Flask: 返回AI响应
   - Flask-->>Express: 返回JSON数据
   - Express-->>前端: 返回JSON数据
   - 前端->>DOM: 更新对话气泡
   - 前端->>浏览器: 调用语音合成

# 环境依赖
1. Python 3.7+ (Flask相关库)
2. Node.js (前端服务)
3. PostgreSQL 10+

# 多模态大模型
手势识别

|                          | 手势描述                 | 功能           | 类型   |
| ------------------------ | -------------------- | ------------ | ---- |
| Closed_Fist              | 五指握拳                 | 接听电话         | 静态手势 |
| Open_Palm                | 五指张开                 | 挂断电话         | 静态手势 |
| Victory                  | 胜利手势(食指与中指伸直呈V字)                 | 播放/关闭音乐      | 静态手势 |
| Thumb_Left               | 拇指伸直朝左，其他手指合拢                 | 播放上一首音乐      | 静态手势 |
| Thumb_Right              | 拇指伸直朝右，其他手指合拢                 | 播放下一首音乐      | 静态手势 |
| Swipe_Up                 | 五指握拳->胜利手势                 | 音量增加         | 动态手势 |
| Swipe_Down               | 胜利手势->五指握拳                 | 音量减少         | 动态手势 |
| Rotate_Clockwise         | 五指握拳->五指张开                 | 放大地图         | 动态手势 |
| Rotate_Counterclockwise  | 五指张开->五指握拳                 | 缩小地图         | 动态手势 |

基于谷歌的 MediaPipe 框架下的手势识别器
>更多详情请访问：https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/index?hl=zh-cn

静态手势: 预训练模型 MediaPipe GestureRecognizer 
此模型可以识别 7 种手势：
   - 👍 Thumb_Up
   - 🤟 ILoveYou
   - ✌️ Victory
   - ☝️ Pointing_Up
   - ✊ Closed_Fist
   - 👋 OPen_Palm
   - 👎 Thumb_Down

动态手势: 目前是在静态手势的基础上使用规则进行判断，后续考虑使用 Real-time-GesRec 的预训练模型
   - shared_models_v1模型(1.08GB)
      - 下载链接: https://drive.google.com/file/d/11MJWXmFnx9shbVtsaP1V8ak_kADg0r7D
   - Pretrained models模型(371MB)
      - 下载链接: https://drive.google.com/file/d/1V23zvjAKZr7FUOBLpgPZkpHGv8_D-cOs
