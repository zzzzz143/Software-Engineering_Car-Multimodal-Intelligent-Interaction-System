import requests
import json
import datetime
import re

MODEL_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
API_KEY = "sk-d312c095790e4674998b1975c2ed5940"

def send_to_api(data):
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    try:
        response = requests.post(MODEL_API_URL, headers=headers, json=data)
        response.raise_for_status()  # 将引发异常，如果状态码不是200
        return response.json()
    except requests.RequestException as e:
        print("Request error:", e)
        return None

def load_user_config(user_id):
    config_file_path = f"../backend/UserConfig/user_config_{user_id}.json"
    try:
        with open(config_file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

def is_command_meaningful(command):
    payload = {
        "model": "qwen-plus",
        "messages": [
            {
                "role": "system",
                "content": f'你是一个车载智能助手。'
            },
            {
                "role": "user",
                "content": f'请判断以下命令是否有意义：{command}。回复格式为“有”或“无”。'
            }
        ]
    }
    response = send_to_api(payload)
    if response:
        content = response.get('choices', [{}])[0].get('message', {}).get('content', '')
        return content.lower().strip() == '有'
    return False

def process_command(command, user_id="", user_history_file_path="user_history.json"):
    user_config = load_user_config(user_id)
    # command一定不为空
    if not is_command_meaningful(command):
        return f"命令:{command} 无意义，已忽略"

    input_str = (
        f'你是一个车载智能助手。可以参考的用户个性化配置信息如下：{json.dumps(user_config)}。'
        f'请结合以下指令，给出对应的反馈,输出格式为【decision】+【feedback】,decision字段请说明车辆系统各部分应当分别做出什么决策,feedback部分请给出对驾驶员/乘客的反馈。\n'
        f'【instruction】:{command}'
    )

    payload = {
        "model": "qwen-plus",
        "messages": [
            {
                "role": "user",
                "content": input_str
            }
        ]
    }
    response = send_to_api(payload)
    if response:
        output = response.get('choices', [{}])[0].get('message', {}).get('content', '')
        add_to_history(command, "", output, user_history_file_path, "user", datetime.datetime.now())
        return output
    else:
        return "无法处理命令"

def process_system_info(system_info, user_id="",system_history_file_path="system_history.json"):
    system_history_info = read_history_info(system_history_file_path)
    user_config = load_user_config(user_id)
    input_str = (
        f'你是一个车载智能助手，系统信息如下：{system_info},可以参考的用户个性化配置信息如下：{json.dumps(user_config)}。'
        f'请结合系统信息，给出对应的反馈,输出格式为【decision】+【feedback】,decision字段请说明车辆系统各部分应当分别做出什么决策,feedback部分请给出反馈。'
    )

    payload = {
        "model": "qwen-plus",
        "messages": [
            {
                "role": "system",
                "content": input_str
            }
        ]
    }
    response = send_to_api(payload)
    if response:
        output = response.get('choices', [{}])[0].get('message', {}).get('content', '')
        add_to_history("", system_info, output, system_history_file_path, "system", datetime.datetime.now())
        return output
    else:
        return "无法处理系统信息"

def read_history_info(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            history_info = json.load(file)
    except FileNotFoundError:
        history_info = []
    except json.JSONDecodeError:
        history_info = []
    return history_info

def write_history_info(file_path, history_info):
    if len(history_info) > 10:
        history_info = history_info[-10:]
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(history_info, file, ensure_ascii=False, indent=4)

def add_to_history(command, system_info, output, history_file_path, source, timestamp):
    history_info = read_history_info(history_file_path)
    new_dialogue = {
        "timestamp": timestamp.isoformat(),
        "source": source,
        "system_info": system_info,
        "command": command,
        "response": output 
    }
    history_info.append(new_dialogue)
    write_history_info(history_file_path, history_info)

def extract_feedback(response_text):
    # 使用正则表达式提取feedback字段
    match = re.search(r'【feedback】(.*)', response_text)
    if match:
        return match.group(1).strip()  # 使用strip()去除可能的前后空白字符
    return "无法提取feedback"


## 语音合成部分
import requests
from pydub import AudioSegment
from pydub.playback import play
from io import BytesIO

# 服务的地址
base_url = "http://127.0.0.1:9880"

def get_tts_with_default_refer(text, text_language="zh"):
    params = {
        "text": text,
        "text_language": text_language
    }
    try:
        response = requests.get(f"{base_url}/", params=params, stream=True)
        response.raise_for_status()  # 检查请求是否成功
        
        # 直接从响应中读取音频数据并播放
        audio_segment = AudioSegment.from_file(BytesIO(response.content), format="wav")
        play(audio_segment)
        
        print("音频正在播放")
    except requests.exceptions.RequestException as e:
        print(f"请求失败：{e}")

# command = "理想同学"
# user_id = "user123"
# user_history_file_path = "user_history.json"
# system_history_file_path = "system_history.json"
# result = process_command(command, user_id, user_history_file_path)
# print(result)
# # 处理系统信息示例
# system_info_only = "检测到车舱里温度过高"
# result = process_system_info(system_info_only, user_id, system_history_file_path)
# print(result)