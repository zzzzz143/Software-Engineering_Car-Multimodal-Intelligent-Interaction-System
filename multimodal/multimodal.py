import base64
import cv2
import numpy as np
from multimodal.gesture.gesture import GestureRecognition
from multimodal.video.video import VisualRecognition
from multimodal.audio.audio import AudioRecognition


class MultimodalProcessor:
    def __init__(self, user_id="default_user"):
        self.user_id = user_id
        self.gesture = None
        self.video = None
        # self.audio = None
        self.initialized = False
        
    def initialize(self):
        """初始化所有模块"""
        self.initialized = True
        self.gesture = GestureRecognition(capture=None, user_id=self.user_id)
        self.video = VisualRecognition(user_id=self.user_id)
        # self.audio = AudioRecognition(user_id=self.user_id)

    def process_request(self, data):
        """处理多模态请求"""
        # print("多模态大模型接收请求:", data)
        # print("多模态大模型接收请求")
        
        try:
            if not self.initialized:
                self.user_id = data.get('user_id')
                self.initialize()
            
            # 处理图像数据
            image_data = data.get('image')
            gesture_result = None
            video_result = None
            if image_data:
                # 去除Base64前缀
                base64_data = image_data.split(',')[1]
                # 解码为字节流
                img_bytes = base64.b64decode(base64_data)
                # 转换为NumPy数组
                img_array = np.frombuffer(img_bytes, dtype=np.uint8)
                # 解码为OpenCV图像
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                
                # print("处理手势识别")
                # 处理手势识别
                gesture_result = self.gesture.process_frame(frame)
                frame = gesture_result.get('frame')
                gesture_recognized_text = gesture_result.get('text')
                # print("手势识别结果:", gesture_recognized_text)
                
                # print("处理视觉识别")
                # 处理视觉识别
                video_result = self.video.process_frame(frame)
                frame = video_result.get('frame')
                video_recognized_text = video_result.get('text')
                # print("视觉识别结果:", video_recognized_text)
            
            # # 处理语音识别
            # audio_data = data.get('audio')
            # audio_recognized_text = None
            
            # if audio_data:
            #     audio_recognized_text = self.audio.process_audio(audio_data)
            
            # print("多模态大模型响应请求")
            return {
                'gesture': gesture_recognized_text,
                'video': video_recognized_text,
                # 'audio': audio_recognized_text
            }
        except Exception as e:
            return {'error': str(e)}

# 创建全局处理器实例（单例模式）
global_processor = MultimodalProcessor()

def process_multimodal_request(data):
    """处理多模态请求"""
    return global_processor.process_request(data)
