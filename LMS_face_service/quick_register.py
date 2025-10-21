"""
Quick register face using existing dataset images via API
"""
import requests
import base64
import os

# Config
FLASK_API = "http://localhost:5000/api/register-face"
DATASET_PATH = "dataset/congtri" 

def image_to_base64(image_path):
    """Convert image to base64"""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def register_user(user_id, images_base64):
    """Register user via API"""
    payload = {
        'user_id': user_id,
        'images': images_base64
    }
    
    response = requests.post(FLASK_API, json=payload)
    return response.json()

if __name__ == '__main__':
    # Get all images from dataset folder
    person_name = os.path.basename(DATASET_PATH)
    images_base64 = []
    
    print(f"📁 Processing: {person_name}")
    
    for img_file in os.listdir(DATASET_PATH):
        if not img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        
        img_path = os.path.join(DATASET_PATH, img_file)
        print(f"  📸 {img_file}...", end=' ')
        
        try:
            b64 = image_to_base64(img_path)
            images_base64.append(b64)
            print("✅")
        except Exception as e:
            print(f"❌ {e}")
    
    print(f"\n🔄 Registering {person_name} with {len(images_base64)} images...")
    
    result = register_user(person_name, images_base64)
    
    if result.get('success'):
        print(f"✅ SUCCESS!")
        print(f"   User: {result.get('user_id')}")
        print(f"   Images: {result.get('num_faces')}")
    else:
        print(f"❌ FAILED: {result.get('error')}")
