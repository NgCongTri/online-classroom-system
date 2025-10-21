"""
Rebuild face embeddings database from dataset folder
"""
import requests
import base64
import os

FLASK_API = "http://localhost:5000/api/register-face"
DATASET_ROOT = "dataset"

def image_to_base64(image_path):
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def rebuild_database():
    """Rebuild entire face database from dataset folder"""
    print("🔄 Rebuilding face database...")
    
    for person_folder in os.listdir(DATASET_ROOT):
        person_path = os.path.join(DATASET_ROOT, person_folder)
        
        if not os.path.isdir(person_path):
            continue
        
        print(f"\n📁 Processing: {person_folder}")
        
        images_base64 = []
        for img_file in os.listdir(person_path):
            if not img_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            
            img_path = os.path.join(person_path, img_file)
            print(f"  📸 {img_file}...", end=' ')
            
            try:
                b64 = image_to_base64(img_path)
                images_base64.append(b64)
                print("✅")
            except Exception as e:
                print(f"❌ {e}")
        
        if images_base64:
            print(f"🔄 Registering {person_folder}...")
            response = requests.post(FLASK_API, json={
                'user_id': person_folder,
                'images': images_base64
            })
            
            result = response.json()
            if result.get('success'):
                print(f"✅ Registered {result.get('num_faces')} faces")
            else:
                print(f"❌ Failed: {result.get('error')}")
    
    print("\n✅ Database rebuild complete!")

if __name__ == '__main__':
    rebuild_database()
