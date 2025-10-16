import os
import glob

def rename_img(path):
    folder_path = os.path.normpath(path)
    prefix = os.path.basename(folder_path)
    img_extensions = ('*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif')
    img_files = []
    for i in img_extensions:
        img_files.extend(glob.glob(os.path.join(folder_path, i)))
    
    if not img_files:
        print("No image files found in the specified directory.")
        return
    
    for idx, file_path in enumerate(sorted(img_files),start=1):
        ext = os.path.splitext(file_path)[1].lower()
        new_name = f"{prefix}_{idx:02d}{ext}"
        new_path = os.path.join(folder_path, new_name)

        try:
            os.rename(file_path, new_path)
            print(f"Renamed: {file_path} -> {new_path}")
        except Exception as e:
            print(f"Error renaming {file_path} -> {new_path}: {e}")

def rename_image_folder(folder_path):
    path = os.path.normpath(folder_path)
    all_folders = [f.path for f in os.scandir(path) if f.is_dir()]
    for folder in all_folders:
        rename_img(folder)
    
    print("Renaming completed.")


if __name__ == "__main__":
    folder = r"LMS_face_service\dataset"
    rename_image_folder(folder)