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
from command_process import process_system_info,get_tts_with_default_refer,extract_feedback

user_history_file_path = "../user_history.json"
system_history_file_path = "../system_history.json"

class VisualRecognition:
    def __init__(self,user_id):
        from Video.face_detection import FaceDetector
        from Video.head_pose_detector import HeadPoseDetector
        from Video.gaze_tracking import GazeTracker

        self.user_id = user_id
        self.face_detector = FaceDetector()
        self.head_detector = HeadPoseDetector()
        self.gaze_tracker = GazeTracker()
        self.last_action = None
        self.last_gaze_status = "center"
        self.gaze_away_start_time = None
        self.DISTRACTION_THRESHOLD = 1.5

    def process_frame(self, frame):
        image = frame.copy()
        face_data = self.face_detector.detect_face(image)
        if face_data:
            landmarks = face_data['landmarks']
            rotation_matrix = face_data['rotation_matrix']

            # 头部姿态检测
            head_result = self.head_detector.detect_head_movement(rotation_matrix)

            # 视线检测
            gaze_result = self.gaze_tracker.track_gaze(landmarks, image)

            # 终端输出点头/摇头
            if head_result['action'] in ("NOD", "SHAKE") and head_result['action'] != self.last_action:
                print(f"检测到动作：{head_result['action']}")
                self.last_action = head_result['action']
            elif head_result['action'] not in ("NOD", "SHAKE"):
                self.last_action = None

            # 改进分心/疲劳判定
            gaze_dir = gaze_result['direction']
            now = time.time()
            # 只对主方向做判定
            if gaze_dir in ("left", "right", "up", "down"):
                if self.gaze_away_start_time is None:
                    self.gaze_away_start_time = now
                elif now - self.gaze_away_start_time > self.DISTRACTION_THRESHOLD:
                    if self.last_gaze_status != "distracted":
                        print("警告：检测到驾驶员持续分心或疲劳！")
                        result = process_system_info("警告：检测到驾驶员持续分心或疲劳！", self.user_id, system_history_file_path)
                        print(result)
                        # 提取反馈
                        feedback = extract_feedback(result)
                        print(feedback)
                        # 语音合成
                        get_tts_with_default_refer(feedback)
                        self.last_gaze_status = "distracted"
            else:
                self.gaze_away_start_time = None
                self.last_gaze_status = "center"

            # 可视化部分同前
            cv2.putText(image, f"Pitch: {head_result['angles']['pitch']:+.1f}°", (10, 230),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Yaw: {head_result['angles']['yaw']:+.1f}°", (10, 260),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Roll: {head_result['angles']['roll']:+.1f}°", (10, 290),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)

            cv2.putText(image, f"P_threshold: {head_result['thresholds']['nod']:+.1f}°", (10, 370),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Y_threshold: {head_result['thresholds']['shake']:+.1f}°", (10, 400),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"R_threshold: {head_result['thresholds']['roll']:+.1f}°", (10, 430),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)

            if head_result['time_since_last'] < self.head_detector.MOTION_INTERVAL:
                text = f"{head_result['action']}"
                text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)[0]
                cv2.putText(image, text, (image.shape[1] // 2 - text_size[0] // 2, image.shape[0] // 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)

            cv2.putText(image, f"Gaze: {gaze_result['direction']}", (30, 140),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)

            for pt in gaze_result["left_eye"]["iris_landmarks"]:
                cv2.circle(image, pt, 1, (0, 0, 255), -1)
            for pt in gaze_result["right_eye"]["iris_landmarks"]:
                cv2.circle(image, pt, 1, (0, 0, 255), -1)

            if gaze_result["left_eye"]["pupil_center"]:
                cv2.circle(image, (int(gaze_result["left_eye"]["pupil_center"][0]), int(gaze_result["left_eye"]["pupil_center"][1])), 3, (255, 0, 255), -1)
            if gaze_result["right_eye"]["pupil_center"]:
                cv2.circle(image, (int(gaze_result["right_eye"]["pupil_center"][0]), int(gaze_result["right_eye"]["pupil_center"][1])), 3, (255, 0, 255), -1)

            for eye in ["left_eye", "right_eye"]:
                pupil = gaze_result[eye]["pupil_center"]
                gaze_vec = gaze_result[eye]["gaze_3d"]
                if pupil and gaze_vec and np.any(gaze_vec):
                    end_point = (
                        int(pupil[0] + gaze_vec[0] * 50),
                        int(pupil[1] + gaze_vec[1] * 50)
                    )
                    cv2.arrowedLine(image, (int(pupil[0]), int(pupil[1])), end_point, (0, 255, 0), 2)
        return image

