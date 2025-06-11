import cv2
import numpy as np
from face_detection import FaceDetector
from head_pose_detector import HeadPoseDetector
from gaze_tracking import GazeTracker

def main():
    # 初始化检测器
    face_detector = FaceDetector()
    head_detector = HeadPoseDetector()
    gaze_tracker = GazeTracker()
    
    # 打开摄像头
    cap = cv2.VideoCapture(0)
    cap.set(3, 1280)
    cap.set(4, 720)
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("读取摄像头帧失败")
            continue
        
        # 检测面部
        face_data = face_detector.detect_face(image)
        
        if face_data:
            # 提取面部数据
            landmarks = face_data['landmarks']
            rotation_matrix = face_data['rotation_matrix']
            
            # 头部姿态检测
            head_result = head_detector.detect_head_movement(rotation_matrix)
            
            # 视线检测
            gaze_result = gaze_tracker.track_gaze(landmarks, image)
            
            # 绘制头部姿态角度
            cv2.putText(image, f"Pitch: {head_result['angles']['pitch']:+.1f}°", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Yaw: {head_result['angles']['yaw']:+.1f}°", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Roll: {head_result['angles']['roll']:+.1f}°", (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            
            cv2.putText(image, f"P_threshold: {head_result['thresholds']['nod']:+.1f}°", (10, 170),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"Y_threshold: {head_result['thresholds']['shake']:+.1f}°", (10, 200),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            cv2.putText(image, f"R_threshold: {head_result['thresholds']['roll']:+.1f}°", (10, 230),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 0, 200), 2)
            
            # 显示检测到的动作
            if head_result['time_since_last'] < head_detector.MOTION_INTERVAL:
                text = f"{head_result['action']}"
                text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 3)[0]
                cv2.putText(image, text, (image.shape[1] // 2 - text_size[0] // 2, image.shape[0] // 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
                
            # 绘制视线方向
            cv2.putText(image, f"Gaze: {gaze_result['direction']}", (30, 140),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # 绘制左右眼关键点和虹膜点
            for pt in gaze_result["left_eye"]["eye_landmarks"]:
                cv2.circle(image, pt, 1, (0, 255, 0), -1)
            for pt in gaze_result["right_eye"]["eye_landmarks"]:
                cv2.circle(image, pt, 1, (0, 255, 0), -1)
            for pt in gaze_result["left_eye"]["iris_landmarks"]:
                cv2.circle(image, pt, 1, (0, 0, 255), -1)
            for pt in gaze_result["right_eye"]["iris_landmarks"]:
                cv2.circle(image, pt, 1, (0, 0, 255), -1)
            
            # 绘制瞳孔中心
            if gaze_result["left_eye"]["pupil_center"]:
                cv2.circle(image, (int(gaze_result["left_eye"]["pupil_center"][0]), int(gaze_result["left_eye"]["pupil_center"][1])), 3, (255, 0, 255), -1)
            if gaze_result["right_eye"]["pupil_center"]:
                cv2.circle(image, (int(gaze_result["right_eye"]["pupil_center"][0]), int(gaze_result["right_eye"]["pupil_center"][1])), 3, (255, 0, 255), -1)
            
            # 绘制视线箭头
            for eye in ["left_eye", "right_eye"]:
                pupil = gaze_result[eye]["pupil_center"]
                gaze_vec = gaze_result[eye]["gaze_3d"]
                if pupil and gaze_vec and np.any(gaze_vec):
                    end_point = (
                        int(pupil[0] + gaze_vec[0] * 50),
                        int(pupil[1] + gaze_vec[1] * 50)
                    )
                    cv2.arrowedLine(image, (int(pupil[0]), int(pupil[1])), end_point, (0, 255, 0), 2)
        
        # 显示处理后的图像
        cv2.imshow('Visual Detection', image)
        
        # 按ESC键退出
        if cv2.waitKey(1) == 27:
            break
    
    # 释放资源
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()