import cv2
import numpy as np
import mediapipe as mp
import math
from collections import deque

# 视线方向常量
GAZE_DIRECTION_CENTER = "center"
GAZE_DIRECTION_LEFT = "left"
GAZE_DIRECTION_RIGHT = "right"
GAZE_DIRECTION_UP = "up"
GAZE_DIRECTION_DOWN = "down"
GAZE_DIRECTION_UP_LEFT = "up_left"
GAZE_DIRECTION_UP_RIGHT = "up_right"
GAZE_DIRECTION_DOWN_LEFT = "down_left"
GAZE_DIRECTION_DOWN_RIGHT = "down_right"

class GazeParams:
    LEFT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
    RIGHT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]
    RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]
    HORIZONTAL_RATIO_THRESHOLD = 0.13
    VERTICAL_RATIO_THRESHOLD = 0.15
    H_CENTER_THRESHOLD = 0.20   
    V_CENTER_THRESHOLD = 0.08
    UP_THRESHOLD_STRICTER = -0.08
    DOWN_THRESHOLD_STRICTER = 0.10
    VERTICAL_OFFSET = +0.30           
    PUPIL_DETECTION_THRESHOLD = 0.01
    EYE_SPHERE_RADIUS = 15.0
    DEPTH_SCALE_FACTOR = 0.003
    SMOOTHING_WINDOW_SIZE = 20  #
    POSITION_ALPHA = 0.15       
    DIRECTION_ALPHA = 0.3
    EYE_CONSISTENCY_THRESHOLD = 0.25
    VERTICAL_CONSISTENCY_WEIGHT = 0.7
    HORIZONTAL_CONSISTENCY_WEIGHT = 0.3
    LEFT_EYE_WEIGHT = 0.5
    RIGHT_EYE_WEIGHT = 0.5
    PITCH_COMPENSATION_FACTOR = 0.3

