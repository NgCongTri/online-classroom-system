import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_setting.settings')
django.setup()

from classroom.models import User

USERNAME = 'admin'
EMAIL = 'admin@lms.com'
PASSWORD = 'Admin@123'

if not User.objects.filter(username=USERNAME).exists():
    User.objects.create_superuser(
        username=USERNAME,
        email=EMAIL,
        password=PASSWORD,
        role='admin'
    )
    print("=" * 60)
    print("✅ SUPERUSER CREATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"Username: {USERNAME}")
    print(f"Password: {PASSWORD}")
    print(f"Email: {EMAIL}")
    print(f"Admin URL: https://lms-backend-0ans.onrender.com/admin/")
    print("=" * 60)
else:
    print("⚠️ Superuser already exists!")
    print(f"Username: {USERNAME}")