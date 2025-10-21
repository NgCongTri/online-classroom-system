from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from pathlib import Path
import pickle
import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from ultralytics import YOLO
import tensorflow as tf
from tensorflow import keras

app = Flask(__name__)
CORS(app)

# Configuration
BASE_DIR = Path(__file__).parent
YOLO_MODEL_PATH = BASE_DIR / "models" / "yolov8m-face.pt"
DATABASE_FILE = BASE_DIR / "dataset" / "face_database.pkl"

yolo_model = None
vggface_model = None
face_database = {}

# ===========================
# VGG-Face ResNet50 Architecture
# ===========================
def create_vggface_resnet50():
    """
    Tạo VGG-Face ResNet50 architecture manually
    Không cần keras-vggface package
    """
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
    """Tiền xử lý ảnh cho VGG-Face"""
    face_resized = cv2.resize(face_img, (224, 224))
    face_float = face_resized.astype(np.float32)
    face_normalized = face_float / 127.5 - 1.0
    face_batch = np.expand_dims(face_normalized, axis=0)
    return face_batch

def euclidean_distance(embedding1, embedding2):
    """Tính khoảng cách Euclidean"""
    return float(np.linalg.norm(embedding1 - embedding2))

def detect_liveness_simple(face_img):
    """Liveness detection"""
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    
    # 1. Laplacian variance
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # 2. High frequency energy
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
    
    # 3. Brightness uniformity
    h, w = gray.shape
    grid_h, grid_w = h//4, w//4
    grid_means = []
    for i in range(4):
        for j in range(4):
            grid = gray[i*grid_h:(i+1)*grid_h, j*grid_w:(j+1)*grid_w]
            grid_means.append(np.mean(grid))
    brightness_uniformity = np.var(grid_means)
    
    # 4. Texture complexity
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    sobel_magnitude = np.sqrt(sobelx**2 + sobely**2)
    texture_complexity = sobel_magnitude.var()
    
    # 5. Color temperature
    b, g, r = cv2.split(face_img)
    color_temp_ratio = (np.mean(b) / (np.mean(r) + 1e-5))
    
    # 6. Glare detection
    brightness = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    bright_pixels = np.sum(brightness > 230)
    glare_ratio = bright_pixels / brightness.size
    
    # Scoring
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

def recognize_face(face_embedding, database, threshold=0.30):
    """Nhận diện khuôn mặt"""
    print(f"[DEBUG] Database size: {len(database)} people")
    
    if len(database) == 0:
        print("[WARNING] Empty database!")
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

def load_face_database():
    """Load database"""
    if DATABASE_FILE.exists():
        print(f"[INFO] Loading database from: {DATABASE_FILE}")
        with open(DATABASE_FILE, 'rb') as f:
            db = pickle.load(f)
        print(f"[INFO] Loaded {len(db)} people: {list(db.keys())}")
        return db
    else:
        print(f"[WARNING] Database file not found: {DATABASE_FILE}")
    return {}

def save_face_database():
    """Save database"""
    DATABASE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATABASE_FILE, 'wb') as f:
        pickle.dump(face_database, f)
    print(f"[INFO] Saved database with {len(face_database)} people")

