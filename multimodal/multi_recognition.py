import time
import cv2
import os
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.framework.formats import landmark_pb2
from PIL import Image, ImageDraw, ImageFont
import threading
import pyaudio
from funasr import AutoModel
from funasr.utils.postprocess_utils import rich_transcription_postprocess
import wave

# 手势识别参数
DEVICE_ID = 0
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720
DESIRED_FPS = 90
GESTURE_WINDOW = 0.5  # 动态手势时间窗口（秒）
STATIC_GESTURE_DURATION_THRESHOLD = 1.0  # 静态手势持续时间阈值（秒）
DYNAMIC_GESTURE_WINDOW = 1.0  # 动态手势时间窗口（秒）
SHAKE_WINDOW = 0.6  # 摇手时间窗口（秒）
SHAKE_THRESHOLD = 0.08  # 每次左右位移的最小x轴差值（归一化）
SHAKE_COUNT_REQUIRED = 2  # 至少需要多少次左右位移才算作一次有效的摇手

# 音频参数
CHUNK = 8012  # 每个缓冲区的帧数
FORMAT = pyaudio.paInt16  # 音频格式
CHANNELS = 1  # 单声道
RATE = 6500  # 采样率
THRESHOLD = 300  # 能量阈值
SILENCE_LIMIT = 2.5  # 无声时间阈值

# 全局变量
stop_event = threading.Event()  # 用于停止线程的事件

