import requests
import json
import datetime
import re
import os

MODEL_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
API_KEY = "sk-d312c095790e4674998b1975c2ed5940"

# 加载指令集
def load_instruction_set():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    instruction_file_path = os.path.join(current_dir, "instrustions.json")
    try:
        with open(instruction_file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"无法加载指令集: {e}")
        return {"instructions": []}

# 创建指令集提示
def create_instruction_prompt():
    # 从指令集中提取示例
    instruction_set = load_instruction_set()
    examples = []
    
    if "instructions" in instruction_set and instruction_set["instructions"]:
        # 选择一些有代表性的示例（不同类型的操作）
        sample_instructions = []
        categories = {
            "温度控制": ["空调", "温度"],
            "导航": ["导航", "目的地"],
            "媒体控制": ["音乐", "音量"],
            "窗户控制": ["车窗", "天窗"],
            "灯光控制": ["灯", "灯光"],
            "高级功能": ["泊车", "驾驶模式", "蓝牙"]
        }
        
        # 为每个类别找到1-2个代表性示例
        for category, keywords in categories.items():
            category_examples = []
            for instruction in instruction_set["instructions"]:
                for keyword in keywords:
                    if keyword in instruction["input"] and len(category_examples) < 2:
                        category_examples.append(instruction)
                        break
            examples.extend(category_examples)
            
        # 如果示例太少，添加更多指令
        if len(examples) < 10 and len(instruction_set["instructions"]) > 10:
            examples.extend(instruction_set["instructions"][:10-len(examples)])
    
    # 构建示例字符串
    example_text = ""
    if examples:
        example_text = "示例指令:\n" + "\n".join([f"- 用户指令: \"{ex['input']}\" → 指令编码: {ex['response']}" for ex in examples])

    # 创建包含指令集规范的提示
    prompt = f"""
    你是智能汽车交互系统的核心处理组件。你需要将用户的自然语言指令转换为标准化的指令编码，并提供友好的反馈。

    ## 指令编码规范
    指令格式: AABB[文字描述]
    - AA: 操作码(00-99)，表示操作类型
    - BB: 操作数(00-99)，表示操作对象
    - [文字描述]: 可选，包含具体参数如温度值、地点名称等

    ## 完整操作码列表(2位十进制)
    00: TURN_ON - 打开 - 用于打开空调、灯光、车窗等设备
    01: TURN_OFF - 关闭 - 用于关闭空调、灯光、车窗等设备
    02: SET_VALUE - 设置值 - 用于设置温度值、音量大小、导航目的地等
    03: START - 启动 - 用于启动导航、播放音乐、启动发动机等
    04: STOP - 停止 - 用于停止导航、暂停媒体播放、停止发动机等
    05: INCREASE - 增加 - 用于增大音量、提高温度、加速等
    06: DECREASE - 减少 - 用于减小音量、降低温度、减速等
    07: TOGGLE - 切换 - 用于切换灯光模式、驾驶模式等
    08: QUERY - 查询 - 用于查询车辆状态、温度、电量等信息
    09: ADJUST - 调整 - 用于调整座椅位置、方向盘、后视镜等
    10: ACTIVATE - 激活 - 用于激活驾驶辅助功能、泊车辅助等
    11: DEACTIVATE - 停用 - 用于停用特定系统功能、驾驶辅助等
    12: SCHEDULE - 预约 - 用于预约空调启动时间等
    13: CANCEL_SCHEDULE - 取消预约 - 用于取消已预约的操作
    14: LOCATE - 定位 - 用于定位车辆位置
    15: CONNECT - 连接 - 用于连接蓝牙设备、手机等
    16: DISCONNECT - 断开连接 - 用于断开外部设备连接
    17: SYNC - 同步 - 用于同步设备数据、联系人等
    18: RESET - 重置 - 用于重置系统设置、多媒体系统等
    19: MODE_CHANGE - 模式改变 - 用于改变驾驶模式、空调模式等
    20: CUSTOM_SETTING - 自定义设置 - 用于设置个性化偏好
    21: SAVE_SETTING - 保存设置 - 用于保存当前配置
    22: LOAD_SETTING - 加载设置 - 用于加载已保存的配置
    23: EMERGENCY - 紧急操作 - 用于紧急呼叫、紧急制动等
    24: STATUS_UPDATE - 状态更新 - 用于更新系统状态信息
    25: CALCULATE - 计算 - 用于计算油耗、行程距离等

    ## 完整操作数列表(2位十进制)
    01: AC - 空调 - 控制温度、空调模式等
    02: NAVIGATION - 导航系统 - 设置目的地、规划路线等
    03: MEDIA_PLAYER - 媒体播放器 - 控制音乐播放、音量调节等
    04: WINDOW_DRIVER - 驾驶员车窗 - 控制驾驶员侧车窗开关
    05: WINDOW_PASSENGER - 乘客车窗 - 控制前排乘客侧车窗开关
    06: WINDOW_REAR_LEFT - 左后车窗 - 控制左后车窗开关
    07: WINDOW_REAR_RIGHT - 右后车窗 - 控制右后车窗开关
    08: SUNROOF - 天窗 - 控制天窗开关、倾斜等
    09: SEAT_HEATER_DRIVER - 驾驶员座椅加热 - 控制驾驶员座椅加热功能
    10: SEAT_HEATER_PASSENGER - 乘客座椅加热 - 控制乘客座椅加热功能
    11: STEERING_WHEEL_HEATER - 方向盘加热 - 控制方向盘加热功能
    12: HEADLIGHT - 大灯 - 控制前大灯开关、远近光切换等
    13: FOG_LIGHT - 雾灯 - 控制前/后雾灯开关
    14: INTERIOR_LIGHT - 车内灯 - 控制车内照明灯开关
    15: DOOR_LOCK - 车门锁 - 控制车门锁定/解锁
    16: TRUNK - 后备箱 - 控制后备箱开关
    17: ENGINE - 发动机 - 启动/停止发动机
    18: WIPERS - 雨刷 - 控制前雨刷开关、速度调节
    19: REAR_WIPER - 后雨刷 - 控制后雨刷开关、速度调节
    20: SIDE_MIRROR_LEFT - 左侧后视镜 - 调整左侧后视镜位置、加热等
    21: SIDE_MIRROR_RIGHT - 右侧后视镜 - 调整右侧后视镜位置、加热等
    22: REARVIEW_MIRROR - 车内后视镜 - 调节车内后视镜角度、防眩目等
    23: PARKING_BRAKE - 驻车制动 - 控制电子驻车制动
    24: CRUISE_CONTROL - 巡航控制 - 设置巡航速度、开关自适应巡航
    25: LANE_ASSIST - 车道辅助 - 控制车道保持、车道偏离预警等
    26: COLLISION_AVOIDANCE - 碰撞避免系统 - 控制前方碰撞预警、自动紧急制动等
    27: BLUETOOTH - 蓝牙 - 管理蓝牙设备连接
    28: WIFI - 无线网络 - 控制车内WiFi开关、连接设置
    29: PHONE - 电话 - 拨打/接听电话、管理通话
    30: TEXT_MESSAGE - 短信 - 阅读/发送短信
    31: BATTERY - 电池 - 电动车电池管理、状态查询
    32: CHARGING - 充电系统 - 控制充电功能、充电设置
    33: TIRE_PRESSURE - 胎压 - 监测轮胎压力、报警设置
    34: OIL_LEVEL - 机油液位 - 查询机油状态、提醒更换
    35: FUEL_LEVEL - 燃油液位 - 查询燃油状态、剩余里程
    36: AIR_SUSPENSION - 空气悬挂 - 调整悬挂高度、硬度等
    37: DRIVING_MODE - 驾驶模式 - 切换整体驾驶模式
    38: ECO_MODE - 经济模式 - 控制经济驾驶模式
    39: SPORT_MODE - 运动模式 - 控制运动驾驶模式
    40: COMFORT_MODE - 舒适模式 - 控制舒适驾驶模式
    41: AIR_QUALITY - 空气质量 - 监测车内空气质量、控制空气净化
    42: AMBIENT_LIGHTING - 氛围灯光 - 控制车内氛围灯颜色、亮度
    43: SEAT_POSITION_DRIVER - 驾驶员座椅位置 - 调节座椅前后、高低等位置
    44: SEAT_POSITION_PASSENGER - 乘客座椅位置 - 调节座椅前后、高低等位置
    45: MASSAGE_DRIVER - 驾驶员座椅按摩 - 控制座椅按摩功能、强度
    46: MASSAGE_PASSENGER - 乘客座椅按摩 - 控制座椅按摩功能、强度
    47: VOICE_ASSISTANT - 语音助手 - 激活/设置语音助手功能
    48: CAMERA_SYSTEM - 摄像头系统 - 控制车载摄像头、360度全景等
    49: PARKING_ASSIST - 泊车辅助 - 控制自动泊车、泊车引导等
    50: TRAFFIC_INFO - 交通信息 - 获取路况、交通事故等信息

    {example_text}

    ## 输出格式
    1. 【instruction_code】部分：包含符合规范的指令编码
    2. 【decision】部分：车辆系统应执行的具体决策
    3. 【feedback】部分：给用户的友好反馈

    请分析用户指令，提取关键操作和对象，生成标准指令编码，并给出适当决策和反馈。
    """
    return prompt

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

