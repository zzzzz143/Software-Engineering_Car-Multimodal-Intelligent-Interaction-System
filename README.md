# 项目结构
```plaintext
├── backend/                                    # Flask后端服务
│   ├── UserConfig/                             # 用户配置
│   ├── .env                                    # 环境变量配置
│   ├── app.py                                  # 后端启动脚本
│   ├── routes/                                 # 路由模块
│   │   ├── auth.py                             # 注册登录路由
│   │   ├── account.py                          # 账户管理路由
│   │   ├── map.py                              # 高德地图路由
│   │   ├── admin.py                            # 管理员路由
│   │   ├── websocket.py                        # WebSocket路由
│   │   └── generate_speech.py                  # 语音合成路由      
│   ├── utils/                                  # 工具模块
│   │   └── decorators.py                       # JWT验证装饰器
│   ├── config.py                               # 配置文件
│   ├── extensions.py                           # 扩展初始化
│   ├── models.py                               # 数据库模型
│   ├── command_process.py                      # 命令处理
│   ├── instruction_processor.py                # 指令处理
│   ├── instrustions.json                       # 指令集
│   ├── instruction_specification.md            # 指令集规范
│   ├── text_to_speech.py                       # TTS 语音合成
│   ├── userConfig/
│   │   └── config_{user_id}.json               # 用户配置文件
│   ├── userHistory/
│   │   ├── history_{user_id}/     
│   │   │   ├── system_history_{user_id}.json   # 系统历史
│   │   │   └── user_history_{user_id}.json     # 用户历史
│   ├── generateSpeech/
│   │   │   └── generate_speech_{user_id}.mp3   # TTS 文本转语音
├── frontend/                                   # 前端界面
│   ├── node_modules/                           # 依赖库
│   ├── public/
│   │   ├── screen/                             # 屏幕
│   │   │   ├── driver/                         # 驾驶员屏幕
│   │   │   │   ├── screen_main.html            # 驾驶员主界面
│   │   │   │   ├── screen_navigation.html      # 导航界面
│   │   │   │   ├── screen_player.html          # 音乐界面
│   │   │   │   ├── screen_phone.html           # 电话界面
│   │   │   │   └── screen_setting.html         # 设置界面
│   │   │   ├── passenger/                        # 乘客屏幕
│   │   │   │   ├── screen_vedio.html           # 视频界面
│   │   │   │   ├── screen_player.html          # 音乐界面
│   │   │   │   └── screen_setting.html         # 设置界面
│   │   │   ├── admin.html               # 管理员界面
│   │   │   └── maintenance.html         # 维修人员界面
│   │   ├── hud.html                            # 头部导航栏
│   │   └── main.html                           # 主页面
│   ├── src/
│   │   ├── assets/                             # 静态资源
│   │   │   ├── images/                         # 图片资源
│   │   │   ├── music/                          # 音频资源
│   │   │   ├── vedio/                          # 音频资源
│   │   │   └── styles/                         # CSS样式
│   │   ├── js/                                 # 功能模块(JavaScript脚本)
│   │   │   ├── interaction/                    # 交互逻辑
│   │   │   │   ├── interaction.js              # 交互处理
│   │   │   │   ├── face_animation.js           # 面部动画逻辑
│   │   │   │   └── multimodal_recognition.js   # 多模态识别
│   │   │   ├── screen/                         # 屏幕相关
│   │   │   │   ├── screen.js                   # 屏幕管理
│   │   │   │   ├── screen_main.js              # 驾驶员主界面
│   │   │   │   ├── screen_navigation.js        # 导航界面
│   │   │   │   ├── screen_phone.js             # 电话界面
│   │   │   │   ├── screen_player.js            # 音乐界面
│   │   │   │   ├── screen_vedio.js             # 视频界面
│   │   │   │   ├── screen_setting.js           # 设置界面
│   │   │   │   ├── screen_setting_passenger.js # 乘客设置界面
│   │   │   │   ├── admin.js                    # 管理员界面
│   │   │   │   └── maintenance.js              # 维修人员界面
│   │   │   ├── service/                        # 服务模块
│   │   │   │   └── netease_api.js              # 网易云音乐API
│   │   │   │   ├── hud.js                      # 头部导航栏
│   │   │   │   └── login.js                    # 登录界面
│   ├── conda_dev.cmd                           # 启动前端脚本
│   ├── login.html                              # 登录界面
│   └── server.js                               # 前端服务器
├── multimodal
│   ├── audio/                                  # 语音识别
│   │   ├── SenseVoiceSmall/
│   │   │   └── model.pt                        # 语音识别模型
│   │   ├── audio.py                            # 语音识别
│   │   └── tempAudio
│   │   │   └── temp_audio_{user_id}.wav        # 临时音频文件
│   ├── gesture/                                # 手势识别
│   │   ├── model/                              # 模型文件
│   │   │   └── gesture_recognizer.task         # 手势识别模型
│   │   ├── requirements.txt                    # 手势识别依赖库
│   │   └── gesture.py                          # 手势识别
│   ├── video/                                  # 语音识别
│   │   └── video.py                            # 视觉识别
│   ├── .env                                    # 环境变量配置
│   ├── detecte_wakeword.py                     # 检测唤醒词
│   └── multimodal.py                           # 多模态识别
├── conda-environment.yml                       # 环境配置文件
└── README.md                                   # 项目文档
```

