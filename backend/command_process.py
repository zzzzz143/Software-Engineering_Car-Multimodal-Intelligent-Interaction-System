import requests
import json
import datetime
import re
import os
from .config import Config

def load_instruction_set():
    """加载指令集"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    instruction_file_path = os.path.join(current_dir, "instrustions.json")
    try:
        with open(instruction_file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"无法加载指令集: {e}")
        return {"instructions": []}

def create_instruction_prompt():
    """创建指令集提示"""
    # 从指令集中提取示例
    instruction_set = load_instruction_set()
    examples = []
    
    if "instructions" in instruction_set and instruction_set["instructions"]:
        # 选择一些有代表性的示例（不同类型的操作）
        sample_instructions = []
        categories = {
            "安全": ["分心", "疲劳", "确认", "拒绝", "注意道路"],
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
    26: PREVIOUS - 上一首 - 用于切换至上一首曲目
    27: NEXT - 下一首 - 用于切换至下一首曲目
    28: CONFIRM - 确认 - 用于确认操作
    29: REJECT - 拒绝 - 用于拒绝操作
    30: CANCEL_EMERGENCY - 取消紧急操作 - 用于取消紧急呼叫、紧急制动等

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
    """发送请求到大模型API"""
    headers = {
        'Authorization': f'Bearer {Config.MODEL_API_KEY}',
        'Content-Type': 'application/json'
    }
    try:
        response = requests.post(Config.MODEL_API_URL, headers=headers, json=data)
        response.raise_for_status()  # 将引发异常，如果状态码不是200
        return response.json()
    except requests.RequestException as e:
        print("Request error:", e)
        return None

def create_history_file(user_id, file_prefix):
    """创建用户历史目录和文件"""
    if not user_id:
        raise ValueError("用户ID不能为空")
    
    # 构建路径
    base_dir = os.path.join(os.path.dirname(__file__), 'userHistory')
    user_history_dir = os.path.join(base_dir, f'history_{user_id}')
    
    # 创建目录结构
    os.makedirs(base_dir, exist_ok=True)
    os.makedirs(user_history_dir, exist_ok=True)
    
    # 构建完整文件路径
    filename = f'{file_prefix}_history_{user_id}.json'
    file_path = os.path.join(user_history_dir, filename)
    
    # 初始化文件内容
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump([], f)
    return file_path

def add_to_history(user_id, command, system_info, output, file_path, file_prefix, timestamp):
    """添加历史记录"""
    if not user_id:
        raise ValueError("用户ID不能为空")
 
    # 加载历史记录
    with open(file_path, 'r', encoding='utf-8') as f:
        history_data = json.load(f)

    # 添加新记录
    new_dialogue = {
        "timestamp": timestamp.isoformat(),
        "source": file_prefix,
        "system_info": system_info,
        "command": command,
        "response": output 
    }
    history_data.append(new_dialogue)
    # 保存更新后的历史记录
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(history_data, f, ensure_ascii=False, indent=4)

def create_config_file(user_id):
    """创建用户配置目录和文件"""
    if not user_id:
        raise ValueError("用户ID不能为空")

    # 构建基础路径
    base_dir = os.path.join(os.path.dirname(__file__), 'userConfig')
    os.makedirs(base_dir, exist_ok=True)

    # 构建完整文件路径
    filename = f'config_{user_id}.json'
    file_path = os.path.join(base_dir, filename)
    # 初始化文件内容
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump({"用户ID": user_id}, f, ensure_ascii=False, indent=4)
    return file_path

def load_user_config(config_file_path):
    """加载用户配置"""
    # 加载配置
    with open(config_file_path, 'r', encoding='utf-8') as f:
        config_data = json.load(f)
    return config_data.get("config", {})

def is_command_meaningful(command):
    """检查命令是否有意义"""
    # 1. 加载本地指令集
    instruction_set = load_instruction_set()
    valid_keywords = set()
    
    # 2. 提取指令集中的有效关键词（支持模糊匹配）
    for instr in instruction_set.get("instructions", []):
        # 拆分用户输入中的关键词（按空格、逗号分割）
        keywords = re.split(r'[,\s]+', instr["input"].lower())
        valid_keywords.update(keywords)
    
    # 3. 检查用户命令是否包含有效关键词
    command_lower = command.lower()
    has_valid_keyword = any(keyword in command_lower for keyword in valid_keywords)
    
    # 4. 若本地校验通过，返回True；否则调用大模型二次校验
    if has_valid_keyword:
        return True
    else:
        payload = {
            "model": Config.MODEL_NAME,
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

def extract_instruction_code(response_text):
    """从API响应中提取指令编码"""
    match = re.search(r'【instruction_code】\s*[:：]?\s*(.*?)(?:\s*【|\s*$)', response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def extract_decision(response_text):
    """从API响应中提取决策信息"""
    match = re.search(r'【decision】\s*[:：]?\s*(.*?)(?:\s*【|\s*$)', response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def extract_feedback(response_text):
    """从API响应中提取用户反馈信息"""
    match = re.search(r'【feedback】\s*[:：]?\s*(.*?)(?:\s*【|\s*$)', response_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return "无法提取feedback"

def process_command_generic(input_data, user_id, process_type):
    """命令处理
    
    input_data: command(语音指令)/ system_info(手势和视觉信息)
    process_type: user / system
    """
    try:
        # 创建用户历史文件
        history_file_path = create_history_file(user_id, process_type)
        # 创建用户配置文件
        config_file_path = create_config_file(user_id)
    except ValueError as e:
        return f"参数错误: {str(e)}"
    
    # 加载用户配置
    user_config = load_user_config(config_file_path)
    
    # 如果是command，检查命令是否有意义
    if process_type == "user" and not is_command_meaningful(input_data):
        return f"音频数据为空"
    
    # 获取指令集提示
    instruction_prompt = create_instruction_prompt()
    
    # 构建输入字符串
    input_str = (
        f'你是一个车载智能助手。可以参考的用户个性化配置信息如下：{json.dumps(user_config)}。\n'
        f'{instruction_prompt}\n'
        f'请分析以下{"用户指令" if process_type == "user" else "系统信息"}，给出标准指令编码和相应决策与反馈：\n'
        f'【{"用户指令" if process_type == "user" else "系统信息"}】{input_data}'
    )

    # 构建请求负载
    payload = {
        "model": Config.MODEL_NAME,
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
    # 发送API请求
    response = send_to_api(payload)
    if not response:
        return "无法处理请求"

    # 解析响应
    output = response.get('choices', [{}])[0].get('message', {}).get('content', '')
    
    # 提取指令编码
    instruction_code = extract_instruction_code(output)
    # 指令编码匹配逻辑
    if not instruction_code:
        instruction_set = load_instruction_set()
        for instr in instruction_set.get("instructions", []):
            input_key = instr["input"].lower()
            if (input_key in input_data.lower() or 
                input_data.lower() in input_key):
                instruction_code = instr["response"]
                if "【instruction_code】" not in output:
                    output = f"【instruction_code】{instruction_code}\n{output}"
                break

    # 记录历史
    add_to_history(
        user_id,
        input_data if process_type == "user" else "",
        input_data if process_type == "system" else "",
        output,
        history_file_path,
        process_type,
        datetime.datetime.now()
    )
    
    return {
        'instruction_code': instruction_code,
        'decision': extract_decision(output),
        'feedback': extract_feedback(output),
    }

def process_user_command(command, user_id=None):
    """语音指令处理入口"""
    return process_command_generic(command, user_id, 'user')

def process_system_info(system_info, user_id=None):
    """系统信息处理入口"""
    return process_command_generic(system_info, user_id, 'system')