class GazeTracker:
    def __init__(self):
        self.left_h_ratio_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.left_v_ratio_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.right_h_ratio_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.right_v_ratio_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.left_pupil_center_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.right_pupil_center_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.left_gaze_direction_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.right_gaze_direction_history = deque(maxlen=GazeParams.SMOOTHING_WINDOW_SIZE)
        self.h_ratio_variance = 0.1
        self.v_ratio_variance = 0.1

    def _smooth_value(self, value_history, new_value, alpha=None):
        if not value_history:
            return new_value
        if alpha is None:
            alpha = GazeParams.POSITION_ALPHA
        if isinstance(new_value, tuple):
            prev_x, prev_y = value_history[-1]
            curr_x, curr_y = new_value
            return (alpha * curr_x + (1 - alpha) * prev_x,
                    alpha * curr_y + (1 - alpha) * prev_y)
        else:
            return alpha * new_value + (1 - alpha) * value_history[-1]

    def _enhanced_iris_detection(self, eye_region, landmarks):
        try:
            if eye_region.size == 0:
                return None
            gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh1 = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            thresh2 = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                            cv2.THRESH_BINARY_INV, 11, 2)
            thresh = cv2.bitwise_and(thresh1, thresh2)
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            min_area = eye_region.shape[0] * eye_region.shape[1] * GazeParams.PUPIL_DETECTION_THRESHOLD
            valid_contours = [c for c in contours if cv2.contourArea(c) > min_area]
            if valid_contours:
                best_contour = None
                darkest_value = 255
                for contour in valid_contours:
                    mask = np.zeros_like(gray)
                    cv2.drawContours(mask, [contour], 0, 255, -1)
                    mean_val = cv2.mean(gray, mask=mask)[0]
                    if mean_val < darkest_value:
                        darkest_value = mean_val
                        best_contour = contour
                if best_contour is not None:
                    M = cv2.moments(best_contour)
                    if M["m00"] != 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])
                        return (cx, cy)
        except Exception:
            pass
        return None

    def _calculate_eye_center(self, eye_landmarks):
        x_coords = [p[0] for p in eye_landmarks]
        y_coords = [p[1] for p in eye_landmarks]
        return (sum(x_coords) / len(x_coords), sum(y_coords) / len(y_coords))

    def _calculate_3d_gaze_direction(self, pupil_center, eye_center, image_height):
        if not pupil_center or not eye_center:
            return None
        ox, oy = eye_center
        px, py = pupil_center
        dx_2d = px - ox
        dy_2d = py - oy
        distance_2d = math.sqrt(dx_2d ** 2 + dy_2d ** 2)
        if distance_2d < 1e-6:
            return (0, 0, 1)
        depth_scale = image_height * GazeParams.DEPTH_SCALE_FACTOR
        r_squared = GazeParams.EYE_SPHERE_RADIUS ** 2
        d_squared = (distance_2d / depth_scale) ** 2
        value = r_squared - d_squared
        dz = math.sqrt(max(0.1, value)) if value >= 0 else 0.1
        norm = math.sqrt(dx_2d ** 2 + dy_2d ** 2 + (dz * depth_scale) ** 2)
        return (dx_2d / norm, dy_2d / norm, (dz * depth_scale) / norm)

    def _extract_eye_region(self, eye_landmarks, frame):
        eye_x_coords = [p[0] for p in eye_landmarks]
        eye_y_coords = [p[1] for p in eye_landmarks]
        x1 = max(0, int(min(eye_x_coords)) - 5)
        y1 = max(0, int(min(eye_y_coords)) - 5)
        x2 = min(frame.shape[1], int(max(eye_x_coords)) + 5)
        y2 = min(frame.shape[0], int(max(eye_y_coords)) + 5)
        if x2 <= x1 or y2 <= y1:
            return None, (x1, y1)
        eye_region = frame[y1:y2, x1:x2]
        return eye_region, (x1, y1)

    def _calculate_iris_position(self, eye_landmarks, iris_landmarks, frame=None):
        eye_x_coords = [p[0] for p in eye_landmarks]
        eye_y_coords = [p[1] for p in eye_landmarks]
        eye_left = min(eye_x_coords)
        eye_right = max(eye_x_coords)
        eye_top = min(eye_y_coords)
        eye_bottom = max(eye_y_coords)
        eye_width = max(eye_right - eye_left, 1e-5)
        eye_height = max(eye_bottom - eye_top, 1e-5)
        eye_center = self._calculate_eye_center(eye_landmarks)
        
        if len(iris_landmarks) >= 3:
            iris_pts = np.array(iris_landmarks, dtype=np.int32)
            (iris_center_x, iris_center_y), _ = cv2.minEnclosingCircle(iris_pts)
            iris_center = (iris_center_x, iris_center_y)
        else:
            iris_center_x = sum([p[0] for p in iris_landmarks]) / len(iris_landmarks)
            iris_center_y = sum([p[1] for p in iris_landmarks]) / len(iris_landmarks)
            iris_center = (iris_center_x, iris_center_y)
        if frame is not None:
            eye_region, offset = self._extract_eye_region(eye_landmarks, frame)
            if eye_region is not None and eye_region.size > 0:
                enhanced_iris = self._enhanced_iris_detection(eye_region,
                    [(p[0] - offset[0], p[1] - offset[1]) for p in eye_landmarks])
                if enhanced_iris:
                    iris_center = (enhanced_iris[0] + offset[0], enhanced_iris[1] + offset[1])
                    iris_center_x, iris_center_y = iris_center
        horizontal_ratio = 2 * (iris_center_x - eye_left) / eye_width - 1
        vertical_ratio = 2 * (iris_center_y - eye_top) / eye_height - 1
        vertical_ratio = vertical_ratio + GazeParams.VERTICAL_OFFSET
        vertical_ratio = max(-1.0, min(1.0, vertical_ratio))
        horizontal_ratio = max(-1.0, min(1.0, horizontal_ratio))
        gaze_3d = self._calculate_3d_gaze_direction(
            iris_center, eye_center, frame.shape[0] if frame is not None else 480)
        return horizontal_ratio, vertical_ratio, gaze_3d, iris_center

    def _check_eye_consistency(self, left_h_ratio, left_v_ratio, right_h_ratio, right_v_ratio):
        h_diff = abs(left_h_ratio - right_h_ratio)
        v_diff = abs(left_v_ratio - right_v_ratio)
        h_consistent = h_diff <= GazeParams.EYE_CONSISTENCY_THRESHOLD
        v_consistent = v_diff <= GazeParams.EYE_CONSISTENCY_THRESHOLD
        h_weight = GazeParams.HORIZONTAL_CONSISTENCY_WEIGHT
        v_weight = GazeParams.VERTICAL_CONSISTENCY_WEIGHT
        consistency_score = (h_weight * (1 - h_diff / max(1, abs(left_h_ratio) + abs(right_h_ratio))) +
                             v_weight * (1 - v_diff / max(1, abs(left_v_ratio) + abs(right_v_ratio))))
        is_consistent = h_consistent and v_consistent
        return is_consistent, consistency_score

    def _determine_gaze_direction(self, left_h_ratio, left_v_ratio, left_gaze_3d,
                                 right_h_ratio, right_v_ratio, right_gaze_3d,
                                 head_pitch=0.0, head_yaw=0.0):
        is_consistent, consistency_score = self._check_eye_consistency(
            left_h_ratio, left_v_ratio, right_h_ratio, right_v_ratio)
        smooth_left_h = self._smooth_value(self.left_h_ratio_history, left_h_ratio)
        smooth_left_v = self._smooth_value(self.left_v_ratio_history, left_v_ratio)
        smooth_right_h = self._smooth_value(self.right_h_ratio_history, right_h_ratio)
        smooth_right_v = self._smooth_value(self.right_v_ratio_history, right_v_ratio)
        self.left_h_ratio_history.append(smooth_left_h)
        self.left_v_ratio_history.append(smooth_left_v)
        self.right_h_ratio_history.append(smooth_right_h)
        self.right_v_ratio_history.append(smooth_right_v)
        h_ratios = list(self.left_h_ratio_history) + list(self.right_h_ratio_history)
        v_ratios = list(self.left_v_ratio_history) + list(self.right_v_ratio_history)
        if len(h_ratios) >= 3:
            self.h_ratio_variance = np.var(h_ratios) + 0.05
            self.v_ratio_variance = np.var(v_ratios) + 0.05
        left_weight = GazeParams.LEFT_EYE_WEIGHT
        right_weight = GazeParams.RIGHT_EYE_WEIGHT
        if not is_consistent:
            if abs(smooth_left_v) >= abs(smooth_right_v):
                left_weight = 0.7
                right_weight = 0.3
            else:
                left_weight = 0.3
                right_weight = 0.7
        avg_h_ratio = left_weight * smooth_left_h + right_weight * smooth_right_h
        avg_v_ratio = left_weight * smooth_left_v + right_weight * smooth_right_v
        mirrored_h_ratio = -avg_h_ratio
        h_center_threshold = GazeParams.H_CENTER_THRESHOLD
        v_center_threshold = GazeParams.V_CENTER_THRESHOLD
        h_threshold = GazeParams.HORIZONTAL_RATIO_THRESHOLD
        v_threshold = GazeParams.VERTICAL_RATIO_THRESHOLD
        pitch_compensation = head_pitch * GazeParams.PITCH_COMPENSATION_FACTOR
        camera_v_ratio = avg_v_ratio + pitch_compensation
        camera_v_ratio = max(-1.0, min(1.0, camera_v_ratio))
        position_confidence = max(abs(mirrored_h_ratio), abs(camera_v_ratio))
        confidence = position_confidence * consistency_score

        # 9区分区逻辑
        # 1. 先判断严格的center
        if abs(mirrored_h_ratio) <= h_threshold and abs(camera_v_ratio) <= v_center_threshold:
            return GAZE_DIRECTION_CENTER, confidence, mirrored_h_ratio, camera_v_ratio
        # 2. up/down主区
        elif camera_v_ratio <= GazeParams.UP_THRESHOLD_STRICTER:
            if abs(mirrored_h_ratio) <= h_center_threshold:
                return GAZE_DIRECTION_UP, confidence, mirrored_h_ratio, camera_v_ratio
            elif mirrored_h_ratio > h_center_threshold:
                return GAZE_DIRECTION_UP_RIGHT, confidence, mirrored_h_ratio, camera_v_ratio
            elif mirrored_h_ratio < -h_center_threshold:
                return GAZE_DIRECTION_UP_LEFT, confidence, mirrored_h_ratio, camera_v_ratio
        elif camera_v_ratio >= GazeParams.DOWN_THRESHOLD_STRICTER:
            if abs(mirrored_h_ratio) <= h_center_threshold:
                return GAZE_DIRECTION_DOWN, confidence, mirrored_h_ratio, camera_v_ratio
            elif mirrored_h_ratio > h_center_threshold:
                return GAZE_DIRECTION_DOWN_RIGHT, confidence, mirrored_h_ratio, camera_v_ratio
            elif mirrored_h_ratio < -h_center_threshold:
                return GAZE_DIRECTION_DOWN_LEFT, confidence, mirrored_h_ratio, camera_v_ratio
        # 3. 左右主区
        else:
            if mirrored_h_ratio > h_threshold:
                return GAZE_DIRECTION_RIGHT, confidence, mirrored_h_ratio, camera_v_ratio
            elif mirrored_h_ratio < -h_threshold:
                return GAZE_DIRECTION_LEFT, confidence, mirrored_h_ratio, camera_v_ratio
            else:
                # 对角区域时center范围更大
                return GAZE_DIRECTION_CENTER, confidence, mirrored_h_ratio, camera_v_ratio

    def track_gaze(self, landmarks, frame):
        h, w, _ = frame.shape
        gaze_result = {
            "direction": GAZE_DIRECTION_CENTER,
            "confidence": 0.0,
            "horizontal_ratio": 0.0,
            "vertical_ratio": 0.0,
            "left_eye": {
                "iris_position": None,
                "eye_landmarks": [],
                "iris_landmarks": [],
                "pupil_center": None,
                "gaze_3d": None
            },
            "right_eye": {
                "iris_position": None,
                "eye_landmarks": [],
                "iris_landmarks": [],
                "pupil_center": None,
                "gaze_3d": None
            }
        }
        left_eye_landmarks = []
        right_eye_landmarks = []
        left_iris_landmarks = []
        right_iris_landmarks = []
        for idx, landmark in enumerate(landmarks.landmark):
            x, y, z = landmark.x, landmark.y, landmark.z
            pixel_x, pixel_y = int(x * w), int(y * h)
            if idx in GazeParams.LEFT_EYE_INDICES:
                left_eye_landmarks.append((pixel_x, pixel_y))
            if idx in GazeParams.RIGHT_EYE_INDICES:
                right_eye_landmarks.append((pixel_x, pixel_y))
            if idx in GazeParams.LEFT_IRIS_INDICES:
                left_iris_landmarks.append((pixel_x, pixel_y))
            if idx in GazeParams.RIGHT_IRIS_INDICES:
                right_iris_landmarks.append((pixel_x, pixel_y))
       
        if (len(left_eye_landmarks) == len(GazeParams.LEFT_EYE_INDICES) and
            len(right_eye_landmarks) == len(GazeParams.RIGHT_EYE_INDICES) and
            len(left_iris_landmarks) == len(GazeParams.LEFT_IRIS_INDICES) and
            len(right_iris_landmarks) == len(GazeParams.RIGHT_IRIS_INDICES)):
            left_h_ratio, left_v_ratio, left_gaze_3d, left_pupil = self._calculate_iris_position(
                left_eye_landmarks, left_iris_landmarks, frame)
            right_h_ratio, right_v_ratio, right_gaze_3d, right_pupil = self._calculate_iris_position(
                right_eye_landmarks, right_iris_landmarks, frame)
           
            if left_pupil:
                smooth_left_pupil = self._smooth_value(
                    self.left_pupil_center_history, left_pupil)
                self.left_pupil_center_history.append(smooth_left_pupil)
            else:
                smooth_left_pupil = None
            if right_pupil:
                smooth_right_pupil = self._smooth_value(
                    self.right_pupil_center_history, right_pupil)
                self.right_pupil_center_history.append(smooth_right_pupil)
            else:
                smooth_right_pupil = None
            if left_gaze_3d:
                self.left_gaze_direction_history.append(left_gaze_3d)
            if right_gaze_3d:
                self.right_gaze_direction_history.append(right_gaze_3d)
            direction, confidence, compensated_h_ratio, compensated_v_ratio = self._determine_gaze_direction(
                left_h_ratio, left_v_ratio, left_gaze_3d,
                right_h_ratio, right_v_ratio, right_gaze_3d
            )
            
            gaze_result["direction"] = direction
            gaze_result["confidence"] = float(confidence)
            gaze_result["horizontal_ratio"] = float(compensated_h_ratio)
            gaze_result["vertical_ratio"] = float(compensated_v_ratio)
            gaze_result["left_eye"]["iris_position"] = (float(left_h_ratio), float(left_v_ratio))
            gaze_result["right_eye"]["iris_position"] = (float(right_h_ratio), float(right_v_ratio))
            gaze_result["left_eye"]["eye_landmarks"] = left_eye_landmarks
            gaze_result["right_eye"]["eye_landmarks"] = right_eye_landmarks
            gaze_result["left_eye"]["iris_landmarks"] = left_iris_landmarks
            gaze_result["right_eye"]["iris_landmarks"] = right_iris_landmarks
            gaze_result["left_eye"]["pupil_center"] = smooth_left_pupil
            gaze_result["right_eye"]["pupil_center"] = smooth_right_pupil
            gaze_result["left_eye"]["gaze_3d"] = left_gaze_3d
            gaze_result["right_eye"]["gaze_3d"] = right_gaze_3d
        return gaze_result
