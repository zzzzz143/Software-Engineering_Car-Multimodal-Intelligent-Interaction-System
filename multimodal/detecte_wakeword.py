import pvporcupine
import pyaudio
import struct
import os
from dotenv import load_dotenv
load_dotenv()

porcupine = pvporcupine.create(
    access_key = os.getenv('PORCUPINE_ACCESS_KEY'),
    keywords=["hey siri"]
)

pa = pyaudio.PyAudio()
audio_stream = pa.open(
    rate=porcupine.sample_rate,  # 采样率16000Hz
    channels=1,  # 单声道
    format=pyaudio.paInt16,  # 16位整型深度
    input=True,  # 输入流
    frames_per_buffer=porcupine.frame_length  # 每个缓冲区512帧
)

print("Listening for wake word...")

try:
    while True:
        pcm = audio_stream.read(porcupine.frame_length)  # 读取一个缓冲区的音频数据
        pcm = struct.unpack_from("h" * porcupine.frame_length, pcm)  # 解包为16位整型
        keyword_index = porcupine.process(pcm)
        if keyword_index >= 0:
            print("Wake word detected!")
except KeyboardInterrupt:
    print("Stopping...")
finally:
    audio_stream.stop_stream()
    audio_stream.close()
    pa.terminate()
    porcupine.delete()