# 新增：提取指令编码
def extract_instruction_code(response_text):
    """从API响应中提取指令编码"""
    match = re.search(r'【instruction_code】\s*(.*?)(?:\s*【|\s*$)', response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

# 新增：提取决策信息
def extract_decision(response_text):
    """提取决策信息"""
    match = re.search(r'【decision】\s*(.*?)(?:\s*【|\s*$)', response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def extract_feedback(response_text):
    """提取用户反馈信息"""
    match = re.search(r'【feedback】\s*(.*?)(?:\s*【|\s*$)', response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return "无法提取feedback"

def process_command(command, user_id="", user_history_file_path="user_history.json"):
    user_config = load_user_config(user_id)
    # command一定不为空
    if not is_command_meaningful(command):
        return f"命令:{command} 无意义，已忽略"

    # 获取指令集提示
    instruction_prompt = create_instruction_prompt()
    
    input_str = (
        f'你是一个车载智能助手。可以参考的用户个性化配置信息如下：{json.dumps(user_config)}。\n\n'
        f'{instruction_prompt}\n\n'
        f'请分析以下用户指令，给出标准指令编码和相应决策与反馈：\n'
        f'【用户指令】{command}'
    )

    payload = {
        "model": "qwen-plus",
        "messages": [
            {
                "role": "system",
                "content": "你是智能汽车交互系统，需要将用户指令转换为标准指令编码。"
            },
            {
                "role": "user",
                "content": input_str
            }
        ]
    }
    response = send_to_api(payload)
    if response:
        output = response.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        # 尝试提取指令编码
        instruction_code = extract_instruction_code(output)
        
        # 如果没有提取到指令编码，尝试在已有指令集中匹配
        if not instruction_code:
            instruction_set = load_instruction_set()
            for instr in instruction_set.get("instructions", []):
                # 检查用户指令是否与已知指令相似
                if (instr["input"].lower() in command.lower() or 
                    command.lower() in instr["input"].lower()):
                    instruction_code = instr["response"]
                    
                    # 将找到的指令编码添加到输出中
                    if "【instruction_code】" not in output:
                        output = f"【instruction_code】{instruction_code}\n" + output
                    break
        
        add_to_history(command, "", output, user_history_file_path, "user", datetime.datetime.now())
        return output
    else:
        return "无法处理命令"

def process_system_info(system_info, user_id="", system_history_file_path="system_history.json"):
    system_history_info = read_history_info(system_history_file_path)
    user_config = load_user_config(user_id)
    
    # 获取指令集提示
    instruction_prompt = create_instruction_prompt()
    
    input_str = (
        f'你是一个车载智能助手，系统信息如下：{system_info}\n'
        f'可以参考的用户个性化配置信息如下：{json.dumps(user_config)}。\n\n'
        f'{instruction_prompt}\n\n'
        f'请分析系统信息，给出标准指令编码、系统决策和用户反馈：\n'
        f'【系统信息】{system_info}'
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

## 语音合成部分
from TTS.tts_http_demo import generate_speech

def instruction_code_handler(instruction_code):
    """
    指令编码处理函数，根据指令编码来控制系统对应部分/模拟输出
    :param instruction_code: 指令编码，格式为 AABB[文字描述]
    :return: 模拟的系统响应
    """
    # 解析指令编码
    if len(instruction_code) < 4:
        return "指令编码格式不正确"

    opcode = instruction_code[:2]
    operand = instruction_code[2:4]
    description = instruction_code[4:].strip("[]") if len(instruction_code) > 4 else ""

    # 模拟系统响应
    response = ""

    # 操作码 00: TURN_ON
    if opcode == "00":
        if operand == "01":
            response = "空调已开启"
        elif operand == "04":
            response = "驾驶员车窗已开启"
        elif operand == "08":
            response = "天窗已开启"
        elif operand == "12":
            response = "大灯已开启"
        elif operand == "14":
            response = "车内灯已开启"
        elif operand == "15":
            response = "车门锁已解锁"
        elif operand == "16":
            response = "后备箱已开启"
        elif operand == "17":
            response = "发动机已启动"
        elif operand == "27":
            response = "蓝牙已连接"
        elif operand == "28":
            response = "无线网络已开启"
        elif operand == "29":
            response = "电话已接听"
        elif operand == "32":
            response = "充电系统已启动"
        elif operand == "47":
            response = "语音助手已激活"
        elif operand == "48":
            response = "摄像头系统已启动"
        elif operand == "49":
            response = "泊车辅助已激活"
        else:
            response = f"未知设备 {operand} 已开启"

    # 操作码 01: TURN_OFF
    elif opcode == "01":
        if operand == "01":
            response = "空调已关闭"
        elif operand == "04":
            response = "驾驶员车窗已关闭"
        elif operand == "08":
            response = "天窗已关闭"
        elif operand == "12":
            response = "大灯已关闭"
        elif operand == "14":
            response = "车内灯已关闭"
        elif operand == "15":
            response = "车门锁已锁定"
        elif operand == "16":
            response = "后备箱已关闭"
        elif operand == "17":
            response = "发动机已关闭"
        elif operand == "27":
            response = "蓝牙已断开"
        elif operand == "28":
            response = "无线网络已关闭"
        elif operand == "29":
            response = "电话已挂断"
        elif operand == "32":
            response = "充电系统已停止"
        elif operand == "47":
            response = "语音助手已停用"
        elif operand == "48":
            response = "摄像头系统已关闭"
        elif operand == "49":
            response = "泊车辅助已停用"
        else:
            response = f"未知设备 {operand} 已关闭"

    # 操作码 02: SET_VALUE
    elif opcode == "02":
        if operand == "01":
            response = f"空调温度已设置为 {description} 度"
        elif operand == "03":
            response = f"媒体播放器音量已设置为 {description}"
        elif operand == "33":
            response = f"胎压已设置为 {description} 巴"
        elif operand == "34":
            response = f"机油液位已设置为 {description}"
        elif operand == "35":
            response = f"燃油液位已设置为 {description}"
        elif operand == "36":
            response = f"空气悬挂高度已设置为 {description}"
        elif operand == "43":
            response = f"驾驶员座椅位置已设置为 {description}"
        elif operand == "44":
            response = f"乘客座椅位置已设置为 {description}"
        else:
            response = f"未知设备 {operand} 的值已设置为 {description}"

    # 操作码 03: START
    elif opcode == "03":
        if operand == "02":
            response = f"导航已启动，目的地为 {description}"
        elif operand == "03":
            response = "媒体播放器已启动"
        elif operand == "17":
            response = "发动机已启动"
        elif operand == "32":
            response = "充电系统已启动"
        else:
            response = f"未知设备 {operand} 已启动"

    # 操作码 04: STOP
    elif opcode == "04":
        if operand == "02":
            response = "导航已停止"
        elif operand == "03":
            response = "媒体播放器已停止"
        elif operand == "17":
            response = "发动机已停止"
        elif operand == "32":
            response = "充电系统已停止"
        else:
            response = f"未知设备 {operand} 已停止"

    # 操作码 05: INCREASE
    elif opcode == "05":
        if operand == "01":
            response = "空调温度已升高"
        elif operand == "03":
            response = "媒体播放器音量已增大"
        elif operand == "36":
            response = "空气悬挂高度已升高"
        else:
            response = f"未知设备 {operand} 的值已增加"

    # 操作码 06: DECREASE
    elif opcode == "06":
        if operand == "01":
            response = "空调温度已降低"
        elif operand == "03":
            response = "媒体播放器音量已减小"
        elif operand == "36":
            response = "空气悬挂高度已降低"
        else:
            response = f"未知设备 {operand} 的值已减少"

    # 操作码 07: TOGGLE
    elif opcode == "07":
        if operand == "12":
            response = "大灯已切换"
        elif operand == "14":
            response = "车内灯已切换"
        elif operand == "09":
            response = "驾驶员座椅加热已切换"
        elif operand == "10":
            response = "乘客座椅加热已切换"
        elif operand == "11":
            response = "方向盘加热已切换"
        else:
            response = f"未知设备 {operand} 已切换"

    # 操作码 08: QUERY
    elif opcode == "08":
        if operand == "33":
            response = "当前胎压为 2.5 巴"
        elif operand == "34":
            response = "机油液位为正常"
        elif operand == "35":
            response = "燃油剩余量为 50%"
        elif operand == "31":
            response = "电池电量为 80%"
        elif operand == "41":
            response = "车内空气质量为良好"
        else:
            response = f"未知设备 {operand} 的状态已查询"

    # 操作码 09: ADJUST
    elif opcode == "09":
        if operand == "43":
            response = "驾驶员座椅位置已调整"
        elif operand == "44":
            response = "乘客座椅位置已调整"
        elif operand == "36":
            response = "空气悬挂高度已调整"
        else:
            response = f"未知设备 {operand} 已调整"

    # 操作码 10: ACTIVATE
    elif opcode == "10":
        if operand == "49":
            response = "泊车辅助已激活"
        elif operand == "25":
            response = "车道辅助已激活"
        elif operand == "26":
            response = "碰撞避免系统已激活"
        else:
            response = f"未知设备 {operand} 已激活"

    # 操作码 11: DEACTIVATE
    elif opcode == "11":
        if operand == "49":
            response = "泊车辅助已停用"
        elif operand == "25":
            response = "车道辅助已停用"
        elif operand == "26":
            response = "碰撞避免系统已停用"
        else:
            response = f"未知设备 {operand} 已停用"

    # 操作码 12: SCHEDULE
    elif opcode == "12":
        if operand == "01":
            response = f"空调已预约在 {description} 启动"
        elif operand == "32":
            response = f"充电系统已预约在 {description} 启动"
        else:
            response = f"未知设备 {operand} 已预约"

    # 操作码 13: CANCEL_SCHEDULE
    elif opcode == "13":
        if operand == "01":
            response = "空调预约已取消"
        elif operand == "32":
            response = "充电系统预约已取消"
        else:
            response = f"未知设备 {operand} 的预约已取消"

    # 操作码 14: LOCATE
    elif opcode == "14":
        response = "车辆位置已定位"

    # 操作码 15: CONNECT
    elif opcode == "15":
        if operand == "27":
            response = "蓝牙已连接"
        elif operand == "28":
            response = "无线网络已连接"
        else:
            response = f"未知设备 {operand} 已连接"

    # 操作码 16: DISCONNECT
    elif opcode == "16":
        if operand == "27":
            response = "蓝牙已断开"
        elif operand == "28":
            response = "无线网络已断开"
        else:
            response = f"未知设备 {operand} 已断开"

    # 操作码 17: SYNC
    elif opcode == "17":
        response = "设备数据已同步"

    # 操作码 18: RESET
    elif opcode == "18":
        response = "系统设置已重置"

    # 操作码 19: MODE_CHANGE
    elif opcode == "19":
        if operand == "37":
            response = "驾驶模式已切换"
        elif operand == "38":
            response = "经济模式已开启"
        elif operand == "39":
            response = "运动模式已开启"
        elif operand == "40":
            response = "舒适模式已开启"
        else:
            response = f"未知模式 {operand} 已切换"

    # 操作码 20: CUSTOM_SETTING
    elif opcode == "20":
        response = "个性化偏好已设置"

    # 操作码 21: SAVE_SETTING
    elif opcode == "21":
        response = "当前配置已保存"

    # 操作码 22: LOAD_SETTING
    elif opcode == "22":
        response = "已保存的配置已加载"

    # 操作码 23: EMERGENCY
    elif opcode == "23":
        response = "紧急操作已执行"

    # 操作码 24: STATUS_UPDATE
    elif opcode == "24":
        response = "系统状态信息已更新"

    # 操作码 25: CALCULATE
    elif opcode == "25":
        if operand == "35":
            response = "油耗已计算"
        elif operand == "34":
            response = "行程距离已计算"
        else:
            response = f"未知计算 {operand} 已完成"

    else:
        response = "未知指令"

    return response

# 测试示例
if __name__ == "__main__":
    print(instruction_code_handler("0201[22]"))  # 空调温度已设置为 22 度
    print(instruction_code_handler("0302[北京市朝阳区]"))  # 导航已启动，目的地为 北京市朝阳区
    print(instruction_code_handler("0001"))  # 空调已开启
    print(instruction_code_handler("0108"))  # 天窗已关闭
    print(instruction_code_handler("0503"))  # 媒体播放器音量已增大
    print(instruction_code_handler("1049"))  # 泊车辅助已激活
    print(instruction_code_handler("1939"))  # 未知指令
    print(instruction_code_handler("1527"))  # 蓝牙已连接
    print(instruction_code_handler("0833"))  # 当前胎压为 2.5 巴
    print(instruction_code_handler("1201[07:00]"))  # 空调已预约在 07:00 启动
    print(instruction_code_handler("1301"))  # 空调预约已取消


    # command = ["把空调温度调到24度","导航到南开大学津南校区","播放一些轻音乐","打开天窗","关闭车窗"]
    # user_id = "user123"
    # user_history_file_path = "user_history.json"
    # system_history_file_path = "system_history.json"
    
    
    # for cmd in command:
    #     print("===测试用户指令处理===")
    #     result = process_command(cmd, user_id, user_history_file_path)
    #     print(f"用户指令: {cmd}")
    #     print(f"指令编码: {extract_instruction_code(result)}")
    #     print(f"系统决策: {extract_decision(result)}")
    #     feedback = extract_feedback(result)
    #     print(f"用户反馈: {feedback}")
    #     try:
    #         speech_data = generate_speech(feedback, voice_index=2)  # 第二个参数为音色索引
    #         with open("TTS/test_submit.mp3", "wb") as file_to_save:
    #             file_to_save.write(speech_data)
    #     except Exception as e:
    #         print(f"Error: {e}")
    #     print(f"\n")