def base64_to_image(base64_string):
    """Convert base64 to image"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    img_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

# ===========================
# Initialize Models
# ===========================
def init_models():
    """Initialize YOLO và VGG-Face"""
    global yolo_model, vggface_model, face_database
    
    print("[INFO] Initializing models...")
    
    # Load YOLO
    if YOLO_MODEL_PATH.exists():
        yolo_model = YOLO(str(YOLO_MODEL_PATH))
        print("  ✓ YOLOv8m-face loaded")
    else:
        print(f"  ✗ YOLO model not found: {YOLO_MODEL_PATH}")
        return False
    
    # Create VGG-Face model
    try:
        vggface_model = create_vggface_resnet50()
        print("  ✓ VGG-Face ResNet50 created (2048-dim embeddings)")
    except Exception as e:
        print(f"  ✗ Failed to create VGG-Face: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Load database
    face_database = load_face_database()
    print(f"  ✓ Database loaded ({len(face_database)} people)")
    
    if len(face_database) == 0:
        print("  ⚠ WARNING: Empty database! Use /api/register-face to add faces.")
    
    return True

# ===========================
# API Endpoints
# ===========================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'models_loaded': yolo_model is not None and vggface_model is not None,
        'database_size': len(face_database)
    })

@app.route('/api/recognize', methods=['POST'])
def recognize():
    """Nhận diện khuôn mặt từ ảnh base64"""
    try:
        data = request.json
        
        if 'image' not in data:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        img = base64_to_image(data['image'])
        
        if img is None:
            return jsonify({'success': False, 'error': 'Invalid image'}), 400
        
        threshold = data.get('threshold', 0.30)
        
        # Detect face
        results = yolo_model(img, verbose=False)
        
        if len(results) == 0 or len(results[0].boxes) == 0:
            return jsonify({
                'success': True,
                'recognized': False,
                'error': 'No face detected'
            })
        
        # Get first face
        box = results[0].boxes[0]
        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
        conf = float(box.conf[0].cpu().numpy())
        
        if conf < 0.5:
            return jsonify({
                'success': True,
                'recognized': False,
                'error': 'Face detection confidence too low'
            })
        
        # Crop face
        x1, y1 = max(0, x1), max(0, y1)
        x2 = min(img.shape[1], x2)
        y2 = min(img.shape[0], y2)
        face_crop = img[y1:y2, x1:x2]
        
        if face_crop.size == 0:
            return jsonify({
                'success': True,
                'recognized': False,
                'error': 'Invalid face crop'
            })
        
        # Liveness detection
        is_real, liveness_conf = detect_liveness_simple(face_crop)
        
        if not is_real:
            return jsonify({
                'success': True,
                'recognized': False,
                'is_real': False,
                'liveness_confidence': liveness_conf,
                'error': 'Fake face detected'
            })
        
        # Face recognition
        face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        face_batch = preprocess_face_for_vggface(face_rgb)
        embedding = vggface_model.predict(face_batch, verbose=0)[0]
        embedding = embedding / (np.linalg.norm(embedding) + 1e-8)
        
        # Recognize
        person_name, distance, confidence = recognize_face(
            embedding, 
            face_database, 
            threshold=threshold
        )
        
        if person_name == "Unknown":
            return jsonify({
                'success': True,
                'recognized': False,
                'is_real': True,
                'liveness_confidence': liveness_conf,
                'distance': distance,
                'confidence': confidence,
                'error': 'Unknown person'
            })
        
        # Success
        return jsonify({
            'success': True,
            'recognized': True,
            'user_id': person_name,
            'confidence': round(confidence, 2),
            'distance': round(distance, 4),
            'is_real': True,
            'liveness_confidence': round(liveness_conf, 2),
            'session_id': data.get('session_id')
        })
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/register-face', methods=['POST'])
def register_face():
    """Đăng ký khuôn mặt mới"""
    global face_database
    
    try:
        data = request.json
        
        if 'user_id' not in data or 'images' not in data:
            return jsonify({'success': False, 'error': 'Missing user_id or images'}), 400
        
        user_id = str(data['user_id'])
        images = data['images']
        
        if len(images) == 0:
            return jsonify({'success': False, 'error': 'No images provided'}), 400
        
        embeddings_list = []
        
        for img_base64 in images:
            img = base64_to_image(img_base64)
            if img is None:
                continue
            
            # Detect face first
            results = yolo_model(img, verbose=False)
            if len(results) == 0 or len(results[0].boxes) == 0:
                continue
            
            # Get first face
            box = results[0].boxes[0]
            x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
            
            # Crop and extract embedding
            face_crop = img[y1:y2, x1:x2]
            if face_crop.size == 0:
                continue
            
            face_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
            face_batch = preprocess_face_for_vggface(face_rgb)
            embedding = vggface_model.predict(face_batch, verbose=0)[0]
            embeddings_list.append(embedding)
        
        if len(embeddings_list) == 0:
            return jsonify({'success': False, 'error': 'No valid faces detected'}), 400
        
        # Average embeddings
        mean_embedding = np.mean(embeddings_list, axis=0)
        mean_embedding = mean_embedding / (np.linalg.norm(mean_embedding) + 1e-8)
        
        # Save to database
        face_database[user_id] = mean_embedding
        save_face_database()
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'num_faces': len(embeddings_list),
            'message': f'Registered {len(embeddings_list)} face embeddings for {user_id}'
        })
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/list-users', methods=['GET'])
def list_users():
    """List registered users"""
    return jsonify({
        'success': True,
        'users': list(face_database.keys()),
        'total': len(face_database)
    })

@app.route('/api/delete-user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user from database"""
    global face_database
    
    if user_id in face_database:
        del face_database[user_id]
        save_face_database()
        return jsonify({'success': True, 'message': f'Deleted {user_id}'})
    else:
        return jsonify({'success': False, 'error': 'User not found'}), 404

# ===========================
# Main
# ===========================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("FACE RECOGNITION API SERVICE")
    print("YOLOv8m-face + VGG-Face ResNet50")
    print("="*60 + "\n")
    
    if init_models():
        print("\n[SUCCESS] All models loaded!")
        print("[INFO] Starting Flask server on http://localhost:5000")
        print("\n[ENDPOINTS]")
        print("  - GET  /api/health")
        print("  - POST /api/recognize")
        print("  - POST /api/register-face")
        print("  - GET  /api/list-users")
        print("  - DELETE /api/delete-user/<user_id>")
        print("\n" + "="*60 + "\n")
        
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        print("\n[ERROR] Failed to initialize models!")
