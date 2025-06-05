import json
import os
import re

class InstructionProcessor:
    """智能汽车交互系统指令处理器"""
    
    def __init__(self):
        self.instruction_set = self._load_instruction_set()
        
    def _load_instruction_set(self):
        """加载指令集"""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        instruction_file_path = os.path.join(current_dir, "instrustions.json")
        try:
            with open(instruction_file_path, 'r', encoding='utf-8') as file:
                return json.load(file)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"无法加载指令集: {e}")
            return {"instructions": []}
    
    def find_matching_instruction(self, user_input):
        """在指令集中查找匹配的指令"""
        if not self.instruction_set or "instructions" not in self.instruction_set:
            return None
            
        # 1. 尝试精确匹配
        for instruction in self.instruction_set["instructions"]:
            if instruction["input"].lower() == user_input.lower():
                return instruction["response"]
                
        # 2. 尝试部分匹配
        best_match = None
        highest_similarity = 0
        
        for instruction in self.instruction_set["instructions"]:
            # 简单的包含关系检查
            if instruction["input"].lower() in user_input.lower() or user_input.lower() in instruction["input"].lower():
                # 计算简单的相似度 - 共同字符数量除以较长字符串的长度
                common_chars = set(instruction["input"].lower()) & set(user_input.lower())
                similarity = len(common_chars) / max(len(instruction["input"]), len(user_input))
                
                if similarity > highest_similarity:
                    highest_similarity = similarity
                    best_match = instruction["response"]
        
        # 如果相似度超过阈值，返回最佳匹配
        if highest_similarity > 0.5:
            return best_match
            
        return None
    
    def validate_instruction_code(self, code):
        """验证指令编码格式是否正确"""
        # 基本格式：AABB[文字描述]
        basic_pattern = r'^\d{4}(\[.*\])?$'
        return re.match(basic_pattern, code) is not None
    
    def parse_instruction_code(self, code):
        """解析指令编码，返回操作码、操作数和参数"""
        if not self.validate_instruction_code(code):
            return None
            
        opcode = code[:2]
        operand = code[2:4]
        
        param = None
        param_match = re.search(r'\[(.*)\]', code)
        if param_match:
            param = param_match.group(1)
            
        return {
            "opcode": opcode,
            "operand": operand,
            "param": param
        }
    
    def get_operation_description(self, opcode, operand):
        """根据操作码和操作数获取操作描述"""
        # 操作码映射
        opcodes = {
            "00": "打开", "01": "关闭", "02": "设置", "03": "启动", 
            "04": "停止", "05": "增加", "06": "减少", "07": "切换",
            "08": "查询", "09": "调整", "10": "激活", "11": "停用",
            "12": "预约", "13": "取消预约", "14": "定位", "15": "连接",
            "16": "断开连接", "17": "同步", "18": "重置", "19": "改变模式"
        }
        
        # 操作数映射
        operands = {
            "01": "空调", "02": "导航系统", "03": "媒体播放器", 
            "04": "驾驶员车窗", "05": "乘客车窗", "06": "左后车窗", 
            "07": "右后车窗", "08": "天窗", "09": "驾驶员座椅加热",
            "10": "乘客座椅加热", "11": "方向盘加热", "12": "大灯",
            "13": "雾灯", "14": "车内灯", "15": "车门锁", "16": "后备箱",
            "17": "发动机", "18": "雨刷", "24": "巡航控制", "27": "蓝牙",
            "29": "电话", "37": "驾驶模式", "42": "氛围灯", "47": "语音助手",
            "49": "泊车辅助"
        }
        
        op = opcodes.get(opcode, "未知操作")
        obj = operands.get(operand, "未知对象")
        
        return f"{op}{obj}"