class GestureRecognition:
    def __init__(self, capture):
        self.capture = capture
        self.init_mediapipe_hands_detector()
        self.prev_time = time.time()
        self.gesture_history = []  # 存储静态手势和时间戳
        self.gesture_map = {
            "Closed_Fist": "播放/暂停音乐",
            "Open_Palm": "挂断电话",
            "Victory": "接听电话",
            "Thumb_Left": "播放上一首音乐",
            "Thumb_Right": "播放下一首音乐",
            "Thumb_Up": "确认操作",
            "Closed_Fist_To_Victory": "音量增加",
            "Victory_To_Closed_Fist": "音量减少",
            "Closed_Fist_To_Open_Palm": "放大地图",
            "Open_Palm_To_Closed_Fist": "缩小地图",
            "Shake": "拒绝",
        }
        self.font = ImageFont.truetype("simhei.ttf", 24)  # 加载中文字体

        self.potential_static_gesture = None  # 当前正在跟踪稳定性的手势
        self.potential_static_gesture_start_time = None  # 跟踪开始时间戳
        self.confirmed_static_gesture = None  # 确认稳定的手势
        self.confirmed_static_gesture_score = 0.0  # 确认手势的分数

        # 动态过渡的手势历史记录（保留时间稍长于窗口以捕捉边界跨越）
        self.gesture_history_duration = DYNAMIC_GESTURE_WINDOW + 0.5  # 增加0.5秒的冗余
        self.gesture_history = []  # 存储手势和时间戳
        self.gesture_start_time = None  # 手势开始时间戳
        self.last_displayed_gesture = None  # 上一次显示的手势
        self.potential_landmark_gesture = None  # 当前正在跟踪的手势
        self.potential_landmark_gesture_start_time = None  # 跟踪开始时间戳
        self.shake_history = []  # 记录最近手腕的x位置和时间

    def init_mediapipe_hands_detector(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, './gesture/model', 'gesture_recognizer.task')
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.GestureRecognizerOptions(base_options=base_options)
        self.gesture_recognizer = vision.GestureRecognizer.create_from_options(options)

    def process_frame(self, frame):
        current_time = time.time()
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        result = self.gesture_recognizer.recognize(mp_image)

        current_raw_gesture = None
        current_raw_score = 0.0
        if result.gestures and result.gestures[0]:
            current_raw_gesture = result.gestures[0][0].category_name
            current_raw_score = result.gestures[0][0].score
        self.confirmed_static_gesture = None
        dynamic_gesture = None

        # 更新静态手势的稳定性检查
        if current_raw_gesture:
            if self.potential_static_gesture == current_raw_gesture:
                if current_time - self.potential_static_gesture_start_time >= STATIC_GESTURE_DURATION_THRESHOLD:
                    self.confirmed_static_gesture = self.potential_static_gesture
                    self.confirmed_static_gesture_score = current_raw_score  # 更新分数
            else:
                # 手势改变或开始，重置计时器
                self.potential_static_gesture = current_raw_gesture
                self.potential_static_gesture_start_time = current_time
        else:
            # 未检测到手势，重置潜在静态手势
            self.potential_static_gesture = None
            self.potential_static_gesture_start_time = None

        # 更新手势历史（仅添加实际检测到的手势）
        if current_raw_gesture:
            self.gesture_history.append((current_raw_gesture, current_time))

        # 清除过期的手势记录
        self.gesture_history = [
            (g, t) for g, t in self.gesture_history
            if current_time - t <= self.gesture_history_duration  # 保留稍长于窗口的历史记录
        ]

        # 检测动态手势转换
        if self.confirmed_static_gesture is None:
            # 使用历史记录检查过渡
            if len(self.gesture_history) >= 2:
                # 查找在当前时间结束的DYNAMIC_GESTURE_WINDOW内的转换
                latest_gesture, latest_time = self.gesture_history[-1]
                for i in range(len(self.gesture_history) - 2, -1, -1):  # 从倒数第二个开始向后遍历
                    prev_gesture, prev_time = self.gesture_history[i]
                    time_diff = latest_time - prev_time

                    # 检查转换是否发生在窗口内
                    if 0 < time_diff <= DYNAMIC_GESTURE_WINDOW:  # 确保时间差为正
                        # 检查特定的预定义转换
                        transition_found = False
                        if prev_gesture == "Closed_Fist" and latest_gesture == "Victory":
                            dynamic_gesture = "Closed_Fist_To_Victory"
                            transition_found = True
                        elif prev_gesture == "Victory" and latest_gesture == "Closed_Fist":
                            dynamic_gesture = "Victory_To_Closed_Fist"
                            transition_found = True
                        elif prev_gesture == "Closed_Fist" and latest_gesture == "Open_Palm":
                            dynamic_gesture = "Closed_Fist_To_Open_Palm"
                            transition_found = True
                        elif prev_gesture == "Open_Palm" and latest_gesture == "Closed_Fist":
                            dynamic_gesture = "Open_Palm_To_Closed_Fist"
                            transition_found = True

                        if transition_found:
                            # print(f"检测到动态转换: {dynamic_gesture}")
                            # 关键：检测到动态手势后重置历史记录和静态跟踪
                            self.gesture_history.clear()
                            self.potential_static_gesture = None
                            self.potential_static_gesture_start_time = None
                            break  # 找到转换后停止检查历史记录
                    elif time_diff > DYNAMIC_GESTURE_WINDOW:
                        # 优化：如果时间回溯太远，停止检查此历史记录
                        break

        # 仅在无动态转换时检查关键点手势（如拇指、旋转）
        if not dynamic_gesture and result.hand_landmarks:
            hand_landmarks = result.hand_landmarks[0]  # 获取第一个检测到的手的关键点
            points = [(lm.x, lm.y) for lm in hand_landmarks]  # 转换关键点数据结构
            landmark_gesture = self.classify_gesture(points, current_time)
            # 绘制关键点
            frame = self.draw_landmarks_on_image(frame, hand_landmarks)

            # 处理需要稳定时间的关键点静态手势
            if landmark_gesture in ["Thumb_Left", "Thumb_Right"]:
                if self.potential_landmark_gesture == landmark_gesture:
                    if current_time - self.potential_landmark_gesture_start_time >= STATIC_GESTURE_DURATION_THRESHOLD:
                        self.confirmed_static_gesture = self.potential_landmark_gesture
                else:
                    self.potential_landmark_gesture = landmark_gesture
                    self.potential_landmark_gesture_start_time = current_time
            else:
                # 检查是否为"摇手"手势
                index_tip = points[8]
                middle_tip = points[12]
                ring_tip = points[16]
                pinky_tip = points[20]
                wrist = points[0]

                # 简单判定：所有指尖y坐标都比 MCP 点高（即手指竖直张开）
                index_mcp = points[5]
                middle_mcp = points[9]
                ring_mcp = points[13]
                pinky_mcp = points[17]

                # 判断是否张开手掌
                fingers_open = (
                        index_tip[1] < index_mcp[1] and
                        middle_tip[1] < middle_mcp[1] and
                        ring_tip[1] < ring_mcp[1] and
                        pinky_tip[1] < pinky_mcp[1]
                )

                thumb_tip = points[4]
                thumb_open = abs(thumb_tip[0] - wrist[0]) > 0.15  # 水平方向展开

                if fingers_open and thumb_open:
                    wrist_x = wrist[0]
                    self.shake_history.append((wrist_x, current_time))

                    # 保留时间窗口内的数据
                    self.shake_history = [
                        (x, t) for x, t in self.shake_history
                        if current_time - t <= SHAKE_WINDOW
                    ]

                    if len(self.shake_history) >= 3:
                        x_positions = [x for x, _ in self.shake_history]
                        movement_range = max(x_positions) - min(x_positions)

                        if movement_range >= SHAKE_THRESHOLD * 2:  # 两倍阈值表示至少来回过一次
                            dynamic_gesture = "Shake"
                            self.shake_history.clear()

        # 转换为PIL格式
        pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(pil_img)

        # 优先显示动态手势
        if dynamic_gesture:
            display_gesture = dynamic_gesture
        elif self.confirmed_static_gesture:
            display_gesture = self.confirmed_static_gesture
        else:
            display_gesture = None
        
        # 使用gesture_map映射最终显示名称
        gesture_name = "无手势"
        if display_gesture:
            gesture_name = self.gesture_map.get(display_gesture, "无手势")
        score_text = f" ({current_raw_score:.2f})" if current_raw_score and not dynamic_gesture else ""
        
        # 检查手势是否连续出现2秒
        if gesture_name != "无手势":
            # 动态手势不要求出现2秒
            if gesture_name =="音量增加" or gesture_name =="音量减少" or gesture_name =="放大地图" or gesture_name =="缩小地图" or gesture_name =="拒绝":
                if gesture_name != self.last_displayed_gesture:
                    print(f"检测到手势: {gesture_name}")
                    self.last_displayed_gesture = None
            else:
                if gesture_name != self.last_displayed_gesture:
                    # 重置计时器
                    self.gesture_start_time = time.time()
                    self.last_displayed_gesture = gesture_name
                else:
                    # 检查持续时间
                    if time.time() - self.gesture_start_time >= 2.0:
                        print(f"检测到手势: {gesture_name}{score_text}")
                        self.last_displayed_gesture = None
        else:
            self.last_displayed_gesture = None
            self.gesture_start_time = None

        draw.text((10, 30),
                  f"手势: {gesture_name}{score_text}",
                  font=self.font,
                  fill=(0, 255, 0, 255))

        # 转换回OpenCV格式
        frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        return frame

    def classify_gesture(self, points, current_time):
        # 调整输入参数处理
        points = np.array(points)

        wrist = points[0]  # 手腕
        finger_mcps = points[[1, 5, 9, 13, 17]]  # 手指根（MCP关节）
        finger_pips = points[[2, 6, 10, 14, 18]]  # 手指第一关节（PIP关节）
        finger_dips = points[[3, 7, 11, 15, 19]]  # 手指第二关节（DIP关节）
        finger_tips = points[[4, 8, 12, 16, 20]]  # 手指尖（TIP关节）
        palm_width = np.linalg.norm(points[5] - points[17])  # 手掌宽度

        fingers_extended = []
        for i in range(5):  # 遍历每根手指
            # 计算各关节间的向量
            vec_mcp_pip = finger_pips[i] - finger_mcps[i]
            vec_pip_dip = finger_dips[i] - finger_pips[i]
            vec_dip_tip = finger_tips[i] - finger_dips[i]

            # 计算相邻向量间的角度（余弦相似度）
            angle1 = np.dot(vec_mcp_pip, vec_pip_dip) / (
                    np.linalg.norm(vec_mcp_pip) * np.linalg.norm(vec_pip_dip) + 1e-6)
            angle2 = np.dot(vec_pip_dip, vec_dip_tip) / (
                    np.linalg.norm(vec_pip_dip) * np.linalg.norm(vec_dip_tip) + 1e-6)

            # 判断手指是否伸直（角度接近180度）
            is_extended = (angle1 > 0.9) and (angle2 > 0.9)  # 余弦值>0.9对应约25度偏差
            fingers_extended.append(is_extended)

        fingers_curled = [  # 手指合拢
            finger_tips[i][1] >= finger_pips[i][1] - palm_width * 0.1
            for i in range(5)
        ]

        # 拇指伸直，其他手指合拢
        if fingers_extended[0] and all(fingers_curled[1:]):
            thumb_tip_vector = finger_tips[0] - wrist
            thumb_angle = np.arctan2(thumb_tip_vector[1], thumb_tip_vector[0]) * 180 / np.pi
            # print(f"拇指角度: {thumb_angle:.2f}, 手指合拢: {fingers_curled[1:]}")

            # 判断拇指朝向
            if -60 <= thumb_angle <= 0:  # 拇指朝左
                return "Thumb_Left"
            elif -160 <= thumb_angle <= -100:  # 拇指朝右
                return "Thumb_Right"

        return None

    def draw_landmarks_on_image(self, image, landmarks):
        landmark_proto = landmark_pb2.NormalizedLandmarkList()
        landmark_proto.landmark.extend([
            landmark_pb2.NormalizedLandmark(x=lm.x, y=lm.y, z=lm.z) for lm in landmarks
        ])
        mp.solutions.drawing_utils.draw_landmarks(
            image,
            landmark_proto,
            mp.solutions.hands.HAND_CONNECTIONS,
            mp.solutions.drawing_styles.get_default_hand_landmarks_style(),
            mp.solutions.drawing_styles.get_default_hand_connections_style())
        return image


