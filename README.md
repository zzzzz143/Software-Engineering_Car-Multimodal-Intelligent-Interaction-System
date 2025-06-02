# 项目结构
```plaintext
├── backend/                                    # Flask后端服务
│   ├── UserConfig/                             # 用户配置
│   ├── .env                                    # 环境变量配置
│   ├── app.py                                  # 主入口(路由/数据库/API整合)
│   └── config.py                               # 配置文件
├── frontend/                                   # 前端界面
│   ├── node_modules/                           # 依赖库
│   ├── public/
│   │   ├── screen/
│   │   │   ├── screen_main.html                # 主界面
│   │   │   ├── screen_navigation.html          # 导航界面
│   │   │   ├── screen_setting.html             # 设置界面
│   │   │   ├── screen_vedio.html               # 视频界面
│   │   │   ├── screen_player.html              # 播放器界面
│   │   │   └── screen_phone.html               # 手机界面
│   │   ├── user/
│   │   │   ├── user_driver                     # 司机界面
│   │   │   ├── user_passenger                  # 乘客界面
│   │   │   ├── user_maintenance                # 维修人员界面
│   │   │   └── user_admin                      # 管理员界面
│   │   ├── hud.html                            # 头部导航栏
│   │   └── main.html                           # 主页面(不同用户登录后进一步分发，显示不同界面)
│   ├── src/
│   │   ├── assets/                             # 静态资源
│   │   │   ├── images/                         # 图片资源
│   │   │   ├── music/                          # 音频资源
│   │   │   └── styles/                         # CSS样式
│   │   ├── js/                                 # 功能模块(JavaScript脚本)
│   │   │   ├── interaction/                    # 交互逻辑
│   │   │   │   ├── interaction.js              # 交互处理
│   │   │   │   ├── update_user_status.js       # 用户状态更新
│   │   │   │   ├── face_animation.js           # 面部动画逻辑
│   │   │   │   └── multimodal_recognition.js   # 多模态识别
│   │   │   ├── screen/                         # 屏幕相关
│   │   │   │   ├── screen_main.js              # 主界面
│   │   │   │   ├── screen_navigation.js        # 导航界面
│   │   │   │   ├── screen_phone.js             # 手机界面
│   │   │   │   ├── screen_player.js            # 播放器界面
│   │   │   │   ├── screen.js                   # 屏幕管理
│   │   │   │   └── setting_screen.js           # 设置界面
│   └── index.html                              # 登录界面
├── multimodal
│   ├── audio/                                  # 语音识别
│   │   ├── SenseVoiceSmall/
│   │   │   ├── utils
│   │   │   ├── chn_jpn_yue_eng_ko_spectok.bpe.model
│   │   │   ├── config.yaml
│   │   │   ├── configuration.json
│   │   │   ├── model.pt
│   │   │   └── model.py
│   │   ├── audio_recognition.py                # 语音识别
│   │   └── audio.py                            # 供外部调用的语音识别接口
│   ├── gesture/                                # 手势识别
│   │   ├── model/                              # 模型文件
│   │   │   ├── gesture_recognizer.task
│   │   │   └── hand_landmarker.task
│   │   ├── requirements.txt                    # 手势识别依赖库
│   │   ├── gesture_recognition.py              # 手势识别
│   │   └── gesture.py                          # 供外部调用的手势识别接口
│   ├── video/                                  # 语音识别
│   │   ├── test.py
│   │   ├── video_recognition.py                # 头部姿态检测及视线预测
│   │   └── video.py                            # 供外部调用的视觉识别接口
│   ├── multi_recognition.py                    # 多模态识别
│   └── multi_recognition.py                    # 供外部调用的多模态识别接口
├── conda-environment.yml                       # 环境配置文件
└── README.md                                   # 项目文档
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
config.py 会优先使用.env文件中的配置，如果不存在则使用默认值
7. 启动后端服务
```bash
cd backend
python app.py
```
8. 启动前端服务
```bash
cd frontend
npm install express # 安装Express框架（只需要运行一次）
npm run dev
```
9. 访问前端界面http://localhost:3000


# 多模态大模型
## 手势识别

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

动态手势: 在静态手势的基础上使用规则进行判断

## 语音识别
基于阿里开源的SenseVoiceSmall模型:https://github.com/FunAudioLLM/SenseVoice

模型可以被应用于中文、粤语、英语、日语、韩语音频识别，并输出带有情感和事件的富文本转写结果。

# 注册登录
1. 访问注册页面：http://localhost:3000
2. 输入用户名、密码
3. 注册特权账户(管理员、维护人员)需要输入权限码
4. 点击注册按钮，完成注册
5. 注册成功后，点击登录按钮，完成登录
