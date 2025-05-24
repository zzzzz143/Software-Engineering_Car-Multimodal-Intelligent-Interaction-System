import json
import requests

def send_to_api(data):
    
    
    api_url = "http://example.com/api"
    response = requests.post(api_url, json=data)
    return response.json()

def read_history_info(file_path="history.json"):
    # 读取历史对话信息
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            history_info = json.load(file)
            # 确保历史信息最多只有10组对话数据
            if len(history_info) > 10:
                history_info = history_info[-10:]
    except FileNotFoundError:
        # 文件不存在时，返回空列表
        history_info = []
    except json.JSONDecodeError:
        # 文件内容不是有效的JSON时，返回空列表
        history_info = []
    return history_info

def process_command(command, system_info="", history_info=""):
    # 检查命令是否为空
    if not command:
        return "命令不能为空"

    # 构造包含系统信息、历史信息和当前命令的输入字符串
    input_str = (
        f'你是一个车载智能助手，系统信息如下：{system_info}。历史信息如下：{history_info}。'
        f'请结合以下指令，给出对应的反馈,输出格式为【decision】+【feedback】。\n'
        f'【instruction】:{command}'
    )

    # 构造请求数据
    data = {
        "input": input_str,
    }

    # 发送命令到API
    try:
        response = send_to_api(data)
        # 从响应中提取output值
        output = response.get("output", "")
        return output
    except Exception as e:
        # 处理API调用异常
        return f"调用API失败: {str(e)}"

# 示例用法
command = "打开空调"
system_info = "当前车速：60km/h，车内温度：24°C"
history_file_path = "history.json"
history_info = read_history_info(history_file_path)
result = process_command(command, system_info, json.dumps(history_info, ensure_ascii=False, indent=4))
print(result)