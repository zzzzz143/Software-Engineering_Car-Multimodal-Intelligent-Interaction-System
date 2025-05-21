import numpy as np
from collections import deque
import time

class HeadPoseDetector:
    def __init__(self):
        # 全局参数配置
        self.ALPHA = 0.3
        self.WINDOW_SIZE = 30
        self.DYNAMIC_THRESHOLD_RATIO = 1.5
        self.VERTICAL_SENSITIVITY = 2.0
        self.BASE_NOD_THRESH = 10
        self.BASE_SHAKE_THRESH = 10
        self.ZC_COUNT_THRESH = 2
        self.MOTION_INTERVAL = 1.5
        
        # 状态变量
        self.pitch_history = deque(maxlen=self.WINDOW_SIZE)
        self.yaw_history = deque(maxlen=self.WINDOW_SIZE)
        self.roll_history = deque(maxlen=self.WINDOW_SIZE)
        self.zero_cross = {
            'pitch': {'count': 0, 'prev_sign': 1, 'timestamps': deque(maxlen=20)},
            'yaw': {'count': 0, 'prev_sign': 1, 'timestamps': deque(maxlen=20)}
        }
        self.last_action_time = 0
        self.detected_action = ""

    def rotation_matrix_to_angles(self, rotation_matrix):
        """将旋转矩阵转换为欧拉角"""
        x = np.arctan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
        y = np.arctan2(-rotation_matrix[2, 0],
                       np.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2))
        z = np.arctan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
        return np.array([x, y, z]) * 180.0 / np.pi

    def calculate_dynamic_threshold(self, values, base_thresh, is_vertical=False):
        """计算动态阈值"""
        if len(values) < 5:
            return base_thresh
        recent_values = list(values)[-10:]
        avg_amplitude = np.mean(np.abs(recent_values))
        sensitivity = self.VERTICAL_SENSITIVITY if is_vertical else self.DYNAMIC_THRESHOLD_RATIO
        return max(base_thresh, avg_amplitude * sensitivity)

    def check_zero_cross(self, current_value, axis):
        """检测信号过零次数"""
        current_sign = 1 if current_value >= 0 else -1
        state = self.zero_cross[axis]
        
        # 检查是否发生过零
        if state['prev_sign'] != current_sign:
            current_time = time.time()
            
            # 移除超过0.3秒的时间戳
            cutoff_time = current_time - 0.3
            while state['timestamps'] and state['timestamps'][0] < cutoff_time:
                state['timestamps'].popleft()
            
            # 添加新的过零时间戳
            state['timestamps'].append(current_time)
        
        # 更新前一个符号状态
        state['prev_sign'] = current_sign
        
        # 只计算0.3秒内的过零次数
        current_time = time.time()
        cutoff_time = current_time - 0.3
        recent_timestamps = [t for t in state['timestamps'] if t >= cutoff_time]
        return len(recent_timestamps)

    def analyze_motion_pattern(self, values, threshold):
        """分析运动模式"""
        if len(values) < self.WINDOW_SIZE // 2:
            return False
        smoothed = np.convolve(values, np.ones(3) / 3, mode='valid')
        max_idx = np.argmax(smoothed)
        min_idx = np.argmin(smoothed)
        max_val = smoothed[max_idx]
        min_val = smoothed[min_idx]
        if abs(max_val - min_val) > threshold:
            time_diff = abs(max_idx - min_idx)
            if time_diff > len(smoothed) // 4 and (max_val * min_val < 0):
                return True
        return False

    def reset_zero_cross_counts(self):
        """重置过零计数器"""
        for axis in ['pitch', 'yaw']:
            self.zero_cross[axis]['timestamps'].clear()
            self.zero_cross[axis]['count'] = 0
            current_value = np.mean(list(getattr(self, f"{axis}_history"))[-5:]) if getattr(self, f"{axis}_history") else 0
            self.zero_cross[axis]['prev_sign'] = 1 if current_value >= 0 else -1

    def detect_head_movement(self, rotation_matrix):
        """检测头部动作"""
        # 转换为欧拉角
        euler_angles = self.rotation_matrix_to_angles(rotation_matrix)
        pitch, yaw, roll = euler_angles
        self.pitch_history.append(pitch)
        self.yaw_history.append(yaw)
        self.roll_history.append(roll)

        # 计算平滑角度
        smooth_pitch = np.mean(list(self.pitch_history)[-5:]) if self.pitch_history else 0
        smooth_yaw = np.mean(list(self.yaw_history)[-5:]) if self.yaw_history else 0
        
        # 计算动态阈值
        dyn_nod_thresh = self.calculate_dynamic_threshold(self.pitch_history, self.BASE_NOD_THRESH, is_vertical=True)
        dyn_shake_thresh = self.calculate_dynamic_threshold(self.yaw_history, self.BASE_SHAKE_THRESH)
        dyn_roll_thresh = self.calculate_dynamic_threshold(self.roll_history, 2)
        current_time = time.time()
        time_since_last = current_time - self.last_action_time

        detected_action = None
        
        # 检测点头动作
        pitch_zc = self.check_zero_cross(smooth_pitch, 'pitch')
        if len(self.pitch_history) >= self.WINDOW_SIZE and abs(smooth_pitch) < 20 and \
                dyn_nod_thresh > self.BASE_NOD_THRESH * 1.5 and \
                dyn_nod_thresh < self.BASE_NOD_THRESH * 2.5 and \
                pitch_zc >= self.ZC_COUNT_THRESH and time_since_last > self.MOTION_INTERVAL and \
                dyn_shake_thresh < self.BASE_SHAKE_THRESH * 1.05 and \
                dyn_roll_thresh < 6 and \
                dyn_roll_thresh > 3:
            detected_action = "NOD"
            self.last_action_time = current_time
            self.reset_zero_cross_counts()

        # 检测摇头动作
        yaw_zc = self.check_zero_cross(smooth_yaw, 'yaw')
        if len(self.yaw_history) >= self.WINDOW_SIZE and \
                dyn_shake_thresh > self.BASE_SHAKE_THRESH * 1.5 and \
                dyn_shake_thresh < self.BASE_SHAKE_THRESH * 4 and \
                yaw_zc >= self.ZC_COUNT_THRESH and time_since_last > self.MOTION_INTERVAL and \
                dyn_nod_thresh < self.BASE_NOD_THRESH * 1.05 and \
                dyn_roll_thresh < 12 and \
                dyn_roll_thresh > 6:
            detected_action = "SHAKE"
            self.last_action_time = current_time
            self.reset_zero_cross_counts()

        if detected_action:
            self.detected_action = detected_action
            
        return {
            'action': self.detected_action,
            'time_since_last': time_since_last,
            'angles': {
                'pitch': smooth_pitch,
                'yaw': smooth_yaw,
                'roll': roll
            },
            'thresholds': {
                'nod': dyn_nod_thresh,
                'shake': dyn_shake_thresh,
                'roll': dyn_roll_thresh
            },
            'zero_cross': {
                'pitch': pitch_zc,
                'yaw': yaw_zc
            }
        }    