class AudioRecognition(threading.Thread):
    def __init__(self):
        super().__init__()
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(format=FORMAT,
                                  channels=CHANNELS,
                                  rate=RATE,
                                  input=True,
                                  frames_per_buffer=CHUNK)
        print("开始监听...")
        self.audio_buffer = []
        self.silence_start_time = None
        self.model = self.load_model()

    def load_model(self):
        model_dir = "./Audio/SenseVoiceSmall"
        try:
            model = AutoModel(
                model=model_dir,
                trust_remote_code=True,
                remote_code="./Audio/SenseVoiceSmall/model.py",
                vad_model="fsmn-vad",
                vad_kwargs={"max_single_segment_time": 30000},
                device="cuda:0",
                disable_update=True  # 禁用更新检查
            )
            return model
        except Exception as e:
            print(f"加载模型失败: {str(e)}")
            return None

    def save_audio_to_wav(self, audio_data, filename, sample_rate=16000, channels=1, sample_width=2):
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(channels)  # 设置为双声道
            wf.setsampwidth(sample_width)
            wf.setframerate(sample_rate)
            wf.writeframes(audio_data)

    def recognize_speech(self, audio_data, sample_rate):
        if not audio_data:
            return "音频数据为空"

        # 将音频数据保存为临时 WAV 文件
        temp_file = "./Audio/SenseVoiceSmall/example/test.wav"
        self.save_audio_to_wav(audio_data, temp_file, sample_rate=sample_rate)

        # 使用 SenseVoice 模型进行识别
        if self.model:
            res = self.model.generate(
                input=temp_file,
                cache={},
                language="auto",  # "zh", "en", "yue", "ja", "ko", "nospeech"
                use_itn=True,
                batch_size_s=60,
                merge_vad=True,  #
                merge_length_s=15,
            )

            # 后处理
            text = rich_transcription_postprocess(res[0]["text"])
            return text
        return "模型加载失败，无法识别"

    def run(self):
        try:
            while not stop_event.is_set():
                # 读取音频数据
                data = self.stream.read(CHUNK)
                # 将字节数据转换为 numpy 数组
                audio_data = np.frombuffer(data, dtype=np.int16)

                # 计算音频能量
                energy = np.abs(audio_data).mean()

                # 检测语音活动
                if energy > THRESHOLD:
                    if self.silence_start_time is not None:
                        # 如果之前有静默，重置静默计时器
                        self.silence_start_time = None
                    # 将音频数据添加到缓冲区
                    self.audio_buffer.append(data)
                else:
                    # 如果当前没有语音活动
                    if self.silence_start_time is None:
                        # 开始计时静默时间
                        self.silence_start_time = time.time()
                    else:
                        # 检查静默时间是否超过阈值
                        if time.time() - self.silence_start_time > SILENCE_LIMIT:
                            # 语音活动结束，处理音频缓冲区中的数据
                            print("语音活动结束，开始处理音频...")

                            # 将缓冲区中的音频数据合并为一个完整的音频片段
                            audio_segment = b''.join(self.audio_buffer)

                            # 调用语音识别模型进行处理
                            recognized_text = self.recognize_speech(audio_segment, RATE)
                            print(f"识别结果: {recognized_text}")

                            # 清空缓冲区
                            self.audio_buffer = []
                            self.silence_start_time = None
        except KeyboardInterrupt:
            print("停止监听...")
        finally:
            # 关闭音频流
            self.stream.stop_stream()
            self.stream.close()
            self.p.terminate()


