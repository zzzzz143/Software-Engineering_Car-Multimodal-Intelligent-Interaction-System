import base64
import cv2
import numpy as np
from gesture.gesture import GestureRecognition
from video.video import VisualRecognition
from audio.audio import AudioRecognition
import pvporcupine
import os
import wave
from dotenv import load_dotenv
load_dotenv()

def create_temp_audio(audio_bytes, user_id):
    """
    将 Base64 编码的音频数据解码并保存为临时 WAV 文件
    """
    if not user_id:
        raise ValueError("用户ID不能为空")
    
    # 构建路径
    audio_dir = os.path.join(os.path.dirname(__file__), 'audio')
    temp_audio_dir = os.path.join(audio_dir, 'tempAudio')
    
    # 创建目录结构
    os.makedirs(temp_audio_dir, exist_ok=True)

    # 构建完整文件路径
    filename = f'temp_audio_{user_id}.wav'
    temp_wav_path = os.path.join(temp_audio_dir, filename)

    # 保存临时音频文件
    with wave.open(temp_wav_path, 'wb') as wf:
        wf.setnchannels(1)  # 单声道
        wf.setsampwidth(2)  # 16 位
        wf.setframerate(16000)  # 采样率
        wf.writeframes(audio_bytes)
    return temp_wav_path

def detect_speech(audio_array, sample_rate=16000, threshold=0.1, min_length=0.3):
    """
    检测音频中是否包含有意义的语音内容
    
    参数:
    audio_array: 音频数据 numpy 数组
    sample_rate: 采样率 (Hz)
    threshold: 语音活动阈值 (0.0-1.0)
    min_length: 最小语音长度 (秒)
    
    返回:
    (bool, float): 是否包含语音, 语音部分比例
    """
    # 将音频数组归一化到 [-1, 1] 范围
    if audio_array.dtype == np.uint8:
        audio_norm = (audio_array.astype(np.float32) - 128) / 128.0
    elif audio_array.dtype == np.int16:
        audio_norm = audio_array.astype(np.float32) / 32768.0
    elif audio_array.dtype == np.int32:
        audio_norm = audio_array.astype(np.float32) / 2147483648.0
    else:
        audio_norm = audio_array.astype(np.float32)
    
    # 计算短时能量来检测语音活动
    frame_length = int(0.02 * sample_rate)  # 20ms 帧长
    hop_length = int(0.01 * sample_rate)   # 10ms 帧移
    
    # 分帧
    frames = []
    for i in range(0, len(audio_norm) - frame_length, hop_length):
        frames.append(audio_norm[i:i+frame_length])
    
    # 计算每帧的能量
    energies = np.array([np.sum(frame**2) / frame_length for frame in frames])
    
    # 归一化能量
    if energies.max() > 0:
        energies = energies / energies.max()
    
    # 基于能量的语音活动检测
    is_speech_frame = energies > threshold
    
    # 计算语音片段长度
    speech_frames = 0
    max_speech_length = 0
    current_length = 0
    
    for frame in is_speech_frame:
        if frame:
            current_length += 1
            speech_frames += 1
        else:
            if current_length > max_speech_length:
                max_speech_length = current_length
            current_length = 0
    
    # 检查最后一个片段
    if current_length > max_speech_length:
        max_speech_length = current_length
    
    # 转换为秒
    max_speech_length_sec = max_speech_length * hop_length / sample_rate
    speech_ratio = speech_frames / len(is_speech_frame) if len(is_speech_frame) > 0 else 0
    
    # 判断是否包含有意义的语音
    has_speech = max_speech_length_sec >= min_length and speech_ratio > 0.1
    
    return has_speech, speech_ratio

