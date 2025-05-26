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

from command_process import process_command,get_tts_with_default_refer,extract_feedback

# 音频参数
CHUNK = 8012  # 每个缓冲区的帧数
FORMAT = pyaudio.paInt16  # 音频格式
CHANNELS = 1  # 单声道
RATE = 6500  # 采样率
THRESHOLD = 300  # 能量阈值
SILENCE_LIMIT = 2.5  # 无声时间阈值

user_history_file_path = "../user_history.json"
system_history_file_path = "../system_history.json"


class AudioRecognition(threading.Thread):
    def __init__(self,stop_event,user_id):
        super().__init__()
        self.user_id = user_id
        self.p = pyaudio.PyAudio()
        self.stop_event = stop_event
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
        model_dir = "iic/SenseVoiceSmall"
        try:
            model = AutoModel(
                model=model_dir,
                trust_remote_code=True,
                remote_code="SenseVoiceSmall/model.py",
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

        # 使用 SenseVoice 模型进行识别
        if self.model:
            res = self.model.generate(
                input=audio_data,
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
            while not self.stop_event.is_set():
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
                            if not recognized_text=="音频数据为空":
                                result = process_command(recognized_text, self.user_id, user_history_file_path)
                                print(result)
                                # 提取反馈
                                feedback = extract_feedback(result)
                                print(feedback)
                                # 语音合成
                                get_tts_with_default_refer(feedback)

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