class VisualRecognition:
    def __init__(self):
        from Video.face_detection import FaceDetector
        from Video.head_pose_detector import HeadPoseDetector
        from Video.gaze_tracking import GazeTracker

        self.face_detector = FaceDetector()
        self.head_detector = HeadPoseDetector()
        self.gaze_tracker = GazeTracker()
        self.last_action = None
        self.last_gaze_status = "center"
        self.gaze_away_start_time = None
        self.DISTRACTION_THRESHOLD = 2.0

    def process_frame(self, frame):
        image = frame.copy()
        face_data = self.face_detector.detect_face(image)
        if face_data:
            landmarks = face_data['landmarks']
            rotation_matrix = face_data['rotation_matrix']

            # 头部姿态检测
            head_result = self.head_detector.detect_head_movement(rotation_matrix)

            # 视线检测
            gaze_result = self.gaze_tracker.track_gaze(landmarks, image)

            # 终端输出点头/摇头
            if head_result['action'] in ("NOD", "SHAKE") and head_result['action'] != self.last_action:
                print(f"检测到动作：{head_result['action']}")
                self.last_action = head_result['action']
            elif head_result['action'] not in ("NOD", "SHAKE"):
                self.last_action = None

            # 改进分心/疲劳判定
            gaze_dir = gaze_result['direction']
            now = time.time()
            # 只对主方向做判定
            if gaze_dir in ("left", "right", "up", "down"):
                if self.gaze_away_start_time is None:
                    self.gaze_away_start_time = now
                elif now - self.gaze_away_start_time > self.DISTRACTION_THRESHOLD:
                    if self.last_gaze_status != "distracted":
                        print("警告：检测到驾驶员持续分心或疲劳！")
                        self.last_gaze_status = "distracted"
            else:
                self.gaze_away_start_time = None
                self.last_gaze_status = "center"

            # 可视化部分同前
            cv2.putText(image, f"Pitch: {head_result['angles']['pitch']:+.1f}°", (10, 230),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Yaw: {head_result['angles']['yaw']:+.1f}°", (10, 260),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Roll: {head_result['angles']['roll']:+.1f}°", (10, 290),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)

            cv2.putText(image, f"P_threshold: {head_result['thresholds']['nod']:+.1f}°", (10, 370),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Y_threshold: {head_result['thresholds']['shake']:+.1f}°", (10, 400),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"R_threshold: {head_result['thresholds']['roll']:+.1f}°", (10, 430),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)

            if head_result['time_since_last'] < self.head_detector.MOTION_INTERVAL:
                text = f"{head_result['action']}"
                text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)[0]
                cv2.putText(image, text, (image.shape[1] // 2 - text_size[0] // 2, image.shape[0] // 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)

            cv2.putText(image, f"Gaze: {gaze_result['direction']}", (30, 140),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)

            for pt in gaze_result["left_eye"]["iris_landmarks"]:
                cv2.circle(image, pt, 1, (0, 0, 255), -1)
            for pt in gaze_result["right_eye"]["iris_landmarks"]:
                cv2.circle(image, pt, 1, (0, 0, 255), -1)

            if gaze_result["left_eye"]["pupil_center"]:
                cv2.circle(image, (int(gaze_result["left_eye"]["pupil_center"][0]), int(gaze_result["left_eye"]["pupil_center"][1])), 3, (255, 0, 255), -1)
            if gaze_result["right_eye"]["pupil_center"]:
                cv2.circle(image, (int(gaze_result["right_eye"]["pupil_center"][0]), int(gaze_result["right_eye"]["pupil_center"][1])), 3, (255, 0, 255), -1)

            for eye in ["left_eye", "right_eye"]:
                pupil = gaze_result[eye]["pupil_center"]
                gaze_vec = gaze_result[eye]["gaze_3d"]
                if pupil and gaze_vec and np.any(gaze_vec):
                    end_point = (
                        int(pupil[0] + gaze_vec[0] * 50),
                        int(pupil[1] + gaze_vec[1] * 50)
                    )
                    cv2.arrowedLine(image, (int(pupil[0]), int(pupil[1])), end_point, (0, 255, 0), 2)
        return image


if __name__ == '__main__':
    try:
        capture = cv2.VideoCapture(DEVICE_ID)
        capture.set(cv2.CAP_PROP_FPS, DESIRED_FPS)
        capture.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
        capture.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

        gesture_recognition = GestureRecognition(capture)
        visual_recognition = VisualRecognition()

        audio_thread = AudioRecognition()
        audio_thread.start()

        try:
            while True:
                ret, frame = capture.read()
                if ret:
                    # 处理手势识别
                    frame = gesture_recognition.process_frame(frame)
                    # 处理视觉识别
                    frame = visual_recognition.process_frame(frame)

                    cv2.imshow('Combined Recognition', frame)

                    key = cv2.waitKey(1)
                    if key in (27, ord('q')):
                        stop_event.set()  # 设置停止事件
                        break
                else:
                    break
        except KeyboardInterrupt:
            stop_event.set()  # 设置停止事件
            print("关闭...")
        finally:
            capture.release()
            cv2.destroyAllWindows()

        audio_thread.join()

    except Exception as e:
        print(f"程序运行失败: {str(e)}")
    finally:
        stop_event.set()
        print('程序运行结束')