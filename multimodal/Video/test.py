import cv2
class VisualRecognition:
    def __init__(self):
        from video_model import FaceDetector
        self.detector = FaceDetector()

    def process_frame(self, frame):
        return self.detector.process_face(frame)

if __name__ == '__main__':
    capture = cv2.VideoCapture(0)
    capture.set(cv2.CAP_PROP_FPS, 90)
    capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    visual_recognition = VisualRecognition()

    try:
        while True:
                ret, frame = capture.read()
                if ret:
                    # 处理视觉识别
                    frame = visual_recognition.process_frame(frame)

                    cv2.imshow('Combined Recognition', frame)

                    key = cv2.waitKey(1)
                    if key in (27, ord('q')):
                        break
    except KeyboardInterrupt:
        print("关闭...")
    finally:
        capture.release()
        cv2.destroyAllWindows()