class MultimodalProcessor:
    def __init__(self):
        self.user_id = None
        self.gesture = None
        self.video = None
        self.audio = None
        self.porcupine = None  # 唤醒词检测器
        self.initialized = False
        self.wake_word = "hey siri"
    
    def initialize(self):
        """初始化所有模块"""
        self.initialized = True
        self.gesture = GestureRecognition(capture=None, user_id=self.user_id)
        self.video = VisualRecognition(user_id=self.user_id)
        self.audio = AudioRecognition(user_id=self.user_id)
        # 初始化唤醒词检测器
        try:
            self.porcupine = pvporcupine.create(
                access_key = os.getenv('PORCUPINE_ACCESS_KEY'),
                keywords=["hey siri"]
            )
        except Exception as e:
            print(f"唤醒词检测器初始化失败: {e}")
    
    def process_request(self, data, is_wake=False):
        """处理多模态请求"""
        print("多模态大模型接收请求")
        # print("多模态大模型接收请求:", data)
        
        try:
            if not self.initialized:
                self.user_id = data.get('user_id', self.user_id)
                self.wake_word = data.get('wake_word', self.wake_word)
                self.initialize()
            
            # 处理图像数据
            image_data = data.get('image')           
            if not image_data:
                raise ValueError({'error': 'Image data is missing'})
            
            # 去除Base64前缀
            base64_data = image_data.split(',')[1]
            
            try:
                # 解码 Base64 字符串为字节流
                img_bytes = base64.b64decode(base64_data)
                # 转换为NumPy数组
                img_array = np.frombuffer(img_bytes, dtype=np.uint8)
                # 解码为OpenCV图像
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            except Exception as e:
                print(f"Error decoding base64 image: {e}")
                raise ValueError({'error': 'Failed to decode image data'})
            
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
            
            # ========================================================================
            # 处理语音识别
            base64_audio = data.get('audio')

            if not base64_audio:
                raise ValueError({'error': 'Audio data is missing'})

            # 解码 Base64 字符串为 PCM(int16, 16kHz, mono)
            try:
                audio_bytes = base64.b64decode(base64_audio)
                # 保存为临时 WAV 文件
                temp_wav_path = create_temp_audio(audio_bytes, self.user_id)
                # 转换为NumPy数组
                audio_np = np.frombuffer(audio_bytes, dtype=np.int16)
            except Exception as e:
                print(f"Error decoding base64 audio: {e}")
                raise ValueError({'error': 'Failed to decode audio data'})

            # 检测唤醒词
            if self.porcupine:
                frame_length = self.porcupine.frame_length
                # Porcupine需要每次处理512样本的帧
                for i in range(0, len(audio_np) - frame_length + 1, frame_length):
                    frame = audio_np[i:i + frame_length]
                    keyword_index = self.porcupine.process(frame)
                    if keyword_index >= 0:
                        print("检测到唤醒词!!!")
                        # 如果检测到唤醒词，返回手势识别、视觉识别、唤醒词
                        return {
                            'gesture': gesture_recognized_text,
                            'video': video_recognized_text,
                            'audio': self.wake_word
                        }

            print("多模态大模型is_wake:", is_wake)
            # 如果未检测到唤醒词，且当前是未唤醒状态, 返回手势识别、视觉识别、"音频数据为空"
            if not is_wake:
                return {
                    'gesture': gesture_recognized_text,
                    'video': video_recognized_text,
                    'audio': "音频数据为空"
                }

            # 如果未检测到唤醒词，且当前是唤醒状态, 继续处理音频识别
            # 配置过滤参数
            min_speech_length = 0.3  # 最小语音长度(秒)
            speech_threshold = 0.1    # 语音活动阈值(0.0-1.0)
            max_silence_ratio = 1   # 最大静音比例
            
            # 内容过滤：检测静音和无意义内容
            is_speech, speech_ratio = detect_speech(audio_np, sample_rate=16000, 
                                                    threshold=speech_threshold, 
                                                    min_length=min_speech_length)
            
            # 如果语音比例过低，认为是无意义内容
            if not is_speech or speech_ratio < (1 - max_silence_ratio):
                # print("No meaningful speech detected")
                raise ValueError("No meaningful speech detected")
            
            print("多模态大模型处理音频识别")
            
            # 将音频数据传递给 AudioRecognition 实例进行处理
            audio_recognized_text = self.audio.recognize_speech(temp_wav_path)
            
            return {
                'gesture': gesture_recognized_text,
                'video': video_recognized_text,
                'audio': audio_recognized_text
            }
        except Exception as e:
            return { 'error': str(e) }