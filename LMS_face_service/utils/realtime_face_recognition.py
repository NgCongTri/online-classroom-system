"""
Real-time Face Recognition System - Multi-Person Version
========================================================
Sử dụng:
- YOLOv8m-face: Phát hiện khuôn mặt
- VGG-Face (keras-vggface): Trích xuất embedding (2622-dim, pretrained)
- Euclidean Distance: So sánh khoảng cách giữa embeddings
- Strict threshold: Chỉ nhận diện người có trong database

Author: Generated for Online Classroom System
Date: 2025-10-19
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import cv2
import numpy as np
from pathlib import Path
import time
import pickle
from ultralytics import YOLO
import tensorflow as tf
from tensorflow import keras

# ===========================
# Cấu hình đường dẫn
# ===========================
BASE_DIR = Path(r"D:\BAI HOC\Intership_project\source code\LMS_face_service")

YOLO_MODEL_PATH = BASE_DIR / "models" / "yolov8m-face.pt"
DATASET_PATH = BASE_DIR / "dataset"
DATABASE_FILE = BASE_DIR / "dataset" / "face_database.pkl"

REGISTERED_PEOPLE = [
    "congtri",  # Thêm tên thư mục của bạn
]

print("\n" + "="*60)
print("REGISTERED PEOPLE FOR RECOGNITION:")
for i, name in enumerate(REGISTERED_PEOPLE, 1):
    print(f"  {i}. {name}")
print("="*60 + "\n")

# ===========================
# VGG-Face ResNet50 Architecture (GIỐNG API!)
# ===========================
def create_vggface_resnet50():
    """Tạo model GIỐNG HỆT face_recognition_api.py"""
    from tensorflow.keras.applications.resnet import ResNet50
    from tensorflow.keras import layers, models
    
    print("  → Creating VGG-Face ResNet50 architecture...")
    
    base_model = ResNet50(
        include_top=False,
        weights='imagenet',
        input_shape=(224, 224, 3),
        pooling='avg'
    )
    
    base_model.trainable = False
    
    inputs = keras.Input(shape=(224, 224, 3))
    x = base_model(inputs, training=False)
    x = layers.Dense(2048, activation='relu', name='fc_embedding')(x)
    x = layers.Lambda(lambda x: keras.backend.l2_normalize(x, axis=1), name='normalize')(x)
    
    model = models.Model(inputs=inputs, outputs=x, name='vggface_resnet50')
    
    return model

def preprocess_face_for_vggface(face_img):
    """Preprocessing GIỐNG API"""
    face_resized = cv2.resize(face_img, (224, 224))
    face_float = face_resized.astype(np.float32)
    face_normalized = face_float / 127.5 - 1.0
    face_batch = np.expand_dims(face_normalized, axis=0)
    return face_batch

def euclidean_distance(embedding1, embedding2):
    """Tính khoảng cách Euclidean"""
    return float(np.linalg.norm(embedding1 - embedding2))

def detect_liveness_simple(face_img):
    """Liveness detection v2"""
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    dft = cv2.dft(np.float32(gray), flags=cv2.DFT_COMPLEX_OUTPUT)
    dft_shift = np.fft.fftshift(dft)
    magnitude_spectrum = np.log(cv2.magnitude(dft_shift[:,:,0], dft_shift[:,:,1]) + 1)
    
    rows, cols = gray.shape
    crow, ccol = rows//2, cols//2
    high_freq_mask = np.ones((rows, cols), np.uint8)
    r = 30
    center = [crow, ccol]
    x, y = np.ogrid[:rows, :cols]
    mask_area = (x - center[0])**2 + (y - center[1])**2 <= r*r
    high_freq_mask[mask_area] = 0
    high_freq_energy = np.sum(magnitude_spectrum * high_freq_mask) / np.sum(high_freq_mask)
    
    h, w = gray.shape
    grid_h, grid_w = h//4, w//4
    grid_means = []
    for i in range(4):
        for j in range(4):
            grid = gray[i*grid_h:(i+1)*grid_h, j*grid_w:(j+1)*grid_w]
            grid_means.append(np.mean(grid))
    brightness_uniformity = np.var(grid_means)
    
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    sobel_magnitude = np.sqrt(sobelx**2 + sobely**2)
    texture_complexity = sobel_magnitude.var()
    
    b, g, r = cv2.split(face_img)
    color_temp_ratio = (np.mean(b) / (np.mean(r) + 1e-5))
    
    brightness = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    bright_pixels = np.sum(brightness > 230)
    glare_ratio = bright_pixels / brightness.size
    
    scores = []
    
    if laplacian_var > 800:
        scores.append(100)
    elif laplacian_var > 400:
        scores.append(60)
    elif laplacian_var > 200:
        scores.append(30)
    else:
        scores.append(0)
    
    if high_freq_energy > 4.5:
        scores.append(100)
    elif high_freq_energy > 3.5:
        scores.append(60)
    else:
        scores.append(20)
    
    if brightness_uniformity > 100:
        scores.append(100)
    elif brightness_uniformity > 50:
        scores.append(60)
    else:
        scores.append(10)
    
    if texture_complexity > 500:
        scores.append(100)
    elif texture_complexity > 250:
        scores.append(50)
    else:
        scores.append(10)
    
    if color_temp_ratio < 1.05:
        scores.append(100)
    elif color_temp_ratio < 1.15:
        scores.append(60)
    else:
        scores.append(20)
    
    if glare_ratio < 0.01:
        scores.append(100)
    elif glare_ratio < 0.03:
        scores.append(60)
    else:
        scores.append(20)
    
    weights = [2.0, 1.5, 1.0, 1.5, 1.2, 1.0]
    liveness_confidence = np.average(scores, weights=weights)
    
    is_real = liveness_confidence >= 70
    
    return is_real, liveness_confidence

def create_registered_database(vggface_model, dataset_path, registered_names):
    """Tạo database cho người đã đăng ký"""
    print("\n" + "="*60)
    print("CREATING DATABASE FOR REGISTERED PEOPLE ONLY")
    print("="*60 + "\n")
    
    database = {}
    image_extensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']
    
    for person_name in registered_names:
        person_folder = dataset_path / person_name
        
        if not person_folder.exists():
            print(f"  ⚠ WARNING: Folder '{person_name}' not found!")
            continue
        
        image_files = []
        for ext in image_extensions:
            image_files.extend(list(person_folder.glob(f"*{ext}")))
        
        if len(image_files) == 0:
            print(f"  ⚠ {person_name}: No images found")
            continue
        
        print(f"[INFO] Processing {person_name} ({len(image_files)} images)...")
        
        MAX_IMAGES = 30
        if len(image_files) > MAX_IMAGES:
            image_files = image_files[:MAX_IMAGES]
        
        embeddings_list = []
        
        for i, img_path in enumerate(image_files, 1):
            try:
                img = cv2.imread(str(img_path))
                if img is None:
                    continue
                
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                face_batch = preprocess_face_for_vggface(img_rgb)
                embedding = vggface_model.predict(face_batch, verbose=0)
                embeddings_list.append(embedding[0])
                
                if i % 5 == 0:
                    print(f"  → Processed {i}/{len(image_files)} images...")
                
            except Exception as e:
                print(f"  ⚠ Error: {e}")
                continue
        
        if len(embeddings_list) == 0:
            print(f"  ✗ {person_name}: No valid embeddings")
            continue
        
        mean_embedding = np.mean(embeddings_list, axis=0)
        mean_embedding = mean_embedding / (np.linalg.norm(mean_embedding) + 1e-8)
        
        database[person_name] = mean_embedding
        
        print(f"  ✓ {person_name}: Created embedding from {len(embeddings_list)} images")
        print(f"    Shape: {mean_embedding.shape}, Norm: {np.linalg.norm(mean_embedding):.4f}\n")
    
    if len(database) == 0:
        print("[ERROR] No people registered!")
        return None
    
    print(f"[SUCCESS] Database created with {len(database)} people")
    
    with open(DATABASE_FILE, 'wb') as f:
        pickle.dump(database, f)
    print(f"[INFO] Database saved to: {DATABASE_FILE}\n")
    
    return database

def load_registered_database():
    """Load database"""
    if DATABASE_FILE.exists():
        with open(DATABASE_FILE, 'rb') as f:
            return pickle.load(f)
    return None

def recognize_face(face_embedding, database, threshold=0.30):
    """Nhận diện khuôn mặt"""
    if len(database) == 0:
        return ("Unknown", 999.0, 0.0)
    
    face_embedding = face_embedding / (np.linalg.norm(face_embedding) + 1e-8)
    
    distances = {}
    for person_name, person_embedding in database.items():
        dist = euclidean_distance(face_embedding, person_embedding)
        distances[person_name] = dist
    
    best_match = min(distances, key=distances.get)
    best_distance = distances[best_match]
    
    confidence_percent = max(0, min(100, (1 - best_distance / threshold) * 100))
    
    if best_distance < 0.15:
        confidence_percent = min(100, confidence_percent * 1.1)
    elif best_distance > threshold * 0.6:
        confidence_percent *= 0.75
    
    if best_distance > threshold:
        return ("Unknown", best_distance, confidence_percent)
    else:
        return (best_match, best_distance, confidence_percent)

def draw_face_box(frame, box, label, distance, color):
    """Vẽ box"""
    x1, y1, x2, y2 = map(int, box)
    
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
    
    text = f"{label} ({distance:.2f})"
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    thickness = 2
    
    (text_width, text_height), baseline = cv2.getTextSize(text, font, font_scale, thickness)
    
    cv2.rectangle(frame, 
                  (x1, y1 - text_height - 10), 
                  (x1 + text_width + 10, y1), 
                  color, -1)
    
    cv2.putText(frame, text, (x1 + 5, y1 - 5), 
                font, font_scale, (255, 255, 255), thickness)

def main():
    print("\n" + "="*60)
    print("SIMPLE FACE RECOGNITION - REBUILD DATABASE")
    print("YOLOv8m-face + VGG-Face ResNet50")
    print("="*60 + "\n")
    
    if not YOLO_MODEL_PATH.exists():
        print(f"[ERROR] YOLO not found: {YOLO_MODEL_PATH}")
        return
    
    if not DATASET_PATH.exists():
        print(f"[ERROR] Dataset not found: {DATASET_PATH}")
        return
    
    print("[STEP 1] Loading models...\n")
    
    yolo_model = YOLO(str(YOLO_MODEL_PATH))
    print("  ✓ YOLOv8m-face loaded\n")
    
    vggface_model = create_vggface_resnet50()
    print("  ✓ VGG-Face ResNet50 created\n")
    
    print("[STEP 2] Creating database...\n")
    
    database = create_registered_database(
        vggface_model, 
        DATASET_PATH, 
        REGISTERED_PEOPLE
    )
    
    if database is None or len(database) == 0:
        print("[ERROR] Failed to create database!")
        return
    
    print("\n[STEP 3] Opening webcam...\n")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("[ERROR] Cannot open webcam")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    print("  ✓ Webcam opened\n")
    
    print("[STEP 4] Starting recognition...\n")
    print("[CONTROLS]")
    print("  ESC - Exit")
    print("  'r' - Rebuild database")
    print("  '+' - Increase threshold")
    print("  '-' - Decrease threshold")
    print("\n" + "="*60 + "\n")
    
    fps_start = time.time()
    fps_counter = 0
    fps_display = 0
    
    DISTANCE_THRESHOLD = 0.30
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        fps_counter += 1
        if time.time() - fps_start >= 1.0:
            fps_display = fps_counter
            fps_counter = 0
            fps_start = time.time()
        
        results = yolo_model(frame, verbose=False)
        
        if len(results) > 0:
            boxes = results[0].boxes
            
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
                
                if conf < 0.5:
                    continue
                
                x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(frame.shape[1], x2)
                y2 = min(frame.shape[0], y2)
                
                face_crop = frame[y1:y2, x1:x2]
                
                if face_crop.size == 0:
                    continue
                
                try:
                    is_real, liveness_conf = detect_liveness_simple(face_crop)
                    
                    if not is_real:
                        color = (0, 0, 255)
                        label = f"FAKE ({liveness_conf:.1f}%)"
                        draw_face_box(frame, (x1, y1, x2, y2), label, 0, color)
                        continue
                    
                    face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                    face_batch = preprocess_face_for_vggface(face_rgb)
                    current_embedding = vggface_model.predict(face_batch, verbose=0)[0]
                    
                    person_name, distance, confidence = recognize_face(
                        current_embedding, 
                        database, 
                        threshold=DISTANCE_THRESHOLD
                    )
                    
                    if person_name == "Unknown":
                        color = (0, 0, 255)
                    elif confidence >= 85:
                        color = (0, 255, 0)
                    elif confidence >= 70:
                        color = (0, 255, 255)
                    else:
                        color = (0, 165, 255)
                    
                    label = f"{person_name} ({confidence:.1f}%)"
                    draw_face_box(frame, (x1, y1, x2, y2), label, distance, color)
                    
                except Exception as e:
                    continue
        
        cv2.putText(frame, f"FPS: {fps_display}", 
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        cv2.putText(frame, f"Threshold: {DISTANCE_THRESHOLD:.2f}", 
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        cv2.imshow("Face Recognition", frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == 27:
            break
        elif key == ord('r'):
            print("\n[INFO] Rebuilding database...")
            database = create_registered_database(
                vggface_model, 
                DATASET_PATH, 
                REGISTERED_PEOPLE
            )
        elif key == ord('+') or key == ord('='):
            DISTANCE_THRESHOLD = min(0.50, DISTANCE_THRESHOLD + 0.02)
            print(f"[INFO] Threshold: {DISTANCE_THRESHOLD:.2f}")
        elif key == ord('-') or key == ord('_'):
            DISTANCE_THRESHOLD = max(0.10, DISTANCE_THRESHOLD - 0.02)
            print(f"[INFO] Threshold: {DISTANCE_THRESHOLD:.2f}")
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] Interrupted")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