# 使用说明
1. 克隆项目到本地
2. 安装Miniconda（推荐）或conda
```bash
https://docs.conda.io/en/latest/miniconda.html
```
3. 创建环境并安装依赖库
```bash
conda env create -f conda-environment.yml
```
conda环境配置时间较长，请耐心等待

4. 激活虚拟环境
```bash
conda activate software
```
5. 安装PostgreSQL，创建一个名为software_db的数据库

6. 在backend文件夹下创建.env文件，内容如下：
```plaintext
MODEL_API_URL = your_model_api_url # 大模型API地址
DASHSCOPE_API_KEY = your_dashscope_api_key # 大模型API密钥
SQLALCHEMY_DATABASE_URI = postgresql://username:password@localhost/software_db # 数据库连接字符串
SECRET_KEY = your_secret_key # 安全密钥(32位随机字符串)
PERMISSION_CODE = your_permission_code # 权限码
AMAP_API_KEY = your_amap_web_key # 高德地图API KEY
AMAP_SECURITY_CODE = your_amap_security_code # 高德地图安全密钥
```

在multimodal文件夹下创建.env文件，内容如下：
```plaintext
PORCUPINE_ACCESS_KEY = your_porcupine_access_key # Porcupine访问密钥
```

config.py 会优先使用.env文件中的配置，如果不存在则使用默认值
7. 启动后端服务
```bash
python -m backend.app
```
8. 启动前端服务
```bash
cd frontend
npm install express # 安装Express框架（只需要运行一次）
npm install NeteaseCloudMusicApi # 安装网易云音乐API（只需要运行一次）
npm run dev
```
9. 访问前端界面http://localhost:3000


# 多模态大模型
## 手势识别

|                          | 手势描述                   | 功能               | 类型   |
| ------------------------ | ------------------------ | ------------------ | ---- |
| Closed_Fist              | 五指握拳                   | 接听电话            | 静态手势 |
| Open_Palm                | 五指张开                   | 拒接电话            | 静态手势 |
| Victory                  | 胜利手势(食指与中指伸直呈V字) | 开始/停止播放音乐音乐 | 静态手势 |
| Thumb_Left               | 拇指伸直朝左，其他手指合拢    | 播放上一首音乐       | 静态手势 |
| Thumb_Right              | 拇指伸直朝右，其他手指合拢    | 播放下一首音乐       | 静态手势 |
| Closed_Fist_To_Victory   | 五指握拳->胜利手势          | 音量增加             | 动态手势 |
| Victory_To_Closed_Fist   | 胜利手势->五指握拳          | 音量减小             | 动态手势 |
| Closed_Fist_To_Open_Palm | 五指握拳->五指张开          | 放大地图             | 动态手势 |
| Open_Palm_To_Closed_Fist | 五指张开->五指握拳          | 缩小地图             | 动态手势 |
| Thumb_Up                 | 竖起大拇指                 | 确认                | 静态手势 |
| Shake                    | 左右摇晃                   | 拒绝                | 动态手势 |
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

动态手势: 在静态手势的基础上使用规则进行判断

## 语音识别
基于阿里开源的SenseVoiceSmall模型:https://github.com/FunAudioLLM/SenseVoice

模型可以被应用于中文、粤语、英语、日语、韩语音频识别，并输出带有情感和事件的富文本转写结果。

## 唤醒词识别
基于Porcupine模型:https://console.picovoice.ai/
默认支持的关键词列表：
   - pico clock
   - jarvis
   - hey siri
   - hey google
   - blueberry
   - americano
   - picovoice
   - porcupine
   - terminator
   - alexa
   - bumblebee
   - grapefruit
   - hey barista
   - ok google
   - grasshopper
   - computer

## 对话流程
1. 前端每次收集4.8s的音频数据，就通过WebSocket发送到后端，后端会将音频数据保存到multi_modal/multimodal/audio/tempAudio/temp_audio_{user_id}.wav文件中
2. 用户说出默认唤醒词"hey siri"，后端进行Porcupine唤醒词识别
3. 后端识别到唤醒词后，会响应"我在"，并在前端设置15秒的超时时间(减去Porcupine唤醒词识别时间4.8s，实际超时时间为10.2s)
4. 用户继续说出指令，后端进行SenseVoiceSmall语音识别
5. 后端将识别到的文字和自定义指令集发送给阿里云大模型，生成固定格式的回复
   - 【instruction_code】：包含符合规范的指令编码
   - 【decision】：车辆系统应执行的具体决策
   - 【feedback】：给用户的友好反馈
6. 后端将生成的回复发送给前端，前端会根据回复中的指令编码，执行对应的操作

# 注册登录
1. 访问注册页面：http://localhost:3000
2. 输入用户名、密码
3. 注册特权账户(管理员、维护人员)需要输入权限码
4. 点击注册按钮，完成注册
5. 注册成功后，点击登录按钮，完成登录
