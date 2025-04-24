# 手势部分
import time
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import HandLandmarkerOptions, HandLandmarkerResult
from mediapipe.framework.formats import landmark_pb2
import cv2
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
# 语音部分
import threading
import pyaudio
from funasr import AutoModel
from funasr.utils.postprocess_utils import rich_transcription_postprocess
import librosa
import io
import torchaudio
import wave


DEVICE_ID = 0
FPS = 30
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
GESTURE_WINDOW = 0.5  # 动态手势时间窗口（秒）

# 音频参数
CHUNK = 8012  # 每个缓冲区的帧数
FORMAT = pyaudio.paInt16  # 音频格式
CHANNELS = 1  # 单声道
RATE = 6500  # 采样率
THRESHOLD = 300  # 能量阈值
SILENCE_LIMIT = 1.0  # 无声时间阈值

# 全局变量
stop_event = threading.Event()  # 用于停止线程的事件

class GestureRecognition(threading.Thread):
    def __init__(self):
        super().__init__()
        self.init_video()
        self.init_mediapipe_hands_detector()
        self.prev_time = time.time()
        self.gesture_history = []  # 存储静态手势和时间戳
        self.gesture_map = {
            "Closed_Fist": "接听电话",
            "Open_Palm": "挂断电话",
            "Victory": "播放/关闭音乐",
            "Thumb_Left": "播放上一首音乐",
            "Thumb_Right": "播放下一首音乐",
            "Closed_Fist_To_Victory": "音量增加",
            "Victory_To_Closed_Fist": "音量减少",
            "Closed_Fist_To_Open_Palm": "放大地图",
            "Open_Palm_To_Closed_Fist": "缩小地图",
        }
        self.font = ImageFont.truetype("simhei.ttf", 24)  # 加载中文字体

    def init_video(self):
        self.capture = cv2.VideoCapture(DEVICE_ID)
        self.capture.set(cv2.CAP_PROP_FPS, FPS)
        self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
        self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    def init_mediapipe_hands_detector(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, './gesture/model', 'gesture_recognizer.task')
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.GestureRecognizerOptions(base_options=base_options)
        self.gesture_recognizer = vision.GestureRecognizer.create_from_options(options)

    def run(self):
        try:
            while True:
                ret, frame = self.capture.read()
                if ret:
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
                    result = self.gesture_recognizer.recognize(mp_image)

                    static_gesture = None  # 静态手势
                    dynamic_gesture = None  # 动态手势
                    gesture_score = 0.0
                    current_time = time.time()

                    # 获取静态手势
                    if result.gestures and result.gestures[0]:
                        static_gesture = result.gestures[0][0].category_name
                        gesture_score = result.gestures[0][0].score

                    # 更新手势历史
                    if static_gesture:
                        self.gesture_history.append((static_gesture, current_time))
                    
                    # 清除过期的手势
                    self.gesture_history = [(gesture, t) for gesture, t in self.gesture_history if current_time - t <= GESTURE_WINDOW]
                    
                    # 检测动态手势转换
                    if len(self.gesture_history) >= 2:
                        for i in range(len(self.gesture_history) - 1):
                            prev_gesture, prev_time = self.gesture_history[i]
                            curr_gesture, curr_time = self.gesture_history[-1]
                            time_diff = curr_time - prev_time
                            if time_diff <= GESTURE_WINDOW:
                                if prev_gesture == "Closed_Fist" and curr_gesture == "Victory":
                                    dynamic_gesture = "Closed_Fist_To_Victory"
                                    # print("Detected: Closed_Fist_To_Victory")
                                    self.gesture_history.clear()
                                    break
                                elif prev_gesture == "Victory" and curr_gesture == "Closed_Fist":
                                    dynamic_gesture = "Victory_To_Closed_Fist"
                                    # print("Detected: Victory_To_Closed_Fist")
                                    self.gesture_history.clear()
                                    break
                                elif prev_gesture == "Closed_Fist" and curr_gesture == "Open_Palm":
                                    dynamic_gesture = "Closed_Fist_To_Open_Palm"
                                    # print("Detected: Closed_Fist_To_Open_Palm")
                                    self.gesture_history.clear()
                                    break
                                elif prev_gesture == "Open_Palm" and curr_gesture == "Closed_Fist":
                                    dynamic_gesture = "Open_Palm_To_Closed_Fist"
                                    # print("Detected: Open_Palm_To_Closed_Fist")
                                    self.gesture_history.clear()
                                    break
                                

                    # 仅在无动态转换时检查关键点手势（如拇指、旋转）
                    if not dynamic_gesture and result.hand_landmarks:
                        hand_landmarks = result.hand_landmarks[0]  # 获取第一个检测到的手的关键点
                        points = [(lm.x, lm.y) for lm in hand_landmarks]  # 转换关键点数据结构
                        landmark_gesture = self.classify_gesture(points, current_time)
                        if landmark_gesture:
                            dynamic_gesture = landmark_gesture

                        # 绘制关键点
                        frame = self.draw_landmarks_on_image(frame, hand_landmarks)

                    # 转换为PIL格式
                    pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                    draw = ImageDraw.Draw(pil_img)

                    # 优先显示动态手势
                    display_gesture = dynamic_gesture or static_gesture
                    # 使用gesture_map映射最终显示名称
                    gesture_name = "无手势"
                    if display_gesture:
                        gesture_name = self.gesture_map.get(display_gesture,"无手势")
                    score_text = f" ({gesture_score:.2f})" if gesture_score and not dynamic_gesture else ""
                    
                    if gesture_name != "无手势":
                        print(f"检测到手势: {gesture_name}{score_text}")

                    draw.text((10, 30),
                            f"手势: {gesture_name}{score_text}",
                            font=self.font,
                            fill=(0, 255, 0, 255))

                    # 转换回OpenCV格式
                    frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

                    cv2.imshow('Hand Gesture Recognition', frame)

                    key = cv2.waitKey(1)
                    if key in (27, ord('q')):
                        break

        except KeyboardInterrupt:
            print("关闭...")
        finally:
            self.exit()
        

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
            
        fingers_curled = [ # 手指合拢
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

    def exit(self):
        self.capture.release()
        cv2.destroyAllWindows()


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
        model = AutoModel(
            model=model_dir,
            trust_remote_code=True,
            remote_code="./Audio/SenseVoiceSmall/model.py",
            vad_model="fsmn-vad",
            vad_kwargs={"max_single_segment_time": 30000},
            device="cuda:0",
        )
        return model

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

    def run(self):
        try:
            while True:
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




if __name__ == '__main__':
    try:
        gesture_thread = GestureRecognition()
        audio_thread = AudioRecognition()
        gesture_thread.start()
        audio_thread.start()
        gesture_thread.join()
        audio_thread.join()
    except Exception as e:
        print(f"程序运行失败: {str(e)}")
    finally:
        stop_event.set()
        print('程序运行结束')