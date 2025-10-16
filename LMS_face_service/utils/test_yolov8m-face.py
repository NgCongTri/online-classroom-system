import cv2
import time
from ultralytics import YOLO
import numpy as np
import os

class FaceDetectionTester:
    def __init__(self, model_path=r"LMS_face_service\models\yolov8m-face.pt"):
        self.model = YOLO(model_path)
        self.cap = None
        
        # Metrics
        self.total_frames = 0
        self.total_detections = 0
        self.fps_list = []
        self.confidence_list = []
        
    def start_webcam(self, camera_id=0):
        """Khởi động webcam"""
        self.cap = cv2.VideoCapture(camera_id)
        if not self.cap.isOpened():
            raise ValueError(f"Không thể mở camera {camera_id}")
        
        # Cài đặt resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
    def detect_faces(self, frame, conf_threshold=0.5):
        """
        Phát hiện khuôn mặt trong frame
        Args:
            frame: ảnh đầu vào
            conf_threshold: ngưỡng confidence
        Returns:
            results: kết quả detection
        """
        results = self.model(frame, conf=conf_threshold, verbose=False)
        return results
    
    def draw_detections(self, frame, results):
        """Vẽ bounding box và thông tin lên frame"""
        faces_count = 0
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Lấy tọa độ
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                conf = float(box.conf[0])
                
                # Lưu confidence
                self.confidence_list.append(conf)
                faces_count += 1
                
                # Vẽ bounding box
                color = (0, 255, 0)  # Màu xanh lá
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                # Vẽ confidence score
                label = f'Face: {conf:.2f}'
                cv2.putText(frame, label, (x1, y1 - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return frame, faces_count
    
    def draw_metrics(self, frame, fps, faces_count):
        """Vẽ các metrics lên frame"""
        height, width = frame.shape[:2]
        
        # Tạo panel thông tin
        panel_height = 120
        panel = np.zeros((panel_height, width, 3), dtype=np.uint8)
        panel[:] = (50, 50, 50)  # Màu xám đậm
        
        # Thông tin hiển thị
        avg_fps = np.mean(self.fps_list) if self.fps_list else 0
        avg_conf = np.mean(self.confidence_list) if self.confidence_list else 0
        
        info = [
            f'FPS: {fps:.1f} | Avg FPS: {avg_fps:.1f}',
            f'Faces Detected: {faces_count}',
            f'Total Detections: {self.total_detections}',
            f'Avg Confidence: {avg_conf:.2f}',
            f'Total Frames: {self.total_frames}'
        ]
        
        y_offset = 25
        for i, text in enumerate(info):
            cv2.putText(panel, text, (10, y_offset + i*20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        # Ghép panel với frame
        result = np.vstack([panel, frame])
        return result
    
    def run(self, conf_threshold=0.5, show_fps=True):
        """
        Chạy detection realtime
        Args:
            conf_threshold: ngưỡng confidence
            show_fps: hiển thị FPS
        """
        print("=== YOLOv8-Face Detection Test ===")
        print(f"Confidence Threshold: {conf_threshold}")
        print("Nhấn 'q' để thoát")
        print("Nhấn 's' để lưu screenshot")
        print("Nhấn 'r' để reset metrics")
        
        prev_time = time.time()
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("Không thể đọc frame từ webcam")
                break
            
            # Flip frame để hiển thị như gương
            frame = cv2.flip(frame, 1)
            
            # Detect faces
            results = self.detect_faces(frame, conf_threshold)
            
            # Vẽ detection
            frame, faces_count = self.draw_detections(frame, results)
            
            # Tính FPS
            current_time = time.time()
            fps = 1 / (current_time - prev_time)
            prev_time = current_time
            self.fps_list.append(fps)
            
            # Giới hạn độ dài list
            if len(self.fps_list) > 30:
                self.fps_list.pop(0)
            
            # Update metrics
            self.total_frames += 1
            self.total_detections += faces_count
            
            # Vẽ metrics
            display_frame = self.draw_metrics(frame, fps, faces_count)
            
            # Hiển thị
            cv2.imshow('YOLOv8-Face Detection Test', display_frame)
            
            # Xử lý phím
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                # Lưu screenshot
                filename = f'screenshot_{int(time.time())}.jpg'
                cv2.imwrite(filename, display_frame)
                print(f'Đã lưu: {filename}')
            elif key == ord('r'):
                # Reset metrics
                self.reset_metrics()
                print('Đã reset metrics')
        
        self.cleanup()
    
    def reset_metrics(self):
        """Reset các metrics"""
        self.total_frames = 0
        self.total_detections = 0
        self.fps_list = []
        self.confidence_list = []
    
    def print_summary(self):
        """In thống kê tổng hợp"""
        print("\n=== THỐNG KÊ TỔNG HỢP ===")
        print(f"Tổng số frame: {self.total_frames}")
        print(f"Tổng số khuôn mặt phát hiện: {self.total_detections}")
        
        if self.fps_list:
            print(f"FPS trung bình: {np.mean(self.fps_list):.2f}")
            print(f"FPS min: {np.min(self.fps_list):.2f}")
            print(f"FPS max: {np.max(self.fps_list):.2f}")
        
        if self.confidence_list:
            print(f"Confidence trung bình: {np.mean(self.confidence_list):.2f}")
            print(f"Confidence min: {np.min(self.confidence_list):.2f}")
            print(f"Confidence max: {np.max(self.confidence_list):.2f}")
        
        if self.total_frames > 0:
            avg_faces_per_frame = self.total_detections / self.total_frames
            print(f"Số khuôn mặt trung bình/frame: {avg_faces_per_frame:.2f}")
    
    def cleanup(self):
        """Giải phóng resources"""
        self.print_summary()
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    model_path = r"d:\BAI HOC\Intership_project\source code\LMS_face_service\models\yolov8m-face.pt"
    
    # Kiểm tra file tồn tại
    if not os.path.exists(model_path):
        print(f"CẢNH BÁO: Không tìm thấy file model tại {model_path}")
        print("Vui lòng kiểm tra lại đường dẫn!")
    else:
        # Khởi tạo tester
        tester = FaceDetectionTester(model_path=model_path)
        
        # Mở webcam
        tester.start_webcam(camera_id=0)
        
        # Chạy detection với confidence threshold = 0.5
        tester.run(conf_threshold=0.5)