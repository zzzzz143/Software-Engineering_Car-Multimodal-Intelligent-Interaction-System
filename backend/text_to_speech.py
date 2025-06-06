# coding=utf-8

'''
requires Python 3.6 or later
pip install requests
'''
import base64
import json
import uuid
import requests

# 音色列表
VOICE_TYPES = [
    "BV001_streaming",  # 通用女声
    "BV002_streaming",  # 通用男声
    "BV056_streaming",  # 阳光男声
    "BV213_streaming",  # 广西表哥
    "BV115_streaming",  # 古风少御
    "BV021_streaming",  # 东北老铁
    "BV700_streaming",  # 灿灿
    "BV034_streaming",  # 知性姐姐-双语
    "BV019_streaming",  # 重庆小伙
    "BV033_streaming",  # 温柔小哥
    "BV007_streaming",  # 亲切女声
    "BV504_streaming",  # 活力男声-Jackson
    "BV005_streaming",  # 活泼女声
    "BV102_streaming",  # 儒雅青年
    "BV051_streaming",  # 奶气萌娃
    "BV113_streaming",  # 甜宠少御
    "BV701_streaming",  # 擎苍
    "BV503_streaming",  # 活力女声-Ariana
    "BV119_streaming"   # 通用赘婿
]

# 平台申请的appid, access_token以及cluster
appid = "3728712322"
access_token = "XERBNCyW5rdVldKlc_pe1C0nNCR9hkeN"
cluster = "volcano_tts"

host = "openspeech.bytedance.com"
api_url = f"https://{host}/api/v1/tts"

header = {"Authorization": f"Bearer;{access_token}"}

def generate_speech(text, voice_index=0):
    """
    生成语音数据
    :param text: 要转换为语音的文本
    :param voice_index: 音色索引值，默认为0
    :return: 语音数据
    """
    if voice_index < 0 or voice_index >= len(VOICE_TYPES):
        raise ValueError("Invalid voice index")

    voice_type = VOICE_TYPES[voice_index]

    request_json = {
        "app": {
            "appid": appid,
            "token": "access_token",
            "cluster": cluster
        },
        "user": {
            "uid": "388808087185088"
        },
        "audio": {
            "voice_type": voice_type,
            "encoding": "mp3",
            "speed_ratio": 1.0,
            "volume_ratio": 1.0,
            "pitch_ratio": 1.0,
        },
        "request": {
            "reqid": str(uuid.uuid4()),
            "text": text,
            "text_type": "plain",
            "operation": "query",
            "with_frontend": 1,
            "frontend_type": "unitTson"

        }
    }

    try:
        resp = requests.post(api_url, json.dumps(request_json), headers=header)
        resp_json = resp.json()
        if "data" in resp_json:
            data = resp_json["data"]
            return base64.b64decode(data)
        else:
            raise Exception(f"Failed to generate speech: {resp_json}")
    except Exception as e:
        raise e

# # 示例调用
# if __name__ == '__main__':
#     try:
#         speech_data = generate_speech("在下一个路口左转，有什么其他需要请随时call我！", voice_index=2)
#         with open("test_submit.mp3", "wb") as file_to_save:
#             file_to_save.write(speech_data)
#     except Exception as e:
#         print(f"Error: {e}")