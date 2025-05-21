import cv2
import mediapipe as mp
import numpy as np
from collections import deque
import time

class FaceDetector:
    def __init__(self):
        # 初始化面部网格检测器
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            max_num_faces=1,
            refine_landmarks=True  # 必须加上这一行
        )
        # 3D人脸坐标
        self.face_3d = np.array([
            [285, 528, 200],
            [285, 371, 152],
            [197, 574, 128],
            [173, 425, 108],
            [360, 574, 128],
            [391, 425, 108]
        ], dtype=np.float64)
        # 定义左右眼关键点索引
        self.left_eye_indices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        self.right_eye_indices = [263, 249, 390, 373, 374, 380, 381, 382, 362, 466, 384, 385, 386, 387, 388, 398]

    def detect_face(self, image):
        """检测面部并返回关键点和姿态信息"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image_rgb)
        h, w, _ = image.shape
        face_data = None

        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]
            # 提取特定关键点用于姿态估计
            face_2d = []
            for idx in [1, 9, 57, 130, 287, 359]:
                lm = face_landmarks.landmark[idx]
                face_2d.append([int(lm.x * w), int(lm.y * h)])
            face_2d = np.array(face_2d, dtype=np.float64)
            
            # 相机矩阵和畸变系数
            cam_matrix = np.array([[w, 0, w / 2], [0, w, h / 2], [0, 0, 1]], dtype=np.float64)
            dist_matrix = np.zeros((4, 1), dtype=np.float64)
            
            # 求解3D到2D投影，获取旋转和平移向量
            success, rvec, tvec = cv2.solvePnP(self.face_3d, face_2d, cam_matrix, dist_matrix)
            rotation_matrix, _ = cv2.Rodrigues(rvec)
            
            face_data = {
                'landmarks': face_landmarks,
                'rotation_matrix': rotation_matrix,
                'translation_vector': tvec,
                'face_2d': face_2d,
                'face_3d': self.face_3d,
                'cam_matrix': cam_matrix,
                'dist_matrix': dist_matrix,
            }

            
            
        return